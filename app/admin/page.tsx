'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, LogOut, UserPlus, Activity, Users, Calendar, CreditCard, BarChart2 } from 'lucide-react'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) window.location.href = '/'
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const cards = [
    { label: 'Add Owner', href: '/admin/owners/new', icon: <UserPlus size={26} color="white" />, orange: false },
    { label: 'Add Dog', href: '/admin/dogs/new', icon: <PawPrint size={26} color="white" />, orange: false },
    { label: 'Log Session', href: '/admin/sessions/new', icon: <Activity size={26} color="white" />, orange: true },
    { label: 'View All Dogs', href: '/admin/dogs', icon: <PawPrint size={26} color="white" />, orange: false },
    { label: 'View Owners', href: '/admin/owners', icon: <Users size={26} color="white" />, orange: false },
    { label: 'Schedule', href: '/admin/schedule', icon: <Calendar size={26} color="white" />, orange: false },
    { label: 'Memberships', href: '/admin/memberships', icon: <CreditCard size={26} color="white" />, orange: false },
    { label: 'Reports', href: '/admin/reports', icon: <BarChart2 size={26} color="white" />, orange: false },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PawPrint size={20} color="#FF6B35" />
          </div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>The Canine Gym <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>· Admin</span></span>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={14} /> Logout
        </button>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Admin Dashboard</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Manage your gym operations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {cards.map(item => (
            <a key={item.label} href={item.href} style={{ background: item.orange ? 'linear-gradient(135deg, #FF6B35, #ff8c5a)' : 'linear-gradient(135deg, #001a4d, #003087)', color: 'white', padding: '28px 24px', borderRadius: '16px', textDecoration: 'none', fontWeight: '700', fontSize: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', boxShadow: item.orange ? '0 4px 20px rgba(255,107,53,0.3)' : '0 4px 20px rgba(0,48,135,0.2)', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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