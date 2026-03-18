'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Calendar, Map, List, ChevronLeft, ChevronRight, Clock, Phone, Mail, MapPin, Car, ClipboardList, CheckCircle, AlertTriangle, XCircle, Navigation, MessageSquare, RefreshCw, X } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6)
const ADMIN_EMAIL = 'info@thecaninegym.com'

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
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({}) // keyed by dog_id
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [view, setView] = useState<'list' | 'calendar' | 'map'>('list')
  const [mapMode, setMapMode] = useState<'day' | 'week'>('day')
  const [travelTime, setTravelTime] = useState<{ totalMinutes: number, legs: any[] } | null>(null)

  // Cancel modal
  const [cancelBooking, setCancelBooking] = useState<any | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  // Reschedule modal
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newHour, setNewHour] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [cityWindows, setCityWindows] = useState<any[]>([])
  const [availableHours, setAvailableHours] = useState<number[]>([])

  const openReschedule = async (booking: any) => {
    setRescheduleBooking(booking)
    setNewDate(booking.booking_date)
    setNewHour(String(booking.slot_hour))
    setAvailableHours([])
    // Load schedule windows for this dog's city
    const city = booking.dogs?.leaderboard_settings?.city || booking.dogs?.owners?.city || ''
    const { data: windows } = await supabase.from('schedule_windows').select('*').eq('city', city).eq('is_active', true)
    setCityWindows(windows || [])
    // Load available hours for current date
    if (windows && windows.length > 0) {
      await loadAvailableHours(booking.booking_date, windows, booking.id)
    }
  }

  const loadAvailableHours = async (dateStr: string, windows: any[], excludeBookingId: string) => {
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
    const window = windows.find((w: any) => w.day_of_week === dayOfWeek)
    if (!window) { setAvailableHours([]); return }
    const slots = []
    for (let h = window.start_hour; h < window.end_hour; h++) slots.push(h)
    const { data: existingBookings } = await supabase.from('bookings').select('slot_hour, id').eq('booking_date', dateStr).eq('status', 'confirmed')
    const slotCounts: Record<number, number> = {}
    existingBookings?.filter((b: any) => b.id !== excludeBookingId).forEach((b: any) => {
      slotCounts[b.slot_hour] = (slotCounts[b.slot_hour] || 0) + 1
    })
    setAvailableHours(slots.filter(h => (slotCounts[h] || 0) < 2))
  }

  const isDateAvailable = (dateStr: string) => {
    if (!cityWindows.length) return true
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
    return cityWindows.some((w: any) => w.day_of_week === dayOfWeek)
  }

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
    const { data } = await supabase.from('bookings').select('*, dogs(id, name, breed, photo_url, leaderboard_settings(city), owners(name, email, phone, address, city, zip))').eq('booking_date', selectedDate).order('slot_hour')
    setBookings(data || [])
    setSessionNotes({})
    setLoading(false)
    if (data) fetchTravelTime(data)
  }

  const fetchWeekBookings = async () => {
    const dates = getWeekDates()
    const { data } = await supabase.from('bookings').select('*, dogs(id, name, breed, photo_url, leaderboard_settings(city), owners(name, email, phone, address, city, zip))').in('booking_date', dates).order('slot_hour')
    setWeekBookings(data || [])
  }

  const handleCancel = async () => {
    if (!cancelBooking) return
    setCancelLoading(true)
    const booking = cancelBooking
    const ownerEmail = booking.dogs?.owners?.email
    const ownerName = booking.dogs?.owners?.name
    const dogName = booking.dogs?.name
    const date = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const time = formatHour(booking.slot_hour)

    await supabase.from('bookings').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancelReason || null,
    }).eq('id', booking.id)

    // Email client
    if (ownerEmail) {
      await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking_cancelled', to: ownerEmail, data: { ownerName, dogName, date, time, refundNote: cancelReason ? `Reason: ${cancelReason}` : null } })
      })
    }
    // Email admin
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin_notification', to: ADMIN_EMAIL, data: { action: 'Booking Cancelled', dogName, ownerName, date, time, reason: cancelReason || null } })
    })

    setCancelBooking(null)
    setCancelReason('')
    setCancelLoading(false)
    fetchBookings(); fetchWeekBookings()
  }

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newDate || !newHour) return
    setRescheduleLoading(true)
    const booking = rescheduleBooking
    const ownerEmail = booking.dogs?.owners?.email
    const ownerName = booking.dogs?.owners?.name
    const dogName = booking.dogs?.name
    const oldDate = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const oldTime = formatHour(booking.slot_hour)
    const newDateFormatted = new Date(newDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const newTime = formatHour(Number(newHour))

    await supabase.from('bookings').update({
      booking_date: newDate,
      slot_hour: Number(newHour),
    }).eq('id', booking.id)

    // Email client
    if (ownerEmail) {
      await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking_rescheduled_client', to: ownerEmail, data: { ownerName, dogName, oldDate, oldTime, newDate: newDateFormatted, newTime } })
      })
    }
    // Email admin
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking_rescheduled_admin', to: ADMIN_EMAIL, data: { dogName, ownerName, oldDate, oldTime, newDate: newDateFormatted, newTime } })
    })

    setRescheduleBooking(null)
    setNewDate('')
    setNewHour('')
    setRescheduleLoading(false)
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
    if (status === 'confirmed') return '#2c5a9e'
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
  @media (max-width: 560px) {
    .booking-card-inner { flex-direction: column; gap: 14px; }
    .booking-card-actions { margin-left: 0 !important; flex-direction: column; align-items: center; width: 100%; display: flex; }
.booking-card-actions a, .booking-card-actions button { width: 260px !important; justify-content: center; }
    .booking-card-actions a, .booking-card-actions button { flex: 1; min-width: 120px; }
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

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Schedule</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Manage daily bookings</p>
          </div>
          <div style={{ display: 'flex', background: 'white', borderRadius: '10px', padding: '4px', gap: '4px', border: '1.5px solid #eef0f5' }}>
            {viewButtons.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setView(key as any)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: view === key ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'transparent', color: view === key ? 'white' : '#666', transition: 'all 0.15s' }}>
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
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', textAlign: 'center', flexShrink: 0, borderColor: isSelected ? '#2c5a9e' : '#e5e8f0', background: isSelected ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'white', color: isSelected ? 'white' : '#333' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  {isToday && <div style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#f88124', fontWeight: '700' }}>TODAY</div>}
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
                          <Clock size={16} color="#f88124" />
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
                            style={{ fontSize: '13px', color: '#2c5a9e', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} /> {booking.dogs.owners.address}, {booking.dogs.owners.city}, IN {booking.dogs.owners.zip}
                          </a>
                        )}
                      </div>
                      {booking.cancellation_reason && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>Reason: {booking.cancellation_reason}</p>}
                      {booking.client_note && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', background: '#fff8f3', border: '1.5px solid #fde0c4', borderRadius: '10px', padding: '10px 14px' }}>
                          <MessageSquare size={14} color="#f88124" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '700', color: '#f88124', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client Note</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.6, fontStyle: 'italic' }}>"{booking.client_note}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="booking-card-actions" style={{ display: 'flex', gap: '8px', flexDirection: 'column', marginLeft: '16px' }}>
                      {booking.status === 'confirmed' && (
                        <>
                          <a href={`/admin/sessions/new?dog=${booking.dogs?.id}&booking=${booking.id}&hour=${booking.slot_hour}&date=${booking.booking_date}`}
                            style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 3px 10px rgba(255,107,53,0.25)' }}>
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
                          <button onClick={() => openReschedule(booking)}
                            style={{ padding: '9px 16px', background: '#2c5a9e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <RefreshCw size={14} /> Reschedule
                          </button>
                          <button onClick={() => { setCancelBooking(booking); setCancelReason('') }}
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
                    <div key={dateStr} style={{ padding: '12px 8px', textAlign: 'center', background: isToday ? '#eef2fb' : '#f8f9fc', borderLeft: '1px solid #eef0f5' }}>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: isToday ? '#2c5a9e' : '#555' }}>{DAYS[d.getDay()].slice(0, 3)}</div>
                      <div style={{ fontSize: '11px', color: isToday ? '#2c5a9e' : '#888' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      {isToday && <div style={{ fontSize: '10px', color: '#f88124', fontWeight: '700' }}>TODAY</div>}
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
                  style={{ padding: '9px 20px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: mapMode === key ? '#2c5a9e' : '#e5e8f0', background: mapMode === key ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'white', color: mapMode === key ? 'white' : '#555' }}>
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
                        <span style={{ background: '#eef2fb', color: '#2c5a9e', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                            <Clock size={13} color="#f88124" />
                            <span style={{ fontWeight: '700', color: '#f88124', fontSize: '13px' }}>{formatHour(Number(hour))}</span>
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
                                style={{ fontSize: '13px', color: '#2c5a9e', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          <Map size={48} color="#2c5a9e" style={{ marginBottom: '16px' }} />
                          <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800' }}>{uniqueStops.length} stops today</h3>
                          <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>{uniqueStops.map(b => `${b.dogs?.owners?.address}, ${b.dogs?.owners?.city}`).join(' → ')}</p>
                          <a href={`https://www.google.com/maps/dir/${routeUrl}`} target="_blank"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}>
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
                  <Map size={17} color="#2c5a9e" />
                  <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '16px' }}>Week's Clients ({weekBookings.filter(b => b.status === 'confirmed' && b.dogs?.owners?.address).length} bookings)</h3>
                </div>
                {weekDates.map(dateStr => {
                  const dayB = weekBookings.filter(b => b.booking_date === dateStr && b.status === 'confirmed' && b.dogs?.owners?.address)
                  if (dayB.length === 0) return null
                  const d = new Date(dateStr + 'T12:00:00')
                  return (
                    <div key={dateStr}>
                      <div style={{ padding: '10px 20px', background: '#f8f9fc', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={13} color="#2c5a9e" />
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
                            style={{ fontSize: '13px', color: '#2c5a9e', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

      {/* CANCEL MODAL */}
      {cancelBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '18px' }}>Cancel Booking</h3>
              <button onClick={() => setCancelBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1a1a2e' }}>{cancelBooking.dogs?.name}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{new Date(cancelBooking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {formatHour(cancelBooking.slot_hour)}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>{cancelBooking.dogs?.owners?.name}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }}>Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Van maintenance, weather, scheduling conflict..."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const, color: '#1a1a2e', background: 'white' }}
              />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#aaa' }}>This will be included in the cancellation email to the client.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelBooking(null)}
                style={{ flex: 1, padding: '12px', background: '#f0f2f7', color: '#555', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={cancelLoading}
                style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                {cancelLoading ? 'Cancelling...' : 'Cancel & Notify Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '18px' }}>Reschedule Booking</h3>
              <button onClick={() => setRescheduleBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1a1a2e' }}>{rescheduleBooking.dogs?.name}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Currently: {new Date(rescheduleBooking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {formatHour(rescheduleBooking.slot_hour)}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>{rescheduleBooking.dogs?.owners?.name}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }}>New Date</label>
              <input type="date" value={newDate} onChange={async (e) => { setNewDate(e.target.value); setNewHour(''); await loadAvailableHours(e.target.value, cityWindows, rescheduleBooking.id) }}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#1a1a2e', background: 'white' }} />
              {newDate && !isDateAvailable(newDate) && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc3545', fontWeight: '600' }}>⚠️ This date is not a scheduled day for this dog's city. Please pick another date.</p>
              )}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }}>New Time Slot</label>
              <select value={newHour} onChange={(e) => setNewHour(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const, color: newHour ? '#1a1a2e' : '#aaa' }}>
                <option value="">Select a time...</option>
                {availableHours.length > 0
                  ? availableHours.map(h => <option key={h} value={h}>{formatHour(h)}</option>)
                  : newDate && isDateAvailable(newDate)
                    ? <option disabled>No available slots for this date</option>
                    : null
                }
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRescheduleBooking(null)}
                style={{ flex: 1, padding: '12px', background: '#f0f2f7', color: '#555', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReschedule} disabled={rescheduleLoading || !newDate || !newHour}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #2c5a9e, #001840)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: (!newDate || !newHour) ? 0.6 : 1 }}>
                {rescheduleLoading ? 'Rescheduling...' : 'Reschedule & Notify Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}