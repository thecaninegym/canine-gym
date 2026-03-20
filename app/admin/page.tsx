'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, LogOut, UserPlus, Activity, Users, Calendar, CreditCard, BarChart2, DollarSign, ShieldAlert, Clock, Bell, Zap } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) window.location.href = '/'
    }
    getUser()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setStatsLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: todayBookings },
      { data: pendingVaccines },
      { data: activeMemberships },
      { data: newClients },
      { data: upcomingBookings },
    ] = await Promise.all([
      supabase.from('bookings').select('id, status').eq('booking_date', today),
      supabase.from('dog_vaccines').select('id, dogs(name)').eq('status', 'pending'),
      supabase.from('memberships').select('plan, dog_count').eq('status', 'active'),
      supabase.from('owners').select('id').gte('created_at', weekAgo),
      supabase.from('bookings').select('id').eq('status', 'confirmed').gte('booking_date', today),
    ])

    const prices: Record<string, number> = { starter: 180, active: 340, athlete: 480 }
    const mrr = (activeMemberships || []).reduce((sum: number, m: any) => sum + (prices[m.plan] || 0), 0)

    setStats({
      todayConfirmed: (todayBookings || []).filter((b: any) => b.status === 'confirmed').length,
      todayCompleted: (todayBookings || []).filter((b: any) => b.status === 'completed').length,
      pendingVaccines: pendingVaccines || [],
      activeMembers: (activeMemberships || []).length,
      newClientsThisWeek: (newClients || []).length,
      mrr,
      upcomingTotal: (upcomingBookings || []).length,
    })
    setStatsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const cards = [
    { label: 'Add Owner', href: '/admin/owners/new', icon: <UserPlus size={24} color="white" />, orange: false },
    { label: 'Add Dog', href: '/admin/dogs/new', icon: <PawPrint size={24} color="white" />, orange: false },
    { label: 'Log Session', href: '/admin/sessions/new', icon: <Activity size={24} color="white" />, orange: true },
    { label: 'View All Dogs', href: '/admin/dogs', icon: <PawPrint size={24} color="white" />, orange: false },
    { label: 'View Owners', href: '/admin/owners', icon: <Users size={24} color="white" />, orange: false },
    { label: 'Schedule', href: '/admin/schedule', icon: <Calendar size={24} color="white" />, orange: false },
    { label: 'Memberships', href: '/admin/memberships', icon: <CreditCard size={24} color="white" />, orange: false },
    { label: 'Reports', href: '/admin/reports', icon: <BarChart2 size={24} color="white" />, orange: false },
    { label: 'Send Broadcast', href: '/admin/broadcast', icon: <Bell size={24} color="white" />, orange: false },

  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        * { box-sizing: border-box; }
        .admin-card:hover { transform: translateY(-2px) !important; }
      `}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 6vw, 56px)', width: 'auto' }} />
          <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>· Admin</span>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#f88124', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={14} /> Logout
        </button>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* ── LIVE STATS BANNER ── */}
        <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 8px 32px rgba(0,48,135,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.04, pointerEvents: 'none' }}>
            <Activity size={220} color="white" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'white' }}>Live Overview</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '700' }}>Live</span>
            </div>
          </div>

          {statsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', animation: 'shimmer 1.5s infinite' }}>
                  <div style={{ height: '11px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', marginBottom: '12px', width: '65%' }} />
                  <div style={{ height: '28px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', width: '45%' }} />
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '8px', width: '80%' }} />
                </div>
              ))}
            </div>
          ) : stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[
                { label: "Today's Sessions", value: stats.todayConfirmed, sub: `${stats.todayCompleted} completed`, icon: <Calendar size={15} color="rgba(255,255,255,0.6)" /> },
                { label: 'Upcoming Booked', value: stats.upcomingTotal, sub: 'confirmed sessions', icon: <Clock size={15} color="rgba(255,255,255,0.6)" /> },
                { label: 'Active Members', value: stats.activeMembers, sub: 'subscriptions', icon: <CreditCard size={15} color="rgba(255,255,255,0.6)" /> },
                { label: 'Monthly MRR', value: `$${stats.mrr.toLocaleString()}`, sub: 'membership revenue', icon: <DollarSign size={15} color="rgba(255,255,255,0.6)" /> },
                { label: 'New Clients', value: stats.newClientsThisWeek, sub: 'signed up this week', icon: <Users size={15} color="rgba(255,255,255,0.6)" /> },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                    {stat.icon}
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pending vaccine alert */}
          {!statsLoading && stats?.pendingVaccines?.length > 0 && (
            <a href="/admin/dogs/vaccines" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(248,129,36,0.15)', border: '1.5px solid rgba(248,129,36,0.5)', borderRadius: '12px', padding: '14px 18px', marginTop: '16px', textDecoration: 'none', position: 'relative' }}>
              <div style={{ width: '36px', height: '36px', background: '#f88124', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldAlert size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontWeight: '800', color: 'white', fontSize: '14px' }}>
                  {stats.pendingVaccines.length} vaccine record{stats.pendingVaccines.length !== 1 ? 's' : ''} awaiting review
                </p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>
                  {stats.pendingVaccines.slice(0, 3).map((v: any) => v.dogs?.name).filter(Boolean).join(', ')}
                  {stats.pendingVaccines.length > 3 ? ` +${stats.pendingVaccines.length - 3} more` : ''} — tap to review
                </p>
              </div>
              <span style={{ color: '#f88124', fontSize: '18px', fontWeight: '800', flexShrink: 0 }}>→</span>
            </a>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>Quick Actions</h3>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Manage your gym operations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '14px' }}>
          {cards.map(item => (
            <a key={item.label} href={item.href} className="admin-card"
              style={{ background: item.orange ? 'linear-gradient(135deg, #f88124, #f9a04e)' : 'linear-gradient(135deg, #001840, #2c5a9e)', color: 'white', padding: '24px 20px', borderRadius: '16px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', boxShadow: item.orange ? '0 4px 20px rgba(255,107,53,0.3)' : '0 4px 20px rgba(0,48,135,0.2)', transition: 'all 0.2s' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              {item.label}
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}