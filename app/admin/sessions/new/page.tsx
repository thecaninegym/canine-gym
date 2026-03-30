'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { checkAchievements } from '../../../../lib/achievements'
import { PawPrint, ArrowLeft, ClipboardList, CheckCircle, Clock, Zap, Activity } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700' as const, color: '#555', fontSize: '13px' }

export default function LogSession() {
  const [dogs, setDogs] = useState<any[]>([])
  const [dogId, setDogId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [sessionDate, setSessionDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFromBooking, setTimeFromBooking] = useState(false)

  // Slatmill state
  const [pendingSlatmillSessions, setPendingSlatmillSessions] = useState<any[]>([])
  const [selectedSlatmillId, setSelectedSlatmillId] = useState<string | null>(null)
  const [dogWeightLbs, setDogWeightLbs] = useState('')
  const [slatmillLoading, setSlatmillLoading] = useState(false)

  const selectedSlatmill = pendingSlatmillSessions.find(s => s.id === selectedSlatmillId)

  // Calculate calories from slatmill data + dog weight
  const calculateCalories = () => {
    if (!selectedSlatmill || !dogWeightLbs) return null
    const weightKg = parseFloat(dogWeightLbs) * 0.453592
    const met = 3.0 + (selectedSlatmill.avg_speed_mph * 1.5)
    const calories = met * weightKg * (selectedSlatmill.duration_minutes / 60.0)
    return Math.round(calories)
  }

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
    }
    fetchData()
    fetchPendingSlatmillSessions()
  }, [])

  const fetchPendingSlatmillSessions = async () => {
    setSlatmillLoading(true)
    const { data } = await supabase
      .from('slatmill_sessions')
      .select('*')
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(10)
    setPendingSlatmillSessions(data || [])
    setSlatmillLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Weight is required when a slatmill session is selected
    if (selectedSlatmill && !dogWeightLbs) {
      setError("Please enter the dog's weight to calculate calories.")
      setLoading(false)
      return
    }

    const start = new Date(`${sessionDate}T${startTime}`)
    const end = new Date(`${sessionDate}T${endTime}`)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)

    const calories = calculateCalories()

    // Build session row — include slatmill data if a session was selected
    const sessionRow: any = {
      dog_id: dogId,
      session_date: sessionDate,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: selectedSlatmill ? selectedSlatmill.duration_minutes : duration,
      notes,
      ...(selectedSlatmill && {
        distance_miles: selectedSlatmill.distance_miles,
        avg_speed_mph: selectedSlatmill.avg_speed_mph,
        peak_speed_mph: selectedSlatmill.peak_speed_mph,
        pace_consistency: selectedSlatmill.pace_consistency !== undefined ? selectedSlatmill.pace_consistency : null,
        active_seconds: selectedSlatmill.active_seconds !== undefined ? selectedSlatmill.active_seconds : null,
        avg_acceleration: selectedSlatmill.avg_acceleration !== undefined ? selectedSlatmill.avg_acceleration : null,
        top_speed_duration: selectedSlatmill.top_speed_duration !== undefined ? selectedSlatmill.top_speed_duration : null,
        low_zone_seconds: selectedSlatmill.low_zone_seconds !== undefined ? selectedSlatmill.low_zone_seconds : null,
        moderate_zone_seconds: selectedSlatmill.moderate_zone_seconds !== undefined ? selectedSlatmill.moderate_zone_seconds : null,
        high_zone_seconds: selectedSlatmill.high_zone_seconds !== undefined ? selectedSlatmill.high_zone_seconds : null,
        start_temp_f: selectedSlatmill.start_temp_f !== undefined ? selectedSlatmill.start_temp_f : null,
        end_temp_f: selectedSlatmill.end_temp_f !== undefined ? selectedSlatmill.end_temp_f : null,
        avg_temp_f: selectedSlatmill.avg_temp_f !== undefined ? selectedSlatmill.avg_temp_f : null,
        max_temp_f: selectedSlatmill.max_temp_f !== undefined ? selectedSlatmill.max_temp_f : null,
        min_temp_f: selectedSlatmill.min_temp_f !== undefined ? selectedSlatmill.min_temp_f : null,
        start_humidity: selectedSlatmill.start_humidity !== undefined ? selectedSlatmill.start_humidity : null,
        end_humidity: selectedSlatmill.end_humidity !== undefined ? selectedSlatmill.end_humidity : null,
        avg_humidity: selectedSlatmill.avg_humidity !== undefined ? selectedSlatmill.avg_humidity : null,
        temp_log: selectedSlatmill.temp_log !== undefined ? selectedSlatmill.temp_log : null,
        slatmill_session_id: selectedSlatmill.id,
      }),
      ...(dogWeightLbs && { dog_weight_lbs: parseFloat(dogWeightLbs) }),
      ...(calories && { calories }),
    }

    const { error: sessionError } = await supabase.from('sessions').insert([sessionRow])
    if (sessionError) { setError(sessionError.message); setLoading(false); return }

    // Mark slatmill session as used
    if (selectedSlatmillId) {
      await supabase.from('slatmill_sessions').update({ used: true }).eq('id', selectedSlatmillId)
    }

    if (bookingId) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    } else {
      await supabase.from('bookings').update({ status: 'completed' }).eq('dog_id', dogId).eq('booking_date', sessionDate).eq('status', 'confirmed')
    }

    // Get the current session token to authenticate the API call
    const { data: { session } } = await supabase.auth.getSession()

    // Sessions are decremented at booking time — no decrement needed here


    const newAchievements = await checkAchievements(dogId)
    const selectedDogData = dogs.find(d => d.id === dogId)
    const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', selectedDogData?.owner_id).single()
    if (ownerData?.email) {
      await fetch('/api/send-session-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: ownerData.email,
          ownerName: ownerData.name,
          dogName: selectedDogData?.name,
          sessionDate: new Date(sessionDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          duration: selectedSlatmill ? selectedSlatmill.duration_minutes : duration,
          miles: selectedSlatmill?.distance_miles || null,
          avgSpeedMph: selectedSlatmill?.avg_speed_mph || null,
          peakSpeedMph: selectedSlatmill?.peak_speed_mph || null,
          calories: calories || null,
          dogWeightLbs: dogWeightLbs ? parseFloat(dogWeightLbs) : null,
          notes,
          achievementsUnlocked: newAchievements.map((a: any) => a.label)
        })
      })
    }
    setSuccess(true)
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

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const calories = calculateCalories()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
  input[type="date"], input[type="time"] { max-width: 100%; }
  @media (max-width: 480px) {
    .time-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
  }
`}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Log Session</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Record a completed workout</p>
          </div>
          {process.env.NEXT_PUBLIC_SLATMILL_IP && (
            <a
              href={`http://${process.env.NEXT_PUBLIC_SLATMILL_IP}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', flexShrink: 0 }}
            >
              &#128249; View Live Stats
            </a>
          )}
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle size={18} /> Session logged successfully!
            <a href="/admin/schedule" style={{ color: '#155724', marginLeft: 'auto', textDecoration: 'underline', fontSize: '13px' }}>← Back to Schedule</a>
          </div>
        )}

        {/* Slatmill pending sessions — two column layout */}
        {(pendingSlatmillSessions.length > 0 || slatmillLoading) && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Activity size={17} color="#2c5a9e" />
              <p style={{ margin: 0, fontWeight: '800', color: '#1a1a2e', fontSize: '14px' }}>
                Slatmill Data Available ({pendingSlatmillSessions.length} session{pendingSlatmillSessions.length > 1 ? 's' : ''})
              </p>
              <button onClick={fetchPendingSlatmillSessions} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2c5a9e', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                Refresh
              </button>
            </div>

            {/* Two-column grid — left: slatmill_1, right: slatmill_2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(['slatmill_1', 'slatmill_2'] as const).map(millId => {
                const millSessions = pendingSlatmillSessions.filter(s => (s.slatmill_id || 'slatmill_1') === millId)
                const millLabel = millId === 'slatmill_1' ? 'Slatmill 1 (Left)' : 'Slatmill 2 (Right)'
                return (
                  <div key={millId}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '800', color: '#2c5a9e', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                      {millLabel}
                    </p>
                    {millSessions.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: '12px', border: '2px dashed #e5e8f0', background: '#fafbfc', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#bbb', fontWeight: '600' }}>No data waiting</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {millSessions.map(s => (
                          <div key={s.id}
                            onClick={() => setSelectedSlatmillId(selectedSlatmillId === s.id ? null : s.id)}
                            style={{
                              padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                              border: selectedSlatmillId === s.id ? '2px solid #2c5a9e' : '2px solid #eef0f5',
                              background: selectedSlatmillId === s.id ? '#eef2fb' : '#f8f9fc'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '10px', color: '#aaa', fontWeight: '600' }}>{formatTime(s.created_at)}</span>
                              {selectedSlatmillId === s.id && (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#2c5a9e', background: '#dde8f8', padding: '2px 7px', borderRadius: '6px' }}>Selected</span>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              {[
                                { label: 'Duration', value: `${s.duration_minutes?.toFixed(1)} min` },
                                { label: 'Distance', value: `${s.distance_miles?.toFixed(2)} mi` },
                                { label: 'Avg Speed', value: s.avg_speed_mph != null ? `${s.avg_speed_mph.toFixed(1)} mph` : '-- mph' },
                                { label: 'Peak Speed', value: s.peak_speed_mph != null ? `${s.peak_speed_mph.toFixed(1)} mph` : '-- mph' },
                              ].map(({ label, value }) => (
                                <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '6px 4px' }}>
                                  <p style={{ margin: '0 0 2px', fontSize: '9px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase' as const }}>{label}</p>
                                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#1a1a2e' }}>{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Weight input — shown below both columns when any session is selected */}
            {selectedSlatmill && (
              <div style={{ marginTop: '14px', padding: '14px 16px', background: '#f0f2f7', borderRadius: '12px', border: '1.5px solid #e0e4ee' }}>
                <label style={{ ...labelStyle, color: '#1a1a2e' }}>
                  Dog&apos;s Weight Today (lbs) <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={dogWeightLbs}
                    onChange={e => setDogWeightLbs(e.target.value)}
                    placeholder="e.g. 45"
                    min="1" max="200" step="0.1"
                    required
                    style={{ ...inputStyle, width: '140px', border: dogWeightLbs ? '1.5px solid #2c5a9e' : '1.5px solid #f88124' }}
                  />
                  {calories !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff3e0', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #f88124' }}>
                      <Zap size={14} color="#f88124" />
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#f88124' }}>{calories} cal</span>
                    </div>
                  )}
                </div>
                {!dogWeightLbs && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#e53e3e', fontWeight: '600' }}>Required to calculate calories and log session.</p>
                )}
                {dogWeightLbs && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#888' }}>Calories calculated from speed, duration, and weight.</p>
                )}
              </div>
            )}
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