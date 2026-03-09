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
  currentBookings.forEach(b => { const city = b.dogs?.owners?.city || 'Unknown'; bookingsByCity[city] = (bookingsByCity[city] || 0) + 1 })
  const citySorted = Object.entries(bookingsByCity).sort((a, b) => b[1] - a[1])
  const maxCityCount = citySorted[0]?.[1] || 1

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bookingsByDay: Record<string, number> = {}
  dayNames.forEach(d => bookingsByDay[d] = 0)
  currentBookings.forEach(b => { const day = dayNames[new Date(b.booking_date + 'T12:00:00').getDay()]; bookingsByDay[day] = (bookingsByDay[day] || 0) + 1 })
  const maxDayCount = Math.max(...Object.values(bookingsByDay), 1)

  const membershipRevenue = activeMemberships.reduce((sum, m) => {
    const prices: Record<string, number[]> = { starter: [180, 324], active: [340, 612], athlete: [480, 864] }
    return sum + (prices[m.plan]?.[m.dog_count - 1] || 0)
  }, 0)

  const longestClients = [...owners]
    .filter(o => o.created_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map(o => ({ name: o.name, months: Math.max(0, Math.floor((today.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))) }))

  const formatPeriodLabel = () => {
    if (period === 'week') return `${current.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${current.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    return current.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const ChangeTag = ({ value }: { value: number }) => (
    <span style={{ background: value > 0 ? '#d4edda' : value < 0 ? '#f8d7da' : '#f0f2f7', color: value > 0 ? '#155724' : value < 0 ? '#721c24' : '#888', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {value > 0 ? `↑ ${value}%` : value < 0 ? `↓ ${Math.abs(value)}%` : '→ 0%'}
    </span>
  )

  const metrics = [
    { label: 'Bookings', value: currentBookings.length, change: bookingChange, icon: <Calendar size={18} color="white" />, bg: 'linear-gradient(135deg, #001840, #2c5a9e)' },
    { label: 'Sessions Logged', value: currentSessions.length, change: sessionChange, icon: <Activity size={18} color="white" />, bg: 'linear-gradient(135deg, #001840, #2c5a9e)' },
    { label: 'New Clients', value: currentNewClients.length, change: clientChange, icon: <User size={18} color="white" />, bg: 'linear-gradient(135deg, #001840, #2c5a9e)' },
    { label: 'Active Members', value: activeMemberships.length, change: null, icon: <CreditCard size={18} color="white" />, bg: 'linear-gradient(135deg, #f88124, #f9a04e)' },
    { label: 'Total Clients', value: owners.length, change: null, icon: <Users size={18} color="white" />, bg: 'linear-gradient(135deg, #001840, #2c5a9e)' },
    { label: 'Monthly MRR', value: `$${membershipRevenue.toLocaleString()}`, change: null, icon: <DollarSign size={18} color="white" />, bg: 'linear-gradient(135deg, #1a7a2e, #28a745)' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <p style={{ color: '#aaa' }}>Loading reports...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
  @media (max-width: 600px) {
    .reports-grid { grid-template-columns: 1fr !important; }
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

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={22} color="white" />
            </div>
            <div>
              <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Reports</h2>
              <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>{formatPeriodLabel()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', background: 'white', borderRadius: '10px', padding: '4px', gap: '4px', border: '1.5px solid #eef0f5' }}>
            <button onClick={() => setPeriod('week')}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: period === 'week' ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'transparent', color: period === 'week' ? 'white' : '#888' }}>
              Weekly
            </button>
            <button onClick={() => setPeriod('month')}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: period === 'month' ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'transparent', color: period === 'month' ? 'white' : '#888' }}>
              Monthly
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {metrics.map((metric, i) => (
            <div key={i} style={{ background: metric.bg, padding: '20px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{metric.icon}</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const, fontWeight: '700', letterSpacing: '0.5px' }}>{metric.label}</p>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: '800', color: 'white' }}>{metric.value}</p>
              {metric.change !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChangeTag value={metric.change} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>vs prev {period}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
  {/* Bookings by city */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin size={17} color="#2c5a9e" />
              <h3 style={{ color: '#1a1a2e', margin: 0, fontWeight: '800', fontSize: '15px' }}>Bookings by City</h3>
            </div>
            {citySorted.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '14px' }}>No bookings this {period}.</p>
            ) : citySorted.map(([city, count]) => (
              <div key={city} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '13px' }}>{city}</span>
                  <span style={{ color: '#888', fontSize: '13px' }}>{count} booking{count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ background: '#f0f2f7', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', height: '100%', width: `${(count / maxCityCount) * 100}%`, borderRadius: '6px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bookings by day */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Calendar size={17} color="#2c5a9e" />
              <h3 style={{ color: '#1a1a2e', margin: 0, fontWeight: '800', fontSize: '15px' }}>Bookings by Day</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {dayNames.map(day => {
                const count = bookingsByDay[day] || 0
                const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: '700' }}>{count > 0 ? count : ''}</span>
                    <div style={{ width: '100%', background: count > 0 ? 'linear-gradient(to top, #2c5a9e, #2c5a9e)' : '#f0f2f7', borderRadius: '4px 4px 0 0', height: `${Math.max(height, count > 0 ? 8 : 4)}%`, transition: 'height 0.3s' }} />
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: '700' }}>{day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
  {/* Membership breakdown */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <CreditCard size={17} color="#2c5a9e" />
              <h3 style={{ color: '#1a1a2e', margin: 0, fontWeight: '800', fontSize: '15px' }}>Membership Breakdown</h3>
            </div>
            {[
              { plan: 'Starter', count: activeMemberships.filter(m => m.plan === 'starter').length, color: '#6c757d', revenue: activeMemberships.filter(m => m.plan === 'starter').reduce((s, m) => s + (m.dog_count === 2 ? 324 : 180), 0) },
              { plan: 'Active', count: activeMemberships.filter(m => m.plan === 'active').length, color: '#f88124', revenue: activeMemberships.filter(m => m.plan === 'active').reduce((s, m) => s + (m.dog_count === 2 ? 612 : 340), 0) },
              { plan: 'Athlete', count: activeMemberships.filter(m => m.plan === 'athlete').length, color: '#2c5a9e', revenue: activeMemberships.filter(m => m.plan === 'athlete').reduce((s, m) => s + (m.dog_count === 2 ? 864 : 480), 0) },
            ].map(({ plan, count, color, revenue }) => (
              <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{plan}</span>
                  <span style={{ color: '#888', fontSize: '13px' }}>{count} member{count !== 1 ? 's' : ''}</span>
                </div>
                <span style={{ color: '#28a745', fontWeight: '700', fontSize: '14px' }}>${revenue.toLocaleString()}/mo</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
              <span style={{ fontWeight: '800', color: '#1a1a2e' }}>Total MRR</span>
              <span style={{ color: '#28a745', fontWeight: '800', fontSize: '17px' }}>${membershipRevenue.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Longest clients */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Trophy size={17} color="#2c5a9e" />
              <h3 style={{ color: '#1a1a2e', margin: 0, fontWeight: '800', fontSize: '15px' }}>Longest Clients</h3>
            </div>
            {longestClients.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '14px' }}>No clients yet.</p>
            ) : longestClients.map((client, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #001840, #2c5a9e)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{client.name}</span>
                </div>
                <span style={{ color: '#888', fontSize: '13px' }}>{client.months} month{client.months !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking health */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity size={17} color="#2c5a9e" />
            <h3 style={{ color: '#1a1a2e', margin: 0, fontWeight: '800', fontSize: '15px' }}>Booking Health</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Confirmed', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'confirmed').length, color: '#2c5a9e', bg: '#eef2fb', icon: <Clock size={22} color="#2c5a9e" /> },
              { label: 'Completed', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'completed').length, color: '#28a745', bg: '#d4edda', icon: <CheckCircle size={22} color="#28a745" /> },
              { label: 'Cancelled', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'cancelled').length, color: '#dc3545', bg: '#f8d7da', icon: <XCircle size={22} color="#dc3545" /> },
              { label: 'No Shows', value: filterByPeriod(bookings, 'booking_date', current).filter(b => b.status === 'no_show').length, color: '#856404', bg: '#fff3cd', icon: <AlertTriangle size={22} color="#856404" /> },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} style={{ textAlign: 'center', padding: '20px 16px', background: bg, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{icon}</div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '30px', fontWeight: '800', color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}