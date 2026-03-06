'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Calendar, Activity, User, CreditCard, Users, DollarSign, MapPin, BarChart2, Trophy, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

export default function AdminReports() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [memberships, setMemberships] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [bookingsRes, ownersRes, membershipsRes, sessionsRes] = await Promise.all([
      supabase.from('bookings').select('*, dogs(name, owners(name, city))').order('booking_date', { ascending: false }),
      supabase.from('owners').select('*').order('created_at', { ascending: true }),
      supabase.from('memberships').select('*, owners(name)').order('created_at', { ascending: false }),
      supabase.from('sessions').select('*').order('session_date', { ascending: false })
    ])
    setBookings(bookingsRes.data || [])
    setOwners(ownersRes.data || [])
    setMemberships(membershipsRes.data || [])
    setSessions(sessionsRes.data || [])
    setLoading(false)
  }

  const today = new Date()

  const getPeriodDates = (offset = 0) => {
    if (period === 'week') {
      const start = new Date(today)
      start.setDate(today.getDate() - today.getDay() - offset * 7)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    } else {
      const start = new Date(today.getFullYear(), today.getMonth() - offset, 1)
      const end = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0, 23, 59, 59)
      return { start, end }
    }
  }

  const current = getPeriodDates(0)
  const previous = getPeriodDates(1)

  const filterByPeriod = (items: any[], dateField: string, { start, end }: { start: Date, end: Date }) =>
    items.filter(item => { const d = new Date(item[dateField]); return d >= start && d <= end })

  const currentBookings = filterByPeriod(bookings, 'booking_date', current).filter(b => b.status !== 'cancelled')
  const previousBookings = filterByPeriod(bookings, 'booking_date', previous).filter(b => b.status !== 'cancelled')
  const currentSessions = filterByPeriod(sessions, 'session_date', current)
  const previousSessions = filterByPeriod(sessions, 'session_date', previous)
  const currentNewClients = filterByPeriod(owners, 'created_at', current)
  const previousNewClients = filterByPeriod(owners, 'created_at', previous)
  const activeMemberships = memberships.filter(m => m.status === 'active')

  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 100)
  }

  const bookingChange = pctChange(currentBookings.length, previousBookings.length)
  const sessionChange = pctChange(currentSessions.length, previousSessions.length)
  const clientChange = pctChange(currentNewClients.length, previousNewClients.length)

  const bookingsByCity: Record<string, number> = {}
  currentBookings.forEach(b => {
    const city = b.dogs?.owners?.city || 'Unknown'
    bookingsByCity[city] = (bookingsByCity[city] || 0) + 1
  })
  const citySorted = Object.entries(bookingsByCity).sort((a, b) => b[1] - a[1])
  const maxCityCount = citySorted[0]?.[1] || 1

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bookingsByDay: Record<string, number> = {}
  dayNames.forEach(d => bookingsByDay[d] = 0)
  currentBookings.forEach(b => {
    const day = dayNames[new Date(b.booking_date + 'T12:00:00').getDay()]
    bookingsByDay[day] = (bookingsByDay[day] || 0) + 1
  })
  const maxDayCount = Math.max(...Object.values(bookingsByDay), 1)

  const membershipRevenue = activeMemberships.reduce((sum, m) => {
    const prices: Record<string, number[]> = { starter: [180, 324], active: [340, 612], athlete: [480, 864] }
    return sum + (prices[m.plan]?.[m.dog_count - 1] || 0)
  }, 0)

  const longestClients = [...owners]
    .filter(o => o.created_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map(o => ({
      name: o.name,
      months: Math.max(0, Math.floor((today.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    }))

  const formatPeriodLabel = () => {
    if (period === 'week') return `${current.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${current.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    return current.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const ChangeTag = ({ value }: { value: number }) => (
    <span style={{ backgroundColor: value > 0 ? '#d4edda' : value < 0 ? '#f8d7da' : '#f0f0f0', color: value > 0 ? '#155724' : value < 0 ? '#721c24' : '#666', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
      {value > 0 ? `↑ ${value}%` : value < 0 ? `↓ ${Math.abs(value)}%` : '→ 0%'}
    </span>
  )

  const metrics = [
    { label: 'Bookings', value: currentBookings.length, change: bookingChange, icon: <Calendar size={20} color="#003087" /> },
    { label: 'Sessions Logged', value: currentSessions.length, change: sessionChange, icon: <Activity size={20} color="#003087" /> },
    { label: 'New Clients', value: currentNewClients.length, change: clientChange, icon: <User size={20} color="#003087" /> },
    { label: 'Active Members', value: activeMemberships.length, change: null, icon: <CreditCard size={20} color="#003087" /> },
    { label: 'Total Clients', value: owners.length, change: null, icon: <Users size={20} color="#003087" /> },
    { label: 'Monthly MRR', value: `$${membershipRevenue.toLocaleString()}`, change: null, icon: <DollarSign size={20} color="#28a745" /> },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Loading reports...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart2 size={28} color="#003087" />
            <div>
              <h2 style={{ color: '#003087', margin: '0 0 4px 0' }}>Reports</h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{formatPeriodLabel()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button onClick={() => setPeriod('week')}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', backgroundColor: period === 'week' ? '#003087' : 'transparent', color: period === 'week' ? 'white' : '#666' }}>
              Weekly
            </button>
            <button onClick={() => setPeriod('month')}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', backgroundColor: period === 'month' ? '#003087' : 'transparent', color: period === 'month' ? 'white' : '#666' }}>
              Monthly
            </button>
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {metrics.map((metric, i) => (
            <div key={i} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {metric.icon}
                <p style={{ margin: 0, fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>{metric.label}</p>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '32px', fontWeight: 'bold', color: '#003087' }}>{metric.value}</p>
              {metric.change !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChangeTag value={metric.change} />
                  <span style={{ fontSize: '12px', color: '#999' }}>vs prev {period}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Bookings by city */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin size={20} color="#003087" />
              <h3 style={{ color: '#003087', margin: 0 }}>Bookings by City</h3>
            </div>
            {citySorted.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px' }}>No bookings this {period}.</p>
            ) : citySorted.map(([city, count]) => (
              <div key={city} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{city}</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>{count} booking{count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#003087', height: '100%', width: `${(count / maxCityCount) * 100}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bookings by day */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Calendar size={20} color="#003087" />
              <h3 style={{ color: '#003087', margin: 0 }}>Bookings by Day</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {dayNames.map(day => {
                const count = bookingsByDay[day] || 0
                const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>{count}</span>
                    <div style={{ width: '100%', backgroundColor: count > 0 ? '#003087' : '#f0f0f0', borderRadius: '4px 4px 0 0', height: `${Math.max(height, count > 0 ? 8 : 4)}%`, transition: 'height 0.3s' }} />
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>{day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Membership breakdown */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <CreditCard size={20} color="#003087" />
              <h3 style={{ color: '#003087', margin: 0 }}>Membership Breakdown</h3>
            </div>
            {[
              { plan: 'Starter', count: activeMemberships.filter(m => m.plan === 'starter').length, color: '#6c757d', revenue: activeMemberships.filter(m => m.plan === 'starter').reduce((s, m) => s + (m.dog_count === 2 ? 324 : 180), 0) },
              { plan: 'Active', count: activeMemberships.filter(m => m.plan === 'active').length, color: '#FF6B35', revenue: activeMemberships.filter(m => m.plan === 'active').reduce((s, m) => s + (m.dog_count === 2 ? 612 : 340), 0) },
              { plan: 'Athlete', count: activeMemberships.filter(m => m.plan === 'athlete').length, color: '#003087', revenue: activeMemberships.filter(m => m.plan === 'athlete').reduce((s, m) => s + (m.dog_count === 2 ? 864 : 480), 0) },
            ].map(({ plan, count, color, revenue }) => (
              <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{plan}</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>{count} member{count !== 1 ? 's' : ''}</span>
                </div>
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>${revenue.toLocaleString()}/mo</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#333' }}>Total MRR</span>
              <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '18px' }}>${membershipRevenue.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Longest clients */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Trophy size={20} color="#003087" />
              <h3 style={{ color: '#003087', margin: 0 }}>Longest Clients</h3>
            </div>
            {longestClients.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px' }}>No clients yet.</p>
            ) : longestClients.map((client, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#003087', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{client.name}</span>
                </div>
                <span style={{ color: '#666', fontSize: '14px' }}>{client.months} month{client.months !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking health */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity size={20} color="#003087" />
            <h3 style={{ color: '#003087', margin: 0 }}>Booking Health</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Confirmed', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'confirmed').length, color: '#003087', icon: <Clock size={24} color="#003087" /> },
              { label: 'Completed', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'completed').length, color: '#28a745', icon: <CheckCircle size={24} color="#28a745" /> },
              { label: 'Cancelled', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'cancelled').length, color: '#dc3545', icon: <XCircle size={24} color="#dc3545" /> },
              { label: 'No Shows', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'no_show').length, color: '#ffc107', icon: <AlertTriangle size={24} color="#ffc107" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{icon}</div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}