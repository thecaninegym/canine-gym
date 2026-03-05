'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { checkAchievements } from '../../../../lib/achievements'

export default function LogSession() {
  const [dogs, setDogs] = useState([])
  const [devices, setDevices] = useState([])
  const [dogId, setDogId] = useState('')
  const [deviceSlug, setDeviceSlug] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dogParam = params.get('dog')
    if (dogParam) setDogId(dogParam)

    const fetchData = async () => {
      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*, owner_id, owners(name), leaderboard_settings(city)')
        .order('name')
      setDogs(dogsData || [])

      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .order('device_name')
      setDevices(devicesData || [])
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const start = new Date(`${sessionDate}T${startTime}`)
    const end = new Date(`${sessionDate}T${endTime}`)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        dog_id: dogId,
        fitbark_device_slug: deviceSlug,
        session_date: sessionDate,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: duration,
        notes
      }])

     if (sessionError) {
      setError(sessionError.message)
      setLoading(false)
      return
    }

    // Check achievements after session is logged
    const newAchievements = await checkAchievements(dogId)

    // Get owner email for session report
    const selectedDogData = dogs.find(d => d.id === dogId)
    const { data: ownerData } = await supabase
      .from('owners')
      .select('name, email')
      .eq('id', selectedDogData?.owner_id)
      .single()

    // Send session report email
    if (ownerData?.email) {
      await fetch('/api/send-session-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: ownerData.email,
          ownerName: ownerData.name,
          dogName: selectedDogData?.name,
          sessionDate: new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          duration,
          miles: null,
          calories: null,
          notes,
          achievementsUnlocked: newAchievements.map(a => a.label)
        })
      })
    }


    setSuccess(true)
    setDeviceSlug('')
    setStartTime('')
    setEndTime('')
    setNotes('')
    setLoading(false)
  }

  const selectedDog = dogs.find(d => d.id === dogId)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>Log Session</h2>
        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            Session logged successfully! ✅
            <br />
            <a href="/admin/dogs" style={{ color: '#155724', fontWeight: 'bold' }}>← Back to all dogs</a>
          </div>
        )}
        {selectedDog && (
          <div style={{ backgroundColor: '#003087', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>🐾 {selectedDog.name}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>{selectedDog.owners?.name} · {selectedDog.leaderboard_settings?.city}</p>
          </div>
        )}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Dog</label>
              <select value={dogId} onChange={(e) => setDogId(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }}>
                <option value="">Select a dog...</option>
                {dogs.map(dog => (
                  <option key={dog.id} value={dog.id}>{dog.name} ({dog.owners?.name})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>FitBark Device</label>
              <select value={deviceSlug} onChange={(e) => setDeviceSlug(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }}>
                <option value="">Select a device...</option>
                {devices.length === 0 && <option disabled>No devices added yet</option>}
                {devices.map(device => (
                  <option key={device.id} value={device.fitbark_slug}>{device.device_name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Session Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Start Time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>End Time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="How did the session go? Any observations?"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000', resize: 'vertical' }} />
            </div>
            {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Saving...' : '✅ Log Session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}