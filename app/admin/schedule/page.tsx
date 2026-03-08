'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Calendar, Map, List, ChevronLeft, ChevronRight, Clock, Phone, Mail, MapPin, Car, ClipboardList, CheckCircle, AlertTriangle, XCircle, Navigation } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6)

function getUniqueStops(bookingList: any[]) {
  const seen: Record<string, boolean> = {}
  const result: any[] = []
  bookingList
    .filter((b: any) => b.status === 'confirmed' && b.dogs?.owners?.address)
    .sort((a: any, b: any) => a.slot_hour - b.slot_hour)
    .forEach((b: any) => {
      const key = `${b.slot_hour}-${b.dogs?.owners?.address}`
      if (!seen[key]) { seen[key] = true; result.push(b) }
    })
  return result
}

export default function AdminSchedule() {
  const [bookings, setBookings] = useState<any[]>([])
  const [weekBookings, setWeekBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [view, setView] = useState<'list' | 'calendar' | 'map'>('list')
  const [mapMode, setMapMode] = useState<'day' | 'week'>('day')
  const [travelTime, setTravelTime] = useState<{ totalMinutes: number, legs: any[] } | null>(null)

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

  useEffect(() => { fetchBookings() }, [selectedDate])
  useEffect(() => { fetchWeekBookings() }, [selectedDate])

  const fetchTravelTime = async (bookingList: any[]) => {
    const uniqueStops = getUniqueStops(bookingList)
    if (uniqueStops.length < 2) { setTravelTime(null); return }
    const addresses = uniqueStops.map((b: any) => `${b.dogs.owners.address}, ${b.dogs.owners.city}, IN`)
    const res = await fetch('/api/travel-time', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addresses }) })
    const data = await res.json()
    setTravelTime(data)
  }

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*, dogs(id, name, breed, photo_url, owners(name, email, phone, address, city, zip))').eq('booking_date', selectedDate).order('slot_hour')
    setBookings(data || [])
    setLoading(false)
    if (data) fetchTravelTime(data)
  }

  const fetchWeekBookings = async () => {
    const dates = getWeekDates()
    const { data } = await supabase.from('bookings').select('*, dogs(id, name, breed, photo_url, owners(name, email, phone, address, city, zip))').in('booking_date', dates).order('slot_hour')
    setWeekBookings(data || [])
  }

  const handleCancel = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', bookingId)
    fetchBookings(); fetchWeekBookings()
  }

  const handleNoShow = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'no_show' }).eq('id', bookingId)
    fetchBookings(); fetchWeekBookings()
  }

  const handleComplete = async (bookingId: string) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    fetchBookings(); fetchWeekBookings()
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

  const viewButtons = [
    { key: 'list', label: 'List', icon: <List size={15} /> },
    { key: 'calendar', label: 'Week', icon: <Calendar size={15} /> },
    { key: 'map', label: 'Map', icon: <Map size={15} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
  @media (max-width: 560px) {
    .booking-card-inner { flex-direction: column; gap: 14px; }
    .booking-card-actions { margin-left: 0; flex-direction: column; align-items: center; width: 100%; }
.booking-card-actions a, .booking-card-actions button { width: 100%; max-width: 320px; }
    .booking-card-actions a, .booking-card-actions button { flex: 1; min-width: 120px; }
  }
`}</style>

      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PawPrint size={20} color="#FF6B35" /></div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>The Canine Gym <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>· Admin</span></span>
        </div>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Schedule</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Manage daily bookings</p>
          </div>
          <div style={{ display: 'flex', background: 'white', borderRadius: '10px', padding: '4px', gap: '4px', border: '1.5px solid #eef0f5' }}>
            {viewButtons.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setView(key as any)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: view === key ? 'linear-gradient(135deg, #001a4d, #003087)' : 'transparent', color: view === key ? 'white' : '#666', transition: 'all 0.15s' }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date strip */}
        {(view === 'list' || view === 'map') && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {dates.map(dateStr => {
              const d = new Date(dateStr + 'T12:00:00')
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', textAlign: 'center', flexShrink: 0, borderColor: isSelected ? '#003087' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #001a4d, #003087)' : 'white', color: isSelected ? 'white' : '#333' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  {isToday && <div style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#FF6B35', fontWeight: '700' }}>TODAY</div>}
                </button>
              )
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          loading ? <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>Loading...</div> :
          bookings.length === 0 ? (
            <div style={{ background: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', border: '1.5px solid #eef0f5' }}>
              <Calendar size={48} color="#e5e8f0" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#aaa', fontSize: '16px', margin: 0 }}>No bookings for this day.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {bookings.map(booking => (
                <div key={booking.id} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                  <div className="booking-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
  <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={16} color="#FF6B35" />
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a2e' }}>{formatHour(booking.slot_hour)}</span>
                        </div>
                        <span style={{ background: getStatusColor(booking.status), color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const }}>{booking.status}</span>
                        {booking.cancellation_fee && <span style={{ background: '#dc3545', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>FEE</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        {booking.dogs?.photo_url ? (
                          <img src={booking.dogs.photo_url} alt={booking.dogs.name} style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PawPrint size={22} color="#ccc" />
                          </div>
                        )}
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: '800', color: '#1a1a2e' }}>{booking.dogs?.name}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{booking.dogs?.breed}</p>
                        </div>
                      </div>
                      <div style={{ background: '#f8f9fc', padding: '12px 16px', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>{booking.dogs?.owners?.name}</p>
                        <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} color="#ccc" /> {booking.dogs?.owners?.phone}</p>
                        <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color="#ccc" /> {booking.dogs?.owners?.email}</p>
                        {booking.dogs?.owners?.address && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN ${booking.dogs.owners.zip}`)}`} target="_blank"
                            style={{ fontSize: '13px', color: '#003087', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} /> {booking.dogs.owners.address}, {booking.dogs.owners.city}, IN {booking.dogs.owners.zip}
                          </a>
                        )}
                      </div>
                      {booking.cancellation_reason && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>Reason: {booking.cancellation_reason}</p>}
                    </div>
                    <div className="booking-card-actions" style={{ display: 'flex', gap: '8px', flexDirection: 'column', marginLeft: '16px' }}>
                      {booking.status === 'confirmed' && (
                        <>
                          <a href={`/admin/sessions/new?dog=${booking.dogs?.id}&booking=${booking.id}&hour=${booking.slot_hour}&date=${booking.booking_date}`}
                            style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 3px 10px rgba(255,107,53,0.25)' }}>
                            <ClipboardList size={14} /> Log Session
                          </a>
                          <button onClick={() => handleComplete(booking.id)}
                            style={{ padding: '9px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <CheckCircle size={14} /> Complete
                          </button>
                          <button onClick={() => handleNoShow(booking.id)}
                            style={{ padding: '9px 16px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <AlertTriangle size={14} /> No Show
                          </button>
                          <button onClick={() => handleCancel(booking.id)}
                            style={{ padding: '9px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <XCircle size={14} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* CALENDAR VIEW */}
        {view === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 7); setSelectedDate(d.toISOString().split('T')[0]) }}
                style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #e5e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#555' }}>
                <ChevronLeft size={16} /> Prev Week
              </button>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>
                {new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 7); setSelectedDate(d.toISOString().split('T')[0]) }}
                style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #e5e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#555' }}>
                Next Week <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '2px solid #eef0f5' }}>
                <div style={{ padding: '12px 8px', background: '#f8f9fc' }} />
                {weekDates.map(dateStr => {
                  const d = new Date(dateStr + 'T12:00:00')
                  const isToday = dateStr === new Date().toISOString().split('T')[0]
                  return (
                    <div key={dateStr} style={{ padding: '12px 8px', textAlign: 'center', background: isToday ? '#f0f4ff' : '#f8f9fc', borderLeft: '1px solid #eef0f5' }}>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: isToday ? '#003087' : '#555' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                      <div style={{ fontSize: '11px', color: isToday ? '#003087' : '#888' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      {isToday && <div style={{ fontSize: '10px', color: '#FF6B35', fontWeight: '700' }}>TODAY</div>}
                    </div>
                  )
                })}
              </div>
              {HOURS.map(hour => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #f0f2f7', minHeight: '52px' }}>
                  <div style={{ padding: '8px 12px 8px 8px', fontSize: '11px', color: '#aaa', textAlign: 'right', paddingTop: '10px', background: '#f8f9fc' }}>
                    {formatHourShort(hour)}
                  </div>
                  {weekDates.map(dateStr => {
                    const dayBookings = weekBookings.filter(b => b.booking_date === dateStr && b.slot_hour === hour)
                    const isToday = dateStr === new Date().toISOString().split('T')[0]
                    return (
                      <div key={dateStr} style={{ borderLeft: '1px solid #eef0f5', padding: '4px', background: isToday ? '#fafcff' : 'white' }}>
                        {dayBookings.map(booking => (
                          <div key={booking.id} onClick={() => { setSelectedDate(dateStr); setView('list') }}
                            style={{ background: getStatusColor(booking.status), color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {booking.dogs?.photo_url ? (
                              <img src={booking.dogs.photo_url} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : <PawPrint size={12} color="white" />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{booking.dogs?.name}</span>
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

        {/* MAP VIEW */}
        {view === 'map' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { key: 'day', label: "Today's Route", icon: <Navigation size={15} /> },
                { key: 'week', label: 'Week Overview', icon: <Map size={15} /> },
              ].map(({ key, label, icon }) => (
                <button key={key} onClick={() => setMapMode(key as any)}
                  style={{ padding: '9px 20px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: mapMode === key ? '#003087' : '#e5e8f0', background: mapMode === key ? 'linear-gradient(135deg, #001a4d, #003087)' : 'white', color: mapMode === key ? 'white' : '#555' }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {mapMode === 'day' && (
              bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).length === 0 ? (
                <div style={{ background: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', border: '1.5px solid #eef0f5' }}>
                  <MapPin size={48} color="#e5e8f0" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#aaa', margin: 0 }}>No confirmed bookings with addresses for this day.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '16px' }}>Today's Stops ({getUniqueStops(bookings).length})</h3>
                      {travelTime && travelTime.totalMinutes > 0 && (
                        <span style={{ background: '#f0f4ff', color: '#003087', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Car size={13} /> {travelTime.totalMinutes} min total driving
                        </span>
                      )}
                    </div>
                    {(() => {
                      const confirmed = bookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address)
                      const grouped: Record<number, any[]> = {}
                      confirmed.forEach(b => { if (!grouped[b.slot_hour]) grouped[b.slot_hour] = []; grouped[b.slot_hour].push(b) })
                      return Object.entries(grouped).map(([hour, slotBookings]) => (
                        <div key={hour}>
                          <div style={{ padding: '10px 20px', background: '#f8f9fc', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} color="#FF6B35" />
                            <span style={{ fontWeight: '700', color: '#FF6B35', fontSize: '13px' }}>{formatHour(Number(hour))}</span>
                          </div>
                          {slotBookings.map(booking => (
                            <div key={booking.id} style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                              {booking.dogs?.photo_url ? (
                                <img src={booking.dogs.photo_url} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={18} color="#ccc" /></div>
                              )}
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1a1a2e' }}>{booking.dogs?.name}</p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} color="#ccc" /> {booking.dogs?.owners?.address}, {booking.dogs?.owners?.city}</p>
                              </div>
                              <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN`)}`} target="_blank"
                                style={{ fontSize: '13px', color: '#003087', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Navigation size={13} /> Directions
                              </a>
                            </div>
                          ))}
                        </div>
                      ))
                    })()}
                  </div>
                  <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', background: 'white' }}>
                    {(() => {
                      const uniqueStops = getUniqueStops(bookings)
                      const routeUrl = uniqueStops.map(b => encodeURIComponent(`${b.dogs?.owners?.address}, ${b.dogs?.owners?.city}, IN`)).join('/')
                      return (
                        <div style={{ padding: '36px', textAlign: 'center' }}>
                          <Map size={48} color="#003087" style={{ marginBottom: '16px' }} />
                          <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800' }}>{uniqueStops.length} stops today</h3>
                          <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>{uniqueStops.map(b => `${b.dogs?.owners?.address}, ${b.dogs?.owners?.city}`).join(' → ')}</p>
                          <a href={`https://www.google.com/maps/dir/${routeUrl}`} target="_blank"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}>
                            <Navigation size={18} /> Open Full Route in Google Maps
                          </a>
                        </div>
                      )
                    })()}
                  </div>
                </>
              )
            )}

            {mapMode === 'week' && (
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={17} color="#003087" />
                  <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '16px' }}>Week's Clients ({weekBookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).length} bookings)</h3>
                </div>
                {weekDates.map(dateStr => {
                  const dayB = weekBookings.filter(b => b.booking_date === dateStr && b.status === 'confirmed' && b.dogs?.owners?.address)
                  if (dayB.length === 0) return null
                  const d = new Date(dateStr + 'T12:00:00')
                  return (
                    <div key={dateStr}>
                      <div style={{ padding: '10px 20px', background: '#f8f9fc', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={13} color="#003087" />
                        <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>{DAYS[d.getDay()]} — {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {dayB.map(booking => (
                        <div key={booking.id} style={{ padding: '12px 20px', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {booking.dogs?.photo_url ? (
                            <img src={booking.dogs.photo_url} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={16} color="#ccc" /></div>
                          )}
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>{booking.dogs?.name} — {formatHour(booking.slot_hour)}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} color="#ccc" /> {booking.dogs?.owners?.address}, {booking.dogs?.owners?.city}</p>
                          </div>
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${booking.dogs.owners.address}, ${booking.dogs.owners.city}, IN`)}`} target="_blank"
                            style={{ fontSize: '13px', color: '#003087', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Navigation size={13} /> Directions
                          </a>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}