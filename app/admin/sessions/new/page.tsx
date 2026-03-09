'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { checkAchievements } from '../../../../lib/achievements'
import { PawPrint, ArrowLeft, ClipboardList, CheckCircle, Clock } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700' as const, color: '#555', fontSize: '13px' }

export default function LogSession() {
  const [dogs, setDogs] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [dogId, setDogId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [deviceSlug, setDeviceSlug] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFromBooking, setTimeFromBooking] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dogParam = params.get('dog')
    const bookingParam = params.get('booking')
    const hourParam = params.get('hour')
    const dateParam = params.get('date')
    if (dogParam) setDogId(dogParam)
    if (bookingParam) setBookingId(bookingParam)
    if (dateParam) setSessionDate(dateParam)
    if (hourParam) {
      const h = parseInt(hourParam)
      setStartTime(`${String(h).padStart(2, '0')}:00`)
      setEndTime(`${String(h).padStart(2, '0')}:30`)
      setTimeFromBooking(true)
    }
    const fetchData = async () => {
      const { data: dogsData } = await supabase.from('dogs').select('*, owner_id, owners(name), leaderboard_settings(city)').order('name')
      setDogs(dogsData || [])
      const { data: devicesData } = await supabase.from('devices').select('*').order('device_name')
      setDevices(devicesData || [])
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const start = new Date(`${sessionDate}T${startTime}`)
    const end = new Date(`${sessionDate}T${endTime}`)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)
    const { error: sessionError } = await supabase.from('sessions').insert([{ dog_id: dogId, fitbark_device_slug: deviceSlug, session_date: sessionDate, start_time: start.toISOString(), end_time: end.toISOString(), duration_minutes: duration, notes }])
    if (sessionError) { setError(sessionError.message); setLoading(false); return }
    if (bookingId) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    } else {
      await supabase.from('bookings').update({ status: 'completed' }).eq('dog_id', dogId).eq('booking_date', sessionDate).eq('status', 'confirmed')
    }

    // Decrement sessions_remaining via API (uses service key to bypass RLS)
    const selectedDogDataForMembership = dogs.find(d => d.id === dogId)
    if (selectedDogDataForMembership?.owner_id) {
      await fetch('/api/decrement-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: selectedDogDataForMembership.owner_id })
      })
    }

    const newAchievements = await checkAchievements(dogId)
    const selectedDogData = dogs.find(d => d.id === dogId)
    const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', selectedDogData?.owner_id).single()
    if (ownerData?.email) {
      await fetch('/api/send-session-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: ownerData.email, ownerName: ownerData.name, dogName: selectedDogData?.name, sessionDate: new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), duration, miles: null, calories: null, notes, achievementsUnlocked: newAchievements.map((a: any) => a.label) })
      })
    }
    setSuccess(true)
    setDeviceSlug('')
    setNotes('')
    setLoading(false)
  }

  const selectedDog = dogs.find(d => d.id === dogId)

  const formatTimeDisplay = (time: string) => {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${display}:${m} ${ampm}`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
  input[type="date"], input[type="time"] { max-width: 100%; }
  @media (max-width: 480px) {
    .time-grid { grid-template-columns: 1fr !important; }
  }
`}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Log Session</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Record a completed workout</p>
          </div>
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle size={18} /> Session logged successfully!
            <a href="/admin/schedule" style={{ color: '#155724', marginLeft: 'auto', textDecoration: 'underline', fontSize: '13px' }}>← Back to Schedule</a>
          </div>
        )}

        {selectedDog && (
          <div style={{ background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '16px', padding: '18px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {selectedDog.photo_url ? (
              <img src={selectedDog.photo_url} alt={selectedDog.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PawPrint size={22} color="white" />
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontWeight: '800', fontSize: '17px', color: 'white' }}>{selectedDog.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{selectedDog.owners?.name} · {selectedDog.leaderboard_settings?.city}</p>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Dog</label>
              <select value={dogId} onChange={(e) => setDogId(e.target.value)} required style={{ ...inputStyle, background: 'white' }}>
                <option value="">Select a dog...</option>
                {dogs.map(dog => <option key={dog.id} value={dog.id}>{dog.name} ({dog.owners?.name})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>FitBark Device</label>
              <select value={deviceSlug} onChange={(e) => setDeviceSlug(e.target.value)} required style={{ ...inputStyle, background: 'white' }}>
                <option value="">Select a device...</option>
                {devices.length === 0 && <option disabled>No devices added yet</option>}
                {devices.map(device => <option key={device.id} value={device.fitbark_slug}>{device.device_name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Session Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required style={inputStyle} />
            </div>
            {timeFromBooking ? (
              <div style={{ background: '#eef2fb', border: '1.5px solid #c8d4f0', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color="#2c5a9e" />
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#2c5a9e', fontSize: '13px' }}>Session Time</p>
                    <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '800' }}>{formatTimeDisplay(startTime)} – {formatTimeDisplay(endTime)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setTimeFromBooking(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
              </div>
            ) : (
              <div className="time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={inputStyle} />
                </div>
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="How did the session go? Any observations?"
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}>
              <ClipboardList size={17} /> {loading ? 'Saving...' : 'Log Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}