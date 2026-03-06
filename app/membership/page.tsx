'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    sessions: 4,
    price1: 180,
    price2: 324,
    perSession1: 45,
    perSession2: 40.50,
    color: '#003087',
    description: 'Perfect for getting started'
  },
  {
    key: 'active',
    name: 'Active',
    sessions: 8,
    price1: 340,
    price2: 612,
    perSession1: 42.50,
    perSession2: 38.25,
    color: '#FF6B35',
    description: 'Most popular for regular runners',
    popular: true
  },
  {
    key: 'athlete',
    name: 'Athlete',
    sessions: 12,
    price1: 480,
    price2: 864,
    perSession1: 40,
    perSession2: 36,
    color: '#003087',
    description: 'Maximum gains for serious dogs'
  }
]

export default function Membership() {
  const [ownerId, setOwnerId] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [dogs, setDogs] = useState<any[]>([])
  const [membership, setMembership] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState('')
  const [dogCount, setDogCount] = useState(1)
  const [success, setSuccess] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') setSuccess(true)
    if (params.get('cancelled') === 'true') setCancelled(true)

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      setOwnerEmail(user.email || '')

      const { data: ownerData } = await supabase
        .from('owners')
        .select('id')
        .eq('email', user.email)
        .single()

      if (ownerData) {
        setOwnerId(ownerData.id)

        const { data: dogsData } = await supabase
          .from('dogs')
          .select('id, name')
          .eq('owner_id', ownerData.id)
        setDogs(dogsData || [])
        if (dogsData && dogsData.length >= 2) setDogCount(2)

        const { data: membershipData } = await supabase
          .from('memberships')
          .select('*')
          .eq('owner_id', ownerData.id)
          .eq('status', 'active')
          .single()
        setMembership(membershipData)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCheckout = async (type: string, plan?: string) => {
    const key = type === 'alacarte' ? 'alacarte' : `${plan}-${dogCount}`
    setCheckoutLoading(key)

    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, ownerEmail, type, plan, dogCount })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setCheckoutLoading('')
  }

  const handleCancelMembership = async () => {
    if (!confirm('Are you sure you want to cancel your membership? It will remain active until the end of your billing period.')) return

    const res = await fetch('/api/cancel-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: membership.stripe_subscription_id })
    })
    const data = await res.json()
    if (data.success) {
      setMembership({ ...membership, status: 'cancelled' })
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>

        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>
            🎉 Payment successful! Your membership is now active.
          </div>
        )}

        {cancelled && (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
            Payment cancelled. No charge was made.
          </div>
        )}

        {/* Current membership */}
        {membership && (
          <div style={{ backgroundColor: '#003087', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', opacity: 0.7, textTransform: 'uppercase', fontWeight: 'bold' }}>Current Plan</p>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>{membership.plan.charAt(0).toUpperCase() + membership.plan.slice(1)} Membership</h2>
                <p style={{ margin: '0 0 4px 0', opacity: 0.9 }}>🐾 {membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month</p>
                <p style={{ margin: 0, opacity: 0.9 }}>📅 Renews {formatDate(membership.current_period_end)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '12px', marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', opacity: 0.8 }}>Sessions Remaining</p>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>{membership.sessions_remaining}</p>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>of {membership.sessions_per_month} this month</p>
                </div>
                <button onClick={handleCancelMembership}
                  style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel Membership
                </button>
              </div>
            </div>
          </div>
        )}

        <h2 style={{ color: '#003087', marginBottom: '8px' }}>{membership ? 'Upgrade Your Plan' : 'Choose a Membership'}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Save per session vs a la carte. Cancel anytime.</p>

        {/* Dog count toggle — only show if they have 2+ dogs */}
        {dogs.length >= 2 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button onClick={() => setDogCount(1)}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', borderColor: dogCount === 1 ? '#003087' : '#ddd', backgroundColor: dogCount === 1 ? '#003087' : 'white', color: dogCount === 1 ? 'white' : '#333' }}>
              1 Dog
            </button>
            <button onClick={() => setDogCount(2)}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', borderColor: dogCount === 2 ? '#003087' : '#ddd', backgroundColor: dogCount === 2 ? '#003087' : 'white', color: dogCount === 2 ? 'white' : '#333' }}>
              2 Dogs
            </button>
          </div>
        )}

        {/* Membership plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {PLANS.map(plan => {
            const price = dogCount === 2 ? plan.price2 : plan.price1
            const perSession = dogCount === 2 ? plan.perSession2 : plan.perSession1
            const isLoading = checkoutLoading === `${plan.key}-${dogCount}`
            const isCurrent = membership?.plan === plan.key && membership?.dog_count === dogCount

            return (
              <div key={plan.key} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: plan.popular ? '0 4px 20px rgba(255,107,53,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', border: plan.popular ? '2px solid #FF6B35' : '2px solid transparent', position: 'relative' }}>
                {plan.popular && (
                  <div style={{ backgroundColor: '#FF6B35', color: 'white', textAlign: 'center', padding: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ padding: '24px' }}>
                  <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '22px' }}>{plan.name}</h3>
                  <p style={{ color: '#666', margin: '0 0 16px 0', fontSize: '14px' }}>{plan.description}</p>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#003087' }}>${price}</span>
                    <span style={{ color: '#666', fontSize: '14px' }}>/month</span>
                  </div>
                  <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px' }}>✅ {plan.sessions} sessions/month{dogCount === 2 ? ` per dog (${plan.sessions * 2} total)` : ''}</p>
                    <p style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px' }}>✅ ${perSession}/session{dogCount === 2 ? ' per dog' : ''}</p>
                    <p style={{ margin: 0, color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>✅ Save ${dogCount === 2 ? ((90 - perSession * 2) * plan.sessions).toFixed(0) : ((50 - perSession) * plan.sessions).toFixed(0)}/month vs a la carte</p>
                  </div>
                  {isCurrent ? (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      ✅ Current Plan
                    </div>
                  ) : (
                    <button onClick={() => handleCheckout('membership', plan.key)} disabled={!!isLoading}
                      style={{ width: '100%', padding: '12px', backgroundColor: plan.popular ? '#FF6B35' : '#003087', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
                      {isLoading ? 'Loading...' : `Get ${plan.name} →`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* A la carte */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ color: '#003087', margin: '0 0 8px 0' }}>A La Carte Sessions</h3>
          <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: '14px' }}>No commitment. Pay per session.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>1 Dog</p>
              <p style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 'bold', color: '#003087' }}>$50</p>
              <button onClick={() => handleCheckout('alacarte', undefined)} disabled={checkoutLoading === 'alacarte'}
                style={{ width: '100%', padding: '10px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {checkoutLoading === 'alacarte' ? 'Loading...' : 'Book & Pay →'}
              </button>
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>2 Dogs</p>
              <p style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 'bold', color: '#003087' }}>$90</p>
              <button onClick={() => handleCheckout('alacarte2', undefined)} disabled={checkoutLoading === 'alacarte2'}
                style={{ width: '100%', padding: '10px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {checkoutLoading === 'alacarte2' ? 'Loading...' : 'Book & Pay →'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}