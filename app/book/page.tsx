'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Shield, ShieldAlert, ShieldCheck, Star } from 'lucide-react'

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
  const [clientNote, setClientNote] = useState('')

  // Intro package state
  const [introMode, setIntroMode] = useState(false)
  const [introStep, setIntroStep] = useState<1 | 2>(1) // which session they're picking
  const [introSession1, setIntroSession1] = useState<{ date: any, slot: number } | null>(null)
  const [introSession2, setIntroSession2] = useState<{ date: any, slot: number } | null>(null)
  const [introAvailableSlots2, setIntroAvailableSlots2] = useState<number[]>([])

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
      const earliest = new Date('2025-05-15T00:00:00')
const today = new Date(); today.setHours(0, 0, 0, 0)
const startDate = today > earliest ? today : earliest
      for (let i = 1; i <= 30; i++) {
        const date = new Date(startDate); date.setDate(startDate.getDate() + i)
        const dayOfWeek = date.getDay()
        const window = windows.find((w: any) => w.day_of_week === dayOfWeek)
        if (window) dates.push({ date, dateStr: date.toISOString().split('T')[0], dayName: DAYS[dayOfWeek], window })
      }
      setAvailableDates(dates)
      setLoading(false)
    }
    init()
  }, [])

  // When a dog is selected, determine if intro mode applies
  useEffect(() => {
    if (selectedDogIds.length !== 1) { setIntroMode(false); return }
    const dog = dogs.find(d => d.id === selectedDogIds[0])
    if (!dog) { setIntroMode(false); return }
    // Intro mode: dog has never purchased intro package
    setIntroMode(!dog.intro_purchased)
    // Reset intro state when dog changes
    setIntroStep(1)
    setIntroSession1(null)
    setIntroSession2(null)
    setSelectedDate(null)
    setSelectedSlot(null)
  }, [selectedDogIds, dogs])

  const getAvailableSlotsForDate = async (dateObj: any, excludeDate?: string, excludeSlot?: number) => {
    const slots = []
    for (let h = dateObj.window.start_hour; h < dateObj.window.end_hour; h++) slots.push(h)
    const { data: existingBookings } = await supabase.from('bookings').select('slot_hour').eq('booking_date', dateObj.dateStr).eq('status', 'confirmed')
    const slotCounts: Record<number, number> = {}
    existingBookings?.forEach((b: any) => { slotCounts[b.slot_hour] = (slotCounts[b.slot_hour] || 0) + 1 })
    let available = slots.filter(h => (slotCounts[h] || 0) < 2)
    // For session 2, exclude the same slot if same date as session 1
    if (excludeDate && excludeSlot !== undefined && dateObj.dateStr === excludeDate) {
      available = available.filter(h => h !== excludeSlot)
    }
    return available
  }

  const handleDateSelect = async (dateObj: any) => {
    if (introMode && introStep === 2) {
      setIntroSession2(prev => ({ ...prev, date: dateObj, slot: -1 } as any))
      const slots = await getAvailableSlotsForDate(dateObj, introSession1?.date?.dateStr, introSession1?.slot)
      setIntroAvailableSlots2(slots)
      return
    }
    setSelectedDate(dateObj); setSelectedSlot(null)
    const slots = await getAvailableSlotsForDate(dateObj)
    setAvailableSlots(slots)
  }

  const toggleDog = (dogId: string) => {
    // Intro mode only supports one dog at a time
    setSelectedDogIds(prev => prev.includes(dogId) ? prev.filter(id => id !== dogId) : [...prev, dogId])
  }

  const handleConfirmSession1 = () => {
    if (!selectedDate || selectedSlot === null) return
    setIntroSession1({ date: selectedDate, slot: selectedSlot })
    setIntroStep(2)
    setSelectedDate(null)
    setSelectedSlot(null)
    setAvailableSlots([])
  }

  const handleBook = async () => {
    if (introMode) {
      if (!introSession1 || !introSession2 || introSession2.slot < 0) return
      setBooking(true); setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          ownerEmail: user?.email,
          type: 'intro',
          dogIds: selectedDogIds,
          introBookings: [
            { date: introSession1.date.dateStr, slotHour: introSession1.slot },
            { date: introSession2.date.dateStr, slotHour: introSession2.slot },
          ]
        })
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setError('Something went wrong. Please try again.')
      setBooking(false)
      return
    }

    // Normal flow
    if (!selectedDate || selectedSlot === null || selectedDogIds.length === 0) return
    setBooking(true); setError(null)
    const { data: existingBookings } = await supabase.from('bookings').select('id').eq('booking_date', selectedDate.dateStr).eq('slot_hour', selectedSlot).eq('status', 'confirmed')
    if ((existingBookings?.length || 0) + selectedDogIds.length > 2) { setError('This slot is no longer available. Please choose another time.'); setBooking(false); return }

    const { data: membershipsData } = await supabase.from('memberships').select('*').eq('owner_id', ownerId).eq('status', 'active')
    const membershipsMap: Record<string, any> = {}
    for (const m of membershipsData || []) membershipsMap[m.dog_id] = m

    const coveredDogs = selectedDogIds.filter((id: string) => membershipsMap[id] && membershipsMap[id].sessions_remaining > 0)
    const uncoveredDogs = selectedDogIds.filter((id: string) => !membershipsMap[id] || membershipsMap[id].sessions_remaining <= 0)

    if (uncoveredDogs.length > 0) {
      const res = await fetch('/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId, ownerEmail: (await supabase.auth.getUser()).data.user?.email, type: 'alacarte', dogCount: uncoveredDogs.length, dogIds: uncoveredDogs, bookingDate: selectedDate.dateStr, slotHour: selectedSlot }) })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
    }

    const { data: { session: authSession } } = await supabase.auth.getSession()
    for (const dogId of coveredDogs) {
      await fetch('/api/booking-decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession?.access_token}` },
        body: JSON.stringify({ dogId })
      })
    }
    const { error: bookingError } = await supabase.from('bookings').insert(selectedDogIds.map(dogId => ({ dog_id: dogId, booking_date: selectedDate.dateStr, slot_hour: selectedSlot, status: 'confirmed', client_note: clientNote.trim() || null })))
    if (bookingError) { setError(bookingError.message); setBooking(false); return }
    const { data: ownerData } = await supabase.from('owners').select('name, email, phone, sms_consent').eq('id', ownerId).single()
    const selectedDogData = dogs.find(d => d.id === selectedDogIds[0])
    const ampm = selectedSlot >= 12 ? 'PM' : 'AM'
    const hour = selectedSlot > 12 ? selectedSlot - 12 : selectedSlot === 0 ? 12 : selectedSlot
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
    const dateStr = new Date(selectedDate.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (ownerData?.email) await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'booking_confirmation', to: ownerData.email, data: { ownerName: ownerData.name, dogName: selectedDogData?.name, date: dateStr, time: timeStr } }) })
    if (ownerData?.phone && ownerData?.sms_consent) await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'booking_confirmation', to: ownerData.phone, data: { ownerName: ownerData.name, dogName: selectedDogData?.name, date: dateStr, time: timeStr } }) })
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

  const hasVaccineWarnings = selectedDogIds.some(id => vaccineStatus[id] !== 'approved')
  const introSession2Ready = introSession2 && introSession2.slot >= 0
  const introReadyToCheckout = introSession1 && introSession2Ready

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: '64px', width: 'auto', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ width: '180px', height: '3px', background: '#f0f2f7', borderRadius: '2px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ height: '100%', background: '#f88124', borderRadius: '2px', animation: 'sweep 1.2s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes sweep { 0% { width: 0%; marginLeft: 0%; } 50% { width: 60%; } 100% { width: 0%; marginLeft: 100%; } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '700px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Book a Session</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Available times in <strong style={{ color: '#2c5a9e' }}>{ownerCity}</strong></p>
        </div>

        {/* Vaccine notice */}
        {dogs.length > 0 && dogs.every(d => !vaccineStatus[d.id]) && (
          <div style={{ background: '#fff8e6', border: '1.5px solid #ffe08a', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', background: '#fff0c0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} color="#856404" />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#856404', fontSize: '14px' }}>Vaccine Records Needed</p>
              <p style={{ margin: '0 0 10px', color: '#856404', fontSize: '13px', lineHeight: 1.6 }}>You can book now, but your dog's vaccine records must be uploaded and approved before your first session can take place.</p>
              <a href="/dogs" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#856404', color: 'white', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
                <Shield size={13} /> Upload Records
              </a>
            </div>
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
            <a href="/dashboard" style={{ background: '#2c5a9e', color: 'white', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-block' }}>
              Back to Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Dog selector */}
            {dogs.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PawPrint size={17} color="#2c5a9e" />
                  </div>
                  <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Which dog?</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {dogs.map(dog => {
                    const badge = getDogVaccineBadge(dog.id)
                    const isApproved = vaccineStatus[dog.id] === 'approved'
                    const isSelected = selectedDogIds.includes(dog.id)
                    const isPending = vaccineStatus[dog.id] === 'pending'
                    return (
                      <div key={dog.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                        <button onClick={() => toggleDog(dog.id)}
                          style={{ padding: '9px 18px', borderRadius: '10px', border: '1.5px solid', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', transition: 'all 0.15s',
                            borderColor: isSelected ? '#2c5a9e' : isApproved ? '#e5e8f0' : '#ffe08a',
                            background: isSelected ? '#2c5a9e' : isApproved ? 'white' : '#fffbf0',
                            color: isSelected ? 'white' : '#1a1a2e' }}>
                          {dog.photo_url
                            ? <img src={dog.photo_url} alt={dog.name} style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
                            : <PawPrint size={15} />}
                          {dog.name}
                          {isApproved && <ShieldCheck size={13} color={isSelected ? 'rgba(255,255,255,0.7)' : '#28a745'} />}
                        </button>
                        {badge && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, color: badge.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {badge.icon} {badge.label}
                            {!isPending && <a href="/dogs" style={{ color: badge.color, marginLeft: '2px' }}>→ Upload</a>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── INTRO MODE ── */}
            {introMode && selectedDogIds.length === 1 && (
              <>
                {/* Intro package banner */}
                <div style={{ background: 'linear-gradient(135deg, #1a3d73, #2c5a9e)', borderRadius: '16px', padding: '24px', marginBottom: '16px', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#f88124', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Star size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '800', fontSize: '16px' }}>Intro Package</p>
                      <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>First-time dogs only</p>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: '900', fontSize: '22px' }}>$85</p>
                      <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>2 sessions</p>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.65, opacity: 0.85 }}>
                    Some dogs take a session or two to get comfortable on the slatmill — that's totally normal. This package gets your pup two sessions to find their stride. We recommend at least one week between sessions, or both in the same week since we're in your city twice.
                  </p>
                  {/* Progress indicator */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: introStep >= 1 ? '#f88124' : 'rgba(255,255,255,0.2)' }} />
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: introStep >= 2 ? '#f88124' : 'rgba(255,255,255,0.2)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', opacity: introStep >= 1 ? 1 : 0.4, fontWeight: '700', color: introStep >= 1 ? '#f88124' : 'white' }}>Session 1</span>
                    <span style={{ fontSize: '11px', opacity: introStep >= 2 ? 1 : 0.4, fontWeight: '700', color: introStep >= 2 ? '#f88124' : 'white' }}>Session 2</span>
                  </div>
                </div>

                {/* Session 1 confirmed summary */}
                {introSession1 && (
                  <div style={{ background: '#f0faf4', border: '1.5px solid #b8dfc4', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={18} color="#155724" />
                    <div>
                      <p style={{ margin: 0, fontWeight: '800', fontSize: '13px', color: '#155724' }}>Session 1 selected</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#388a54' }}>
                        {introSession1.date.dayName}, {new Date(introSession1.date.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {formatHour(introSession1.slot)}
                      </p>
                    </div>
                    <button onClick={() => { setIntroSession1(null); setIntroStep(1); setSelectedDate(null); setSelectedSlot(null) }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
                      Change
                    </button>
                  </div>
                )}

                {/* Date picker for current intro step */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={17} color="#2c5a9e" />
                    </div>
                    <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>
                      {introStep === 1 ? 'Pick a date for Session 1' : 'Pick a date for Session 2'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {availableDates.map(dateObj => {
                      const isSelected = introStep === 1
                        ? selectedDate?.dateStr === dateObj.dateStr
                        : introSession2?.date?.dateStr === dateObj.dateStr
                      return (
                        <button key={dateObj.dateStr} onClick={() => handleDateSelect(dateObj)}
                          style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', borderColor: isSelected ? '#2c5a9e' : '#e5e8f0', background: isSelected ? '#2c5a9e' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{dateObj.dayName}</div>
                          <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>{new Date(dateObj.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time picker for current intro step */}
                {(introStep === 1 ? selectedDate : introSession2?.date) && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '34px', height: '34px', background: '#fff5e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={17} color="#f88124" />
                      </div>
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>
                        {introStep === 1 ? 'Pick a time for Session 1' : 'Pick a time for Session 2'}
                      </span>
                    </div>
                    {(introStep === 1 ? availableSlots : introAvailableSlots2).length === 0
                      ? <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>No available slots for this date. Please choose another day.</p>
                      : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                          {(introStep === 1 ? availableSlots : introAvailableSlots2).map(hour => {
                            const isSelected = introStep === 1 ? selectedSlot === hour : introSession2?.slot === hour
                            return (
                              <button key={hour}
                                onClick={() => {
                                  if (introStep === 1) {
                                    setSelectedSlot(hour)
                                  } else {
                                    setIntroSession2(prev => ({ ...prev!, slot: hour }))
                                  }
                                }}
                                style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.15s', borderColor: isSelected ? '#f88124' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #f88124, #f9a04e)' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                                {formatHour(hour)}
                              </button>
                            )
                          })}
                        </div>
                    }
                  </div>
                )}

                {/* Step 1 → Step 2 button */}
                {introStep === 1 && selectedDate && selectedSlot !== null && (
                  <button onClick={handleConfirmSession1}
                    style={{ width: '100%', padding: '15px', background: '#2c5a9e', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                    <CheckCircle size={18} /> Confirm Session 1 — Pick Session 2
                  </button>
                )}

                {/* Vaccine warning */}
                {hasVaccineWarnings && introReadyToCheckout && (
                  <div style={{ background: '#ffeaea', border: '1.5px solid #ffc5c5', borderRadius: '14px', padding: '18px 20px', marginBottom: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <ShieldAlert size={20} color="#dc3545" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#dc3545', fontSize: '14px' }}>Vaccine Records Pending</p>
                      <p style={{ margin: 0, color: '#721c24', fontSize: '13px', lineHeight: 1.6 }}>You can complete this booking, but vaccine records must be approved before sessions can take place.</p>
                    </div>
                  </div>
                )}

                {/* Checkout button */}
                {introReadyToCheckout && (
                  <button onClick={handleBook} disabled={booking}
                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(248,129,36,0.4)' }}>
                    <CheckCircle size={20} />
                    {booking ? 'Redirecting to checkout…' : 'Purchase Intro Package — $85'}
                  </button>
                )}
              </>
            )}

            {/* ── NORMAL MODE ── */}
            {!introMode && selectedDogIds.length > 0 && (
              <>
                {/* Date picker */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={17} color="#2c5a9e" />
                    </div>
                    <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Pick a date</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {availableDates.map(dateObj => {
                      const isSelected = selectedDate?.dateStr === dateObj.dateStr
                      return (
                        <button key={dateObj.dateStr} onClick={() => handleDateSelect(dateObj)}
                          style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', borderColor: isSelected ? '#2c5a9e' : '#e5e8f0', background: isSelected ? '#2c5a9e' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{dateObj.dayName}</div>
                          <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>{new Date(dateObj.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time picker */}
                {selectedDate && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '34px', height: '34px', background: '#fff5e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={17} color="#f88124" />
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
                                style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.15s', borderColor: isSelected ? '#f88124' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #f88124, #f9a04e)' : 'white', color: isSelected ? 'white' : '#1a1a2e' }}>
                                {formatHour(hour)}
                              </button>
                            )
                          })}
                        </div>
                    }
                  </div>
                )}

                {/* Note to trainer */}
                {selectedDate && selectedSlot !== null && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '34px', height: '34px', background: '#fff0ea', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PawPrint size={17} color="#f88124" />
                      </div>
                      <div>
                        <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px', display: 'block' }}>Note for your trainer</span>
                        <span style={{ color: '#aaa', fontSize: '12px' }}>Optional — anything we should know</span>
                      </div>
                    </div>
                    <textarea
                      value={clientNote}
                      onChange={e => setClientNote(e.target.value)}
                      placeholder="e.g. She's been a bit low energy this week…"
                      rows={3}
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e8f0', borderRadius: '12px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: '1.7', boxSizing: 'border-box' as const }}
                      onFocus={e => e.target.style.borderColor = '#f88124'}
                      onBlur={e => e.target.style.borderColor = '#e5e8f0'}
                    />
                  </div>
                )}

                {/* Vaccine warning */}
                {selectedDogIds.length > 0 && hasVaccineWarnings && selectedDate && selectedSlot !== null && (
                  <div style={{ background: '#ffeaea', border: '1.5px solid #ffc5c5', borderRadius: '14px', padding: '18px 20px', marginBottom: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldAlert size={20} color="#dc3545" />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#dc3545', fontSize: '14px' }}>Vaccine Records Pending</p>
                      <p style={{ margin: '0 0 10px', color: '#721c24', fontSize: '13px', lineHeight: 1.6 }}>
                        You can complete this booking, but vaccine records must be approved before the session can take place.
                      </p>
                      <a href="/dogs" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dc3545', color: 'white', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
                        <Shield size={13} /> Upload Records
                      </a>
                    </div>
                  </div>
                )}

                {/* Confirm button */}
                {selectedDate && selectedSlot !== null && selectedDogIds.length > 0 && (
                  <button onClick={handleBook} disabled={booking}
                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(255,107,53,0.4)' }}>
                    <CheckCircle size={20} />
                    {booking ? 'Booking…' : `Confirm — ${selectedDate.dayName}, ${formatHour(selectedSlot)}`}
                  </button>
                )}
              </>
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