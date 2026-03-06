'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, CreditCard, DollarSign, Users, Mail, Phone, Calendar, CheckCircle, XCircle, AlertTriangle, Plus, Minus, Save } from 'lucide-react'

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchMemberships() }, [])

  const fetchMemberships = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('memberships')
      .select('*, owners(name, email, phone)')
      .order('created_at', { ascending: false })
    setMemberships(data || [])
    // Initialize adjustments to current values
    const initial: Record<string, number> = {}
    for (const m of data || []) initial[m.id] = m.sessions_remaining
    setAdjustments(initial)
    setLoading(false)
  }

  const handleAdjust = (id: string, delta: number, max: number) => {
    setAdjustments(prev => ({
      ...prev,
      [id]: Math.max(0, Math.min(max, (prev[id] ?? 0) + delta))
    }))
    setSaved(prev => ({ ...prev, [id]: false }))
  }

  const handleSave = async (membership: any) => {
    setSaving(prev => ({ ...prev, [membership.id]: true }))
    await supabase
      .from('memberships')
      .update({ sessions_remaining: adjustments[membership.id] })
      .eq('id', membership.id)
    setSaving(prev => ({ ...prev, [membership.id]: false }))
    setSaved(prev => ({ ...prev, [membership.id]: true }))
    // Update local state
    setMemberships(prev => prev.map(m => m.id === membership.id ? { ...m, sessions_remaining: adjustments[membership.id] } : m))
    setTimeout(() => setSaved(prev => ({ ...prev, [membership.id]: false })), 2000)
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

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle size={14} color="white" />
    if (status === 'cancelled') return <XCircle size={14} color="white" />
    if (status === 'past_due') return <AlertTriangle size={14} color="white" />
    return null
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeMemberships = memberships.filter(m => m.status === 'active')
  const totalRevenue = activeMemberships.reduce((sum, m) => {
    const prices: Record<string, number[]> = { starter: [180, 324], active: [340, 612], athlete: [480, 864] }
    return sum + (prices[m.plan]?.[m.dog_count - 1] || 0)
  }, 0)

  const summaryCards = [
    { label: 'Active Members', value: activeMemberships.length, color: '#003087', icon: <Users size={20} color="#003087" /> },
    { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#28a745', icon: <DollarSign size={20} color="#28a745" /> },
    { label: 'Starter Plans', value: activeMemberships.filter(m => m.plan === 'starter').length, color: '#6c757d', icon: <CreditCard size={20} color="#6c757d" /> },
    { label: 'Active Plans', value: activeMemberships.filter(m => m.plan === 'active').length, color: '#FF6B35', icon: <CreditCard size={20} color="#FF6B35" /> },
    { label: 'Athlete Plans', value: activeMemberships.filter(m => m.plan === 'athlete').length, color: '#003087', icon: <CreditCard size={20} color="#003087" /> },
  ]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <CreditCard size={28} color="#003087" />
          <h2 style={{ color: '#003087', margin: 0 }}>Memberships</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {card.icon}
                <p style={{ margin: 0, fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>{card.label}</p>
              </div>
              <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#003087" />
            <h3 style={{ margin: 0, color: '#003087' }}>All Memberships ({memberships.length})</h3>
          </div>
          {loading ? (
            <p style={{ padding: '24px', color: '#666' }}>Loading...</p>
          ) : memberships.length === 0 ? (
            <p style={{ padding: '24px', color: '#666' }}>No memberships yet.</p>
          ) : (
            memberships.map(membership => {
              const current = adjustments[membership.id] ?? membership.sessions_remaining
              const isDirty = current !== membership.sessions_remaining
              return (
                <div key={membership.id} style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{membership.owners?.name}</span>
                      <span style={{ backgroundColor: getPlanColor(membership.plan), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {membership.plan}
                      </span>
                      <span style={{ backgroundColor: getStatusColor(membership.status), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getStatusIcon(membership.status)} {membership.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="#999" /> {membership.owners?.email}
                        <Phone size={13} color="#999" style={{ marginLeft: '8px' }} /> {membership.owners?.phone}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PawPrint size={13} color="#999" /> {membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#999" /> Renews {formatDate(membership.current_period_end)}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ backgroundColor: '#f0f4ff', padding: '12px 20px', borderRadius: '10px', marginBottom: '10px' }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>Sessions Remaining</p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', color: current === 0 ? '#dc3545' : '#003087' }}>
                        {current}
                      </p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>of {membership.sessions_per_month}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleAdjust(membership.id, -1, membership.sessions_per_month)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} color="#666" />
                        </button>
                        <button onClick={() => handleAdjust(membership.id, 1, membership.sessions_per_month)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} color="#666" />
                        </button>
                      </div>
                    </div>
                    {isDirty && (
                      <button onClick={() => handleSave(membership)} disabled={saving[membership.id]}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Save size={13} /> {saving[membership.id] ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    {saved[membership.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#28a745', fontSize: '13px', fontWeight: 'bold' }}>
                        <CheckCircle size={13} color="#28a745" /> Saved!
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}