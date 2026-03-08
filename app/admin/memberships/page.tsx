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
    const { data } = await supabase.from('memberships').select('*, owners(name, email, phone)').order('created_at', { ascending: false })
    setMemberships(data || [])
    const initial: Record<string, number> = {}
    for (const m of data || []) initial[m.id] = m.sessions_remaining
    setAdjustments(initial)
    setLoading(false)
  }

  const handleAdjust = (id: string, delta: number, max: number) => {
    setAdjustments(prev => ({ ...prev, [id]: Math.max(0, Math.min(max, (prev[id] ?? 0) + delta)) }))
    setSaved(prev => ({ ...prev, [id]: false }))
  }

  const handleSave = async (membership: any) => {
    setSaving(prev => ({ ...prev, [membership.id]: true }))
    await supabase.from('memberships').update({ sessions_remaining: adjustments[membership.id] }).eq('id', membership.id)
    setSaving(prev => ({ ...prev, [membership.id]: false }))
    setSaved(prev => ({ ...prev, [membership.id]: true }))
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
    if (status === 'active') return <CheckCircle size={13} color="white" />
    if (status === 'cancelled') return <XCircle size={13} color="white" />
    if (status === 'past_due') return <AlertTriangle size={13} color="white" />
    return null
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const activeMemberships = memberships.filter(m => m.status === 'active')
  const totalRevenue = activeMemberships.reduce((sum, m) => {
    const prices: Record<string, number[]> = { starter: [180, 324], active: [340, 612], athlete: [480, 864] }
    return sum + (prices[m.plan]?.[m.dog_count - 1] || 0)
  }, 0)

  const summaryCards = [
    { label: 'Active Members', value: activeMemberships.length, color: '#003087', icon: <Users size={20} color="white" />, bg: 'linear-gradient(135deg, #001a4d, #003087)' },
    { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#28a745', icon: <DollarSign size={20} color="white" />, bg: 'linear-gradient(135deg, #1a7a2e, #28a745)' },
    { label: 'Starter Plans', value: activeMemberships.filter(m => m.plan === 'starter').length, color: '#6c757d', icon: <CreditCard size={20} color="white" />, bg: 'linear-gradient(135deg, #495057, #6c757d)' },
    { label: 'Active Plans', value: activeMemberships.filter(m => m.plan === 'active').length, color: '#FF6B35', icon: <CreditCard size={20} color="white" />, bg: 'linear-gradient(135deg, #FF6B35, #ff8c5a)' },
    { label: 'Athlete Plans', value: activeMemberships.filter(m => m.plan === 'athlete').length, color: '#003087', icon: <CreditCard size={20} color="white" />, bg: 'linear-gradient(135deg, #001a4d, #003087)' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }  @media (max-width: 560px) {
  .membership-row { flex-direction: column; align-items: stretch; }
  .membership-sessions { width: 100%; }
  .membership-sessions > div { width: 100%; }
}`} </style>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001a4d, #003087)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Memberships</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Manage plans and session counts</p>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{ background: card.bg, padding: '20px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' as const, fontWeight: '700', letterSpacing: '0.5px' }}>{card.label}</p>
              </div>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'white' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Members list */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={17} color="#003087" />
            <h3 style={{ margin: 0, color: '#1a1a2e', fontWeight: '800', fontSize: '16px' }}>All Memberships ({memberships.length})</h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Loading...</div>
          ) : memberships.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>No memberships yet.</div>
          ) : (
            memberships.map(membership => {
              const current = adjustments[membership.id] ?? membership.sessions_remaining
              const isDirty = current !== membership.sessions_remaining
              return (
                <div key={membership.id} className="membership-row" style={{ padding: '20px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a2e' }}>{membership.owners?.name}</span>
                      <span style={{ background: getPlanColor(membership.plan), color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const }}>{membership.plan}</span>
                      <span style={{ background: getStatusColor(membership.status), color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getStatusIcon(membership.status)} {membership.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} color="#ccc" /> {membership.owners?.email}
                        <Phone size={12} color="#ccc" style={{ marginLeft: '8px' }} /> {membership.owners?.phone}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PawPrint size={12} color="#ccc" /> {membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} color="#ccc" /> Renews {formatDate(membership.current_period_end)}
                      </p>
                    </div>
                  </div>

                  <div className="membership-sessions" style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ background: '#f0f4ff', padding: '14px 20px', borderRadius: '12px', marginBottom: '10px', border: '1.5px solid #d0d8ee' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase' as const }}>Sessions Left</p>
                      <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: current === 0 ? '#dc3545' : '#003087' }}>{current}</p>
                      <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#aaa' }}>of {membership.sessions_per_month}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleAdjust(membership.id, -1, membership.sessions_per_month)}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #e5e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={13} color="#666" />
                        </button>
                        <button onClick={() => handleAdjust(membership.id, 1, membership.sessions_per_month)}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #e5e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={13} color="#666" />
                        </button>
                      </div>
                    </div>
                    {isDirty && (
                      <button onClick={() => handleSave(membership)} disabled={saving[membership.id]}
                        style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Save size={13} /> {saving[membership.id] ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    {saved[membership.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#28a745', fontSize: '13px', fontWeight: '700' }}>
                        <CheckCircle size={13} /> Saved!
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