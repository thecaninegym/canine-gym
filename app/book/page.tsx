'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookSession() {
  const [dogs, setDogs] = useState<any[]>([])
  const [vaccineStatus, setVaccineStatus] = useState<Record<string, string>>({})
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([])
  const [ownerCity, setOwnerCity] = useState('')
  const [availableDates, setAvailableDates] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<number[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ownerId, setOwnerId] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('*, dogs(*, leaderboard_settings(city))').eq('email', user.email).single()
      if (!ownerData) { setLoading(false); return }
      setDogs(ownerData.dogs || [])
      setOwnerCity(ownerData.dogs?.[0]?.leaderboard_settings?.city || '')
      setOwnerId(ownerData.id)
      if (ownerData.dogs?.length > 0) {
        const dogIds = ownerData.dogs.map((d: any) => d.id)
        const { data: vaccineData } = await supabase.from('dog_vaccines').select('dog_id, status').in('dog_id', dogIds).order('uploaded_at', { ascending: false })
        const statusMap: Record<string, string> = {}
        for (const v of (vaccineData || [])) { if (!statusMap[v.dog_id]) statusMap[v.dog_id] = v.status }
        setVaccineStatus(statusMap)
      }
      const { data: windows } = await supabase.from('schedule_windows').select('*').eq('city', ownerData.dogs?.[0]?.leaderboard_settings?.city || '').eq('is_active', true)
      if (!windows) { setLoading(false); return }
      const dates = []
      const today = new Date(); today.setHours(0, 0, 0, 0)
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today); date.setDate(today.getDate() + i)
        const dayOfWeek = date.getDay()
        const window = windows.find((w: any) => w.day_of_week === dayOfWeek)
        if (window) dates.push({ date, dateStr: date.toISOString().split('T')[0], dayName: DAYS[dayOfWeek], window })
      }
      setAvailableDates(dates)
      setLoading(false)
    }
    init()
  }, [])

  const handleDateSelect = async (dateObj: any) => {
    setSelectedDate(dateObj); setSelectedSlot(null)
    const slots = []
    for (let h = dateObj.window.start_hour; h < dateObj.window.end_hour; h++) slots.push(h)
    const { data: existingBookings } = await supabase.from('bookings').select('slot_hour').eq('booking_date', dateObj.dateStr).eq('status', 'confirmed')
    const slotCounts: Record<number, number> = {}
    existingBookings?.forEach((b: any) => { slotCounts[b.slot_hour] = (slotCounts[b.slot_hour] || 0) + 1 })
    setAvailableSlots(slots.filter(h => (slotCounts[h] || 0) < 2))
  }

  const toggleDog = (dogId: string) => {
    if (vaccineStatus[dogId] !== 'approved') return
    setSelectedDogIds(prev => prev.includes(dogId) ? prev.filter(id => id !== dogId) : [...prev, dogId])
  }

  const handleBook = async () => {
    if (!selectedDate || selectedSlot === null || selectedDogIds.length === 0) return
    setBooking(true); setError(null)
    const { data: existingBookings } = await supabase.from('bookings').select('id').eq('booking_date', selectedDate.dateStr).eq('slot_hour', selectedSlot).eq('status', 'confirmed')
    if ((existingBookings?.length || 0) + selectedDogIds.length > 2) { setError('This slot is no longer available. Please choose another time.'); setBooking(false); return }
    const { data: membershipData } = await supabase.from('memberships').select('*').eq('owner_id', ownerId).eq('status', 'active').single()
    const coveredDogs = membershipData?.dog_ids || []
    const bookedCoveredDogs = selectedDogIds.filter((id: string) => coveredDogs.includes(id))
    const uncoveredDogs = selectedDogIds.filter((id: string) => !coveredDogs.includes(id))
    if (uncoveredDogs.length > 0) {
      const res = await fetch('/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId, ownerEmail: (await supabase.auth.getUser()).data.user?.email, type: 'alacarte', dogCount: uncoveredDogs.length, dogIds: uncoveredDogs, bookingDate: selectedDate.dateStr, slotHour: selectedSlot }) })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
    }
    if (bookedCoveredDogs.length > 0) {
      if (membershipData.sessions_remaining <= 0) { setError('You have no sessions remaining on your membership this month.'); setBooking(false); return }
      await supabase.from('memberships').update({ sessions_remaining: membershipData.sessions_remaining - bookedCoveredDogs.length }).eq('id', membershipData.id)
    }
    const { error: bookingError } = await supabase.from('bookings').insert(selectedDogIds.map(dogId => ({ dog_id: dogId, booking_date: selectedDate.dateStr, slot_hour: selectedSlot, status: 'confirmed' })))
    if (bookingError) { setError(bookingError.message); setBooking(false); return }
    const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', ownerId).single()
    const selectedDogData = dogs.find(d => d.id === selectedDogIds[0])
    const ampm = selectedSlot >= 12 ? 'PM' : 'AM'
    const hour = selectedSlot > 12 ? selectedSlot - 12 : selectedSlot === 0 ? 12 : selectedSlot
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
    const dateStr = new Date(selectedDate.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (ownerData?.email) await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'booking_confirmation', to: ownerData.email, data: { ownerName: ownerData.name, dogName: selectedDogData?.name, date: dateStr, time: timeStr } }) })
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'admin_notification', to: 'dev@thecaninegym.com', data: { action: 'New Booking', dogName: selectedDogData?.name, ownerName: ownerData?.name, date: dateStr, time: timeStr } }) })
    setSuccess(true); setBooking(false)
  }

  const formatHour = (h: number) => { const ampm = h >= 12 ? 'PM' : 'AM'; const hour = h > 12 ? h - 12 : h === 0 ? 12 : h; return `${hour}:00 ${ampm} – ${hour}:30 ${ampm}` }

  const getDogVaccineBadge = (dogId: string) => {
    const s = vaccineStatus[dogId]
    if (s === 'approved') return null
    if (s === 'pending') return { color: '#856404', bg: '#fff3cd', icon: <Clock size={11} />, label: 'Pending Review' }
    if (s === 'rejected') return { color: '#dc3545', bg: '#ffeaea', icon: <ShieldAlert size={11} />, label: 'Vaccines Rejected' }
    return { color: '#dc3545', bg: '#ffeaea', icon: <Shield size={11} />, label: 'Vaccines Required' }
  }

  const allDogsBlocked = dogs.length > 0 && dogs.every(d => vaccineStatus[d.id] !== 'approved')
  const allSelectedApproved = selectedDogIds.every(id => vaccineStatus[id] === 'approved')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PawPrint size={20} color="#FF6B35" />
          </div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>The Canine Gym</span>
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '700px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Book a Session</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Available times in <strong style={{ color: '#003087' }}>{ownerCity}</strong></p>
        </div>

        {/* All dogs blocked */}
        {allDogsBlocked && (
          <div style={{ background: 'white', border: '1.5px solid #ffc5c5', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '56px', height: '56px', background: '#ffeaea', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldAlert size={28} color="#dc3545" />
            </div>
            <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800', fontSize: '17px' }}>Vaccine Records Required</h3>
            <p style={{ color: '#888', margin: '0 0 20px', lineHeight: 1.6, fontSize: '14px' }}>All of your dogs need approved vaccine records before booking. Upload their records from your dog profiles — we'll review within 24 hours.</p>
            <a href="/dogs" style={{ background: 'linear-gradient(135deg, #dc3545, #e55)', color: 'white', padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Shield size={15} /> Upload Vaccine Records
            </a>
          </div>
        )}

        {/* Success state */}
        {success ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #b8dfc4' }}>
            <div style={{ width: '64px', height: '64px', background: '#d4edda', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#155724" />
            </div>
            <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800', fontSize: '20px' }}>Session Booked!</h3>
            <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px' }}>
              {selectedDate?.dayName}, {new Date(selectedDate?.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {formatHour(selectedSlot!)}
            </p>
            <a href="/dashboard" style={{ background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-block' }}>
              Back to Dashboard
            </a>
          </div>
        ) : !allDogsBlocked && (
          <>
            {/* Dog selector */}
            {dogs.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '34px', height: '34px', background: '#e8edf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PawPrint size={17} color="#003087" />
                  </div>
                  <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Which dog(s)?</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {dogs.map(dog => {
                    const badge = getDogVaccineBadge(dog.id)
                    const isApproved = vaccineStatus[dog.id] === 'approved'
                    const isSelected = selectedDogIds.includes(dog.id)
                    return (
                      <div key={dog.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                        <button onClick={() => toggleDog(dog.id)} disabled={!isApproved}
                          style={{ padding: '9px 18px', borderRadius: '10px', border: '1.5px solid', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', cursor: isApproved ? 'pointer' : 'not-allowed', opacity: isApproved ? 1 : 0.55, transition: 'all 0.15s', borderColor: isSelected ? '#003087' : isApproved ? '#e5e8f0' : '#ffc5c5', background: isSelected ? 'linear-gradient(135deg, #003087, #0052cc)' : isApproved ? 'white' : '#fff5f5', color: isSelected ? 'white' : '#1a1a2e' }}>
                          {dog.photo_url
                            ? <img src={dog.photo_url} alt={dog.name} style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
                            : <PawPrint size={15} />}
                          {dog.name}
                          {isApproved && <ShieldCheck size={13} color={isSelected ? 'rgba(255,255,255,0.7)' : '#28a745'} />}
                        </button>
                        {badge && (
                          <a href="/dogs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, color: badge.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
                            {badge.icon} {badge.label} → Fix
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Date picker */}
            {selectedDogIds.length > 0 && allSelectedApproved && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '34px', height: '34px', background: '#e8edf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={17} color="#003087" />
                  </div>
                  <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Pick a date</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {availableDates.map(dateObj => {
                    const isSelected = selectedDate?.dateStr === dateObj.dateStr
                    return (
                      <button key={dateObj.dateStr} onClick={() => handleDateSelect(dateObj)}
                        style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', borderColor: isSelected ? '#003087' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #003087, #0052cc)' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>{dateObj.dayName}</div>
                        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>{new Date(dateObj.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Time picker */}
            {selectedDate && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '34px', height: '34px', background: '#fff5e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={17} color="#FF6B35" />
                  </div>
                  <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Pick a time</span>
                </div>
                {availableSlots.length === 0
                  ? <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>No available slots for this date. Please choose another day.</p>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                      {availableSlots.map(hour => {
                        const isSelected = selectedSlot === hour
                        return (
                          <button key={hour} onClick={() => setSelectedSlot(hour)}
                            style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.15s', borderColor: isSelected ? '#FF6B35' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #FF6B35, #ff8c5a)' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                            {formatHour(hour)}
                          </button>
                        )
                      })}
                    </div>
                }
              </div>
            )}

            {/* Confirm button */}
            {selectedDate && selectedSlot !== null && selectedDogIds.length > 0 && allSelectedApproved && (
              <button onClick={handleBook} disabled={booking}
                style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(255,107,53,0.4)' }}>
                <CheckCircle size={20} />
                {booking ? 'Booking…' : `Confirm — ${selectedDate.dayName}, ${formatHour(selectedSlot)}`}
              </button>
            )}

            {error && (
              <div style={{ background: '#ffeaea', color: '#dc3545', padding: '13px 18px', borderRadius: '12px', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}