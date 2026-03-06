'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('memberships')
      .select('*, owners(name, email, phone)')
      .order('created_at', { ascending: false })
    setMemberships(data || [])
    setLoading(false)
  }

  const getPlanColor = (plan: string) => {
    if (plan === 'starter') return '#6c757d'
    if (plan === 'active') return '#FF6B35'
    if (plan === 'athlete') return '#003087'
    return '#666'
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return '#28a745'
    if (status === 'cancelled') return '#dc3545'
    if (status === 'past_due') return '#ffc107'
    return '#666'
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeMemberships = memberships.filter(m => m.status === 'active')
  const totalRevenue = activeMemberships.reduce((sum, m) => {
    const prices: Record<string, number[]> = {
      starter: [180, 324],
      active: [340, 612],
      athlete: [480, 864]
    }
    return sum + (prices[m.plan]?.[m.dog_count - 1] || 0)
  }, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>💳 Memberships</h2>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Members</p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#003087' }}>{activeMemberships.length}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Monthly Revenue</p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>${totalRevenue.toLocaleString()}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Starter Plans</p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#6c757d' }}>{activeMemberships.filter(m => m.plan === 'starter').length}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Plans</p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#FF6B35' }}>{activeMemberships.filter(m => m.plan === 'active').length}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Athlete Plans</p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#003087' }}>{activeMemberships.filter(m => m.plan === 'athlete').length}</p>
          </div>
        </div>

        {/* Memberships list */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, color: '#003087' }}>All Memberships ({memberships.length})</h3>
          </div>
          {loading ? (
            <p style={{ padding: '24px', color: '#666' }}>Loading...</p>
          ) : memberships.length === 0 ? (
            <p style={{ padding: '24px', color: '#666' }}>No memberships yet.</p>
          ) : (
            memberships.map(membership => (
              <div key={membership.id} style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{membership.owners?.name}</span>
                    <span style={{ backgroundColor: getPlanColor(membership.plan), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {membership.plan}
                    </span>
                    <span style={{ backgroundColor: getStatusColor(membership.status), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {membership.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#666' }}>📧 {membership.owners?.email} · 📞 {membership.owners?.phone}</p>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#666' }}>🐾 {membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>📅 Renews {formatDate(membership.current_period_end)}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ backgroundColor: '#f0f4ff', padding: '12px 20px', borderRadius: '10px', marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>Sessions Remaining</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: membership.sessions_remaining === 0 ? '#dc3545' : '#003087' }}>
                      {membership.sessions_remaining}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>of {membership.sessions_per_month}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}