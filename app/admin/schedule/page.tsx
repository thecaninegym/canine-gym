'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6) // 6am to 6pm

export default function AdminSchedule() {
  const [bookings, setBookings] = useState<any[]>([])
  const [weekBookings, setWeekBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [view, setView] = useState<'list' | 'calendar' | 'map'>('list')
  const [mapMode, setMapMode] = useState<'day' | 'week'>('day')
  const [travelTime, setTravelTime] = useState<{ totalMinutes: number, legs: any[] } | null>(null)

  // Get current week Mon-Sun
  const getWeekDates = () => {
    const today = new Date(selectedDate + 'T12:00:00')
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }

  const weekDates = getWeekDates()

  useEffect(() => {
    fetchBookings()
  }, [selectedDate])

  useEffect(() => {
    fetchWeekBookings()
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
    if (data) fetchTravelTime(data)
  }

  const fetchTravelTime = async (bookingList: any[]) => {
    const uniqueStops = [...new Map(bookingList
      .filter(b => b.status === 'confirmed' && b.dogs?.owners?.address)
      .map(b => [`${b.slot_hour}-${b.dogs.owners.address}`, b]))
      .values()]
      .sort((a, b) => a.slot_hour - b.slot_hour)

    if (uniqueStops.length < 2) { setTravelTime(null); return }

    const addresses = uniqueStops.map(b => `${b.dogs.owners.address}, ${b.dogs.owners.city}, IN`)

    const res = await fetch('/api/travel-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses })
    })
    const data = await res.json()
    setTravelTime(data)
  }

  const fetchWeekBookings = async () => {
    const dates = getWeekDates()
    const { data } = await supabase
      .from('bookings')
      .select('*, dogs(id, name, breed, photo_url, owners(name, email, phone, address, city, zip))')
      .in('booking_date', dates)
      .order('slot_hour')
    setWeekBookings(data || [])
  }

  const handleCancel = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', bookingId)
    fetchBookings()
    fetchWeekBookings()
  }

  const handleNoShow = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'no_show' }).eq('id', bookingId)
    fetchBookings()
    fetchWeekBookings()
  }

  const handleComplete = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    fetchBookings()
    fetchWeekBookings()
  }

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
  }

  const formatHourShort = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:00 ${ampm}`
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

  // Build Google Maps route URL
  const buildMapUrl = (bookingList: any[]) => {
    const confirmed = bookingList.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address)
    if (confirmed.length === 0) return null
    const addresses = confirmed.map(b => encodeURIComponent(`${b.dogs.owners.address}, ${b.dogs.owners.city}, IN ${b.dogs.owners.zip}`))
    if (addresses.length === 1) return `https://www.google.com/maps/search/?api=1&query=${addresses[0]}`
    const origin = addresses[0]
    const destination = addresses[addresses.length - 1]
    const waypoints = addresses.slice(1, -1).join('|')
    return `https://www.google.com/maps/dir/${confirmed.map(b => encodeURIComponent(`${b.dogs.owners.address}, ${b.dogs.owners.city}, IN`)).join('/')}`
  }

  const dayMapBookings = bookings
  const weekMapBookings = weekBookings.filter((b, i, arr) =>
    arr.findIndex(x => x.dogs?.owners?.address === b.dogs?.owners?.address) === i
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#003087', margin: 0 }}>📅 Schedule</h2>
          {/* View toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            {(['list', 'calendar', 'map'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', backgroundColor: view === v ? '#003087' : 'transparent', color: view === v ? 'white' : '#666' }}>
                {v === 'list' ? '☰ List' : v === 'calendar' ? '📅 Week' : '🗺️ Map'}
              </button>
            ))}
          </div>
        </div>

        {/* Date selector — shown in list and map views */}
        {(view === 'list' || view === 'map') && (
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
        )}

        {/* ======= LIST VIEW ======= */}
        {view === 'list' && (
          loading ? <p style={{ color: '#666' }}>Loading...</p> :
          bookings.length === 0 ? (
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
                      <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{booking.dogs?.owners?.name}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>📞 {booking.dogs?.owners?.phone}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>✉️ {booking.dogs?.owners?.email}</p>
                        {booking.dogs?.owners?.address && (
                          <a href={`https://maps.google.com/maps/dir/${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN ${booking.dogs.owners.zip}`)}`} target="_blank"
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
                          <button onClick={() => handleComplete(booking.id)} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>✅ Complete</button>
                          <button onClick={() => handleNoShow(booking.id)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>⚠️ No Show</button>
                          <button onClick={() => handleCancel(booking.id)} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>✖️ Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ======= CALENDAR WEEK VIEW ======= */}
        {view === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => {
                const d = new Date(selectedDate + 'T12:00:00')
                d.setDate(d.getDate() - 7)
                setSelectedDate(d.toISOString().split('T')[0])
              }} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← Prev Week</button>
              <span style={{ fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>
                {new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => {
                const d = new Date(selectedDate + 'T12:00:00')
                d.setDate(d.getDate() + 7)
                setSelectedDate(d.toISOString().split('T')[0])
              }} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Next Week →</button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '2px solid #eee' }}>
                <div style={{ padding: '12px 8px', backgroundColor: '#f9f9f9' }} />
                {weekDates.map(dateStr => {
                  const d = new Date(dateStr + 'T12:00:00')
                  const isToday = dateStr === new Date().toISOString().split('T')[0]
                  return (
                    <div key={dateStr} style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: isToday ? '#e8f0fe' : '#f9f9f9', borderLeft: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: isToday ? '#003087' : '#333' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                      <div style={{ fontSize: '12px', color: isToday ? '#003087' : '#666' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      {isToday && <div style={{ fontSize: '10px', color: '#FF6B35', fontWeight: 'bold' }}>TODAY</div>}
                    </div>
                  )
                })}
              </div>

              {/* Time rows */}
              {HOURS.map(hour => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #f0f0f0', minHeight: '52px' }}>
                  <div style={{ padding: '8px', fontSize: '11px', color: '#999', textAlign: 'right', paddingRight: '12px', paddingTop: '10px', backgroundColor: '#f9f9f9' }}>
                    {formatHourShort(hour)}
                  </div>
                  {weekDates.map(dateStr => {
                    const dayBookings = weekBookings.filter(b => b.booking_date === dateStr && b.slot_hour === hour)
                    const isToday = dateStr === new Date().toISOString().split('T')[0]
                    return (
                      <div key={dateStr} style={{ borderLeft: '1px solid #eee', padding: '4px', backgroundColor: isToday ? '#fafcff' : 'white' }}>
                        {dayBookings.map(booking => (
                          <div key={booking.id}
                            onClick={() => { setSelectedDate(dateStr); setView('list') }}
                            style={{ backgroundColor: getStatusColor(booking.status), color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {booking.dogs?.photo_url ? (
                              <img src={booking.dogs.photo_url} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : '🐾'}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.dogs?.name}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= MAP VIEW ======= */}
        {view === 'map' && (
          <div>
            {/* Day/Week toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button onClick={() => setMapMode('day')}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', borderColor: mapMode === 'day' ? '#003087' : '#ddd', backgroundColor: mapMode === 'day' ? '#003087' : 'white', color: mapMode === 'day' ? 'white' : '#333' }}>
                Today's Route
              </button>
              <button onClick={() => setMapMode('week')}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', borderColor: mapMode === 'week' ? '#003087' : '#ddd', backgroundColor: mapMode === 'week' ? '#003087' : 'white', color: mapMode === 'week' ? 'white' : '#333' }}>
                Week Overview
              </button>
            </div>

            {mapMode === 'day' && (
              <>
                {bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).length === 0 ? (
                  <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#666', margin: 0 }}>No confirmed bookings with addresses for this day.</p>
                  </div>
                ) : (
                  <>
                    {/* Stop list */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <h3 style={{ margin: 0, color: '#003087' }}>Today's Stops ({[...new Set(bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).map(b => `${b.slot_hour}-${b.dogs.owners.address}`))].length})</h3>
                          {travelTime && travelTime.totalMinutes > 0 && (
                            <span style={{ backgroundColor: '#f0f4ff', color: '#003087', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                              🚗 {travelTime.totalMinutes} min total driving
                            </span>
                          )}
                        </div>
                      </div>
                      {(() => {
                        const confirmed = bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address)
                        const grouped: Record<number, any[]> = {}
                        confirmed.forEach(b => {
                          if (!grouped[b.slot_hour]) grouped[b.slot_hour] = []
                          grouped[b.slot_hour].push(b)
                        })
                        return Object.entries(grouped).map(([hour, slotBookings]) => (
                          <div key={hour}>
                            <div style={{ padding: '10px 20px', backgroundColor: '#f0f4ff', borderBottom: '1px solid #eee' }}>
                              <span style={{ fontWeight: 'bold', color: '#FF6B35', fontSize: '14px', textTransform: 'uppercase' }}>{formatHour(Number(hour))}</span>
                            </div>
                            {slotBookings.map(booking => (
                              <div key={booking.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {booking.dogs?.photo_url ? (
                                  <img src={booking.dogs.photo_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🐾</div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#333' }}>{booking.dogs?.name}</p>
                                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{booking.dogs?.owners?.address}, {booking.dogs?.owners?.city}</p>
                                </div>
                                <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN`)}`} target="_blank"
                                  style={{ fontSize: '13px', color: '#003087', fontWeight: 'bold', textDecoration: 'none' }}>Directions →</a>
                              </div>
                            ))}
                          </div>
                        ))
                      })()}
                    </div>

                    {/* Map embed */}
                    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
                      {(() => {
                        const confirmedBookings = bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address)
                        const uniqueStops = [...new Map(confirmedBookings.map(b => [`${b.slot_hour}-${b.dogs.owners.address}`, b])).values()]
                        const routeUrl = uniqueStops.map(b => encodeURIComponent(`${b.dogs.owners.address}, ${b.dogs.owners.city}, IN`)).join('/')
                        return (
                          <div style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                            <h3 style={{ color: '#003087', margin: '0 0 8px 0' }}>{[...new Set(confirmedBookings.map(b => `${b.slot_hour}-${b.dogs.owners.address}`))].length} stops today</h3>
                            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                              {[...new Map(confirmedBookings.map(b => [`${b.slot_hour}-${b.dogs.owners.address}`, b])).values()].map(b => `${b.dogs.owners.address}, ${b.dogs.owners.city}`).join(' → ')}
                            </p>
                            <a href={`https://www.google.com/maps/dir/${routeUrl}`} target="_blank"
                              style={{ display: 'inline-block', backgroundColor: '#FF6B35', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
                              🗺️ Open Full Route in Google Maps →
                            </a>
                          </div>
                        )
                      })()}
                    </div>
                  </>
                )}
              </>
            )}

            {mapMode === 'week' && (
              <>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, color: '#003087' }}>Week's Clients ({weekMapBookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).length} unique addresses)</h3>
                  </div>
                  {weekDates.map(dateStr => {
                    const dayB = weekBookings.filter(b => b.booking_date === dateStr && b.status === 'confirmed' && b.dogs?.owners?.address)
                    if (dayB.length === 0) return null
                    const d = new Date(dateStr + 'T12:00:00')
                    return (
                      <div key={dateStr}>
                        <div style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
                          <span style={{ fontWeight: 'bold', color: '#003087', fontSize: '14px' }}>{DAYS[d.getDay()]} — {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {dayB.map((booking, i) => (
                          <div key={booking.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {booking.dogs?.photo_url ? (
                              <img src={booking.dogs.photo_url} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🐾</div>
                            )}
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{booking.dogs?.name} — {formatHour(booking.slot_hour)}</p>
                              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{booking.dogs?.owners?.address}, {booking.dogs?.owners?.city}</p>
                            </div>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN`)}`} target="_blank"
                              style={{ fontSize: '13px', color: '#003087', fontWeight: 'bold', textDecoration: 'none' }}>Directions →</a>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}