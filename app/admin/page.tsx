'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, LogOut, UserPlus, Dog, ClipboardList, Users, Calendar, CreditCard, BarChart2, Activity } from 'lucide-react'

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
    { label: 'Add Owner', href: '/admin/owners/new', color: '#003087', icon: <UserPlus size={28} color="white" /> },
    { label: 'Add Dog', href: '/admin/dogs/new', color: '#003087', icon: <PawPrint size={28} color="white" /> },
    { label: 'Log Session', href: '/admin/sessions/new', color: '#FF6B35', icon: <Activity size={28} color="white" /> },
    { label: 'View All Dogs', href: '/admin/dogs', color: '#003087', icon: <PawPrint size={28} color="white" /> },
    { label: 'View Owners', href: '/admin/owners', color: '#003087', icon: <Users size={28} color="white" /> },
    { label: 'Schedule', href: '/admin/schedule', color: '#003087', icon: <Calendar size={28} color="white" /> },
    { label: 'Memberships', href: '/admin/memberships', color: '#003087', icon: <CreditCard size={28} color="white" /> },
    { label: 'Reports', href: '/admin/reports', color: '#003087', icon: <BarChart2 size={28} color="white" /> },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={16} /> Logout
        </button>
      </nav>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {cards.map((item) => (
            <a key={item.label} href={item.href}
              style={{ backgroundColor: item.color, color: 'white', padding: '28px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
              {item.icon}
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}