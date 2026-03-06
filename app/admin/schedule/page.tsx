'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminSchedule() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchBookings()
  }, [selectedDate])

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, dogs(id, name, breed, photo_url, owners(name, email, phone, address, city, zip))')
      .eq('booking_date', selectedDate)
      .order('slot_hour')
    setBookings(data || [])
    setLoading(false)
  }

  const handleCancel = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
    fetchBookings()
  }

  const handleNoShow = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ status: 'no_show' })
      .eq('id', bookingId)
    fetchBookings()
  }

  const handleComplete = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)
    fetchBookings()
  }

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
  }

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return '#003087'
    if (status === 'completed') return '#28a745'
    if (status === 'cancelled') return '#dc3545'
    if (status === 'no_show') return '#ffc107'
    return '#666'
  }

  const dates = []
  for (let i = -1; i <= 13; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>📅 Schedule</h2>

        {/* Date selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {dates.map(dateStr => {
            const d = new Date(dateStr + 'T12:00:00')
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            return (
              <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', textAlign: 'center', flexShrink: 0, borderColor: isSelected ? '#003087' : '#ddd', backgroundColor: isSelected ? '#003087' : 'white', color: isSelected ? 'white' : '#333' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                <div style={{ fontSize: '12px' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                {isToday && <div style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#FF6B35', fontWeight: 'bold' }}>TODAY</div>}
              </button>
            )
          })}
        </div>

        {/* Bookings */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : bookings.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>No bookings for this day.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {bookings.map(booking => (
              <div key={booking.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#003087' }}>{formatHour(booking.slot_hour)}</span>
                      <span style={{ backgroundColor: getStatusColor(booking.status), color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{booking.status}</span>
                      {booking.cancellation_fee && <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>💰 FEE</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {booking.dogs?.photo_url ? (
                        <img src={booking.dogs.photo_url} alt={booking.dogs.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🐾</div>
                      )}
                      <div>
                        <p style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{booking.dogs?.name}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{booking.dogs?.breed}</p>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{booking.dogs?.owners?.name}</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>📞 {booking.dogs?.owners?.phone}</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>✉️ {booking.dogs?.owners?.email}</p>
                      {booking.dogs?.owners?.address && (
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address} ${booking.dogs.owners.city} IN ${booking.dogs.owners.zip}`)}`} target="_blank"
                          style={{ fontSize: '14px', color: '#003087', fontWeight: 'bold', textDecoration: 'none' }}>
                          📍 {booking.dogs.owners.address}, {booking.dogs.owners.city}, IN {booking.dogs.owners.zip}
                        </a>
                      )}
                    </div>
                    {booking.cancellation_reason && <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#999', fontStyle: 'italic' }}>Reason: {booking.cancellation_reason}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', marginLeft: '16px' }}>
                    {booking.status === 'confirmed' && (
                      <>
                        <a href={`/admin/sessions/new?dog=${booking.dogs?.id}`}
                          style={{ padding: '8px 16px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none', textAlign: 'center' }}>
                          📋 Log Session
                        </a>
                        <button onClick={() => handleComplete(booking.id)}
                          style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                          ✅ Complete
                        </button>
                        <button onClick={() => handleNoShow(booking.id)}
                          style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                          ⚠️ No Show
                        </button>
                        <button onClick={() => handleCancel(booking.id)}
                          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                          ✖️ Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}