'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Receipt, ArrowLeft, CreditCard, ExternalLink, RefreshCw } from 'lucide-react'

export default function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
      if (!ownerData) { setLoading(false); return }
      const res = await fetch(`/api/get-payments?owner_id=${ownerData.id}`)
      const data = await res.json()
      setPayments(data)
      setLoading(false)
    }
    init()
  }, [])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    membership:         { label: 'Membership',         color: '#2c5a9e', bg: '#eef2fb' },
    membership_renewal: { label: 'Membership Renewal', color: '#2c5a9e', bg: '#eef2fb' },
    alacarte:           { label: 'A La Carte',         color: '#f88124', bg: '#fff0ea' },
  }

  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '52px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 20px', maxWidth: '680px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 3px', fontSize: '22px', fontWeight: '800' }}>Payment History</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>All your charges and receipts</p>
          </div>
        </div>

        {/* Summary card */}
        {!loading && payments.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '16px', padding: '22px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Total Invested</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'white' }}>{formatAmount(totalSpent)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Transactions</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'white' }}>{payments.length}</p>
            </div>
          </div>
        )}

        {/* Payment list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1.5px solid #eef0f5', animation: 'shimmer 1.5s infinite' }}>
                <div style={{ height: '14px', background: '#f0f2f7', borderRadius: '4px', width: '40%', marginBottom: '10px' }} />
                <div style={{ height: '11px', background: '#f0f2f7', borderRadius: '4px', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '52px 24px', textAlign: 'center', border: '1.5px solid #eef0f5' }}>
            <div style={{ width: '60px', height: '60px', background: '#f0f2f7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CreditCard size={28} color="#ccc" />
            </div>
            <p style={{ color: '#1a1a2e', fontWeight: '800', fontSize: '16px', margin: '0 0 6px' }}>No payments yet</p>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 20px' }}>Your payment history will appear here once you make a purchase.</p>
            <a href="/membership" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              <CreditCard size={15} /> View Membership Plans
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.map(payment => {
              const config = typeConfig[payment.type] || { label: payment.type, color: '#888', bg: '#f0f2f7' }
              return (
                <div key={payment.id} style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1.5px solid #eef0f5', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', background: config.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={18} color={config.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '14px' }}>
                        {payment.description || config.label}
                      </span>
                      <span style={{ background: config.bg, color: config.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                        {config.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>{formatDate(payment.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#1a1a2e', fontSize: '16px' }}>{formatAmount(payment.amount)}</p>
                    {payment.receipt_url ? (
                      <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#2c5a9e', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        Receipt <ExternalLink size={11} />
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontSize: '12px', color: '#ddd' }}>No receipt</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && payments.length > 0 && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: '12px', marginTop: '20px' }}>
            Questions about a charge? Email us at <a href="mailto:info@thecaninegym.com" style={{ color: '#2c5a9e', fontWeight: '700' }}>info@thecaninegym.com</a>
          </p>
        )}

      </div>
    </div>
  )
}