'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookSession() {
  const [dogs, setDogs] = useState<any[]>([])
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

      const { data: ownerData } = await supabase
        .from('owners')
        .select('*, dogs(*, leaderboard_settings(city))')
        .eq('email', user.email)
        .single()

      if (!ownerData) { setLoading(false); return }

      setDogs(ownerData.dogs || [])
      const city = ownerData.dogs?.[0]?.leaderboard_settings?.city || ''
      setOwnerCity(city)
      setOwnerId(ownerData.id)

      // Get available dates for this city (next 30 days)
      const { data: windows } = await supabase
        .from('schedule_windows')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)

      if (!windows) { setLoading(false); return }

      const dates = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 1; i <= 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dayOfWeek = date.getDay()

        const window = windows.find(w => w.day_of_week === dayOfWeek)
        if (window) {
          dates.push({
            date,
            dateStr: date.toISOString().split('T')[0],
            dayName: DAYS[dayOfWeek],
            window
          })
        }
      }

      setAvailableDates(dates)
      setLoading(false)
    }
    init()
  }, [])

  const handleDateSelect = async (dateObj: any) => {
    setSelectedDate(dateObj)
    setSelectedSlot(null)

    // Get all slots for this window
    const slots = []
    for (let h = dateObj.window.start_hour; h < dateObj.window.end_hour; h++) {
      slots.push(h)
    }

    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('slot_hour, dog_id')
      .eq('booking_date', dateObj.dateStr)
      .eq('status', 'confirmed')

    // Filter out slots that already have 2 bookings
    const slotCounts: Record<number, number> = {}
    existingBookings?.forEach(b => {
      slotCounts[b.slot_hour] = (slotCounts[b.slot_hour] || 0) + 1
    })

    const available = slots.filter(h => (slotCounts[h] || 0) < 2)
    setAvailableSlots(available)
  }

  const toggleDog = (dogId: string) => {
    setSelectedDogIds(prev =>
      prev.includes(dogId) ? prev.filter(id => id !== dogId) : [...prev, dogId]
    )
  }

  const handleBook = async () => {
    if (!selectedDate || selectedSlot === null || selectedDogIds.length === 0) return
    setBooking(true)
    setError(null)

    // Check slot availability again
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', selectedDate.dateStr)
      .eq('slot_hour', selectedSlot)
      .eq('status', 'confirmed')

    const currentCount = existingBookings?.length || 0
    if (currentCount + selectedDogIds.length > 2) {
      setError('This slot is no longer available. Please choose another time.')
      setBooking(false)
      return
    }

    // Create bookings for each selected dog
    const bookingInserts = selectedDogIds.map(dogId => ({
      dog_id: dogId,
      booking_date: selectedDate.dateStr,
      slot_hour: selectedSlot,
      status: 'confirmed'
    }))

        // Check membership and deduct session if applicable
    const { data: membershipData } = await supabase
      .from('memberships')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .single()

    if (membershipData) {
      if (membershipData.sessions_remaining <= 0) {
        setError('You have no sessions remaining on your membership this month. Please purchase a la carte sessions from the Membership page.')
        setBooking(false)
        return
      }
      // Deduct session
      await supabase
        .from('memberships')
        .update({ sessions_remaining: membershipData.sessions_remaining - 1 })
        .eq('id', membershipData.id)
    }
    
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingInserts)

    if (bookingError) {
      setError(bookingError.message)
      setBooking(false)
      return
    }

    // Get owner details for emails
    const { data: ownerData } = await supabase
      .from('owners')
      .select('name, email')
      .eq('id', ownerId)
      .single()

    const selectedDogData = dogs.find(d => d.id === selectedDogIds[0])
    const ampm = selectedSlot >= 12 ? 'PM' : 'AM'
    const hour = selectedSlot > 12 ? selectedSlot - 12 : selectedSlot === 0 ? 12 : selectedSlot
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
    const dateStr = new Date(selectedDate.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    // Send booking confirmation to client
    if (ownerData?.email) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_confirmation',
          to: ownerData.email,
          data: { ownerName: ownerData.name, dogName: selectedDogData?.name, date: dateStr, time: timeStr }
        })
      })
    }

    // Send admin notification
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        to: 'dev@thecaninegym.com',
        data: { action: '📅 New Booking', dogName: selectedDogData?.name, ownerName: ownerData?.name, date: dateStr, time: timeStr }
      })
    })

    setSuccess(true)
    setBooking(false)
  }

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '8px' }}>Book a Session</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Showing available times in <strong>{ownerCity}</strong></p>

        {success ? (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>🎉 Session Booked!</h3>
            <p style={{ margin: '0 0 16px 0' }}>
              {selectedDate?.dayName}, {new Date(selectedDate?.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {formatHour(selectedSlot!)}
            </p>
            <a href="/dashboard" style={{ backgroundColor: '#003087', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Back to Dashboard</a>
          </div>
        ) : (
          <>
            {/* Dog selector */}
            {dogs.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>Which dog(s)?</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {dogs.map(dog => (
                    <button key={dog.id} onClick={() => toggleDog(dog.id)}
                      style={{ padding: '10px 20px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderColor: selectedDogIds.includes(dog.id) ? '#003087' : '#ddd', backgroundColor: selectedDogIds.includes(dog.id) ? '#003087' : 'white', color: selectedDogIds.includes(dog.id) ? 'white' : '#333' }}>
                      🐾 {dog.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date selector */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>Pick a date</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {availableDates.map(dateObj => (
                  <button key={dateObj.dateStr} onClick={() => handleDateSelect(dateObj)}
                    style={{ padding: '12px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', textAlign: 'center', borderColor: selectedDate?.dateStr === dateObj.dateStr ? '#003087' : '#ddd', backgroundColor: selectedDate?.dateStr === dateObj.dateStr ? '#003087' : 'white', color: selectedDate?.dateStr === dateObj.dateStr ? 'white' : '#333' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{dateObj.dayName}</div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>{new Date(dateObj.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot selector */}
            {selectedDate && (
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>Pick a time</h3>
                {availableSlots.length === 0 ? (
                  <p style={{ color: '#666', margin: 0 }}>No available slots for this date. Please choose another day.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {availableSlots.map(hour => (
                      <button key={hour} onClick={() => setSelectedSlot(hour)}
                        style={{ padding: '12px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', borderColor: selectedSlot === hour ? '#FF6B35' : '#ddd', backgroundColor: selectedSlot === hour ? '#FF6B35' : 'white', color: selectedSlot === hour ? 'white' : '#333' }}>
                        {formatHour(hour)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Book button */}
            {selectedDate && selectedSlot !== null && selectedDogIds.length > 0 && (
              <button onClick={handleBook} disabled={booking}
                style={{ width: '100%', padding: '16px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                {booking ? 'Booking...' : `✅ Confirm Booking — ${selectedDate.dayName}, ${formatHour(selectedSlot)}`}
              </button>
            )}

            {error && <p style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}