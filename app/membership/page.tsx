'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const PLANS = [
  { key: 'starter', name: 'Starter', sessions: 4, price1: 180, price2: 324, perSession1: 45, perSession2: 40.50, color: '#003087', description: 'Perfect for getting started' },
  { key: 'active', name: 'Active', sessions: 8, price1: 340, price2: 612, perSession1: 42.50, perSession2: 38.25, color: '#FF6B35', description: 'Most popular for regular runners', popular: true },
  { key: 'athlete', name: 'Athlete', sessions: 12, price1: 480, price2: 864, perSession1: 40, perSession2: 36, color: '#003087', description: 'Maximum gains for serious dogs' }
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
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') setSuccess(true)
    if (params.get('cancelled') === 'true') setCancelled(true)

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setOwnerEmail(user.email || '')

      const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
      if (ownerData) {
        setOwnerId(ownerData.id)
        const { data: dogsData } = await supabase.from('dogs').select('id, name').eq('owner_id', ownerData.id)
        setDogs(dogsData || [])
        if (dogsData && dogsData.length >= 2) setDogCount(2)
        const { data: membershipData } = await supabase.from('memberships').select('*').eq('owner_id', ownerData.id).eq('status', 'active').single()
        setMembership(membershipData)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCheckout = async (type: string, plan?: string) => {
    if (type === 'membership' && selectedDogIds.length === 0) {
      alert('Please select at least one dog for this membership.')
      return
    }
    const key = type === 'alacarte' ? 'alacarte' : `${plan}-${dogCount}`
    setCheckoutLoading(key)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, ownerEmail, type, plan, dogCount: selectedDogIds.length || dogCount, dogIds: selectedDogIds })
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
    if (data.success) setMembership({ ...membership, status: 'cancelled' })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym</h1>
        </div>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>

        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <CheckCircle size={20} color="#155724" /> Payment successful! Your membership is now active.
          </div>
        )}

        {cancelled && (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={20} color="#856404" /> Payment cancelled. No charge was made.
          </div>
        )}

        {membership && (
          <div style={{ backgroundColor: '#003087', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', opacity: 0.7, textTransform: 'uppercase', fontWeight: 'bold' }}>Current Plan</p>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>{membership.plan.charAt(0).toUpperCase() + membership.plan.slice(1)} Membership</h2>
                <p style={{ margin: '0 0 4px 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PawPrint size={14} /> {membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month
                </p>
                <p style={{ margin: 0, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Renews {formatDate(membership.current_period_end)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '12px', marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', opacity: 0.8 }}>Sessions Remaining</p>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>{membership.sessions_remaining}</p>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>of {membership.sessions_per_month} this month</p>
                </div>
                <button onClick={handleCancelMembership}
                  style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={14} /> Cancel Membership
                </button>
              </div>
            </div>
          </div>
        )}

        <h2 style={{ color: '#003087', marginBottom: '8px' }}>{membership ? 'Upgrade Your Plan' : 'Choose a Membership'}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Save per session vs a la carte. Cancel anytime.</p>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>Which dog(s) is this membership for?</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {dogs.map(dog => {
              const isSelected = selectedDogIds.includes(dog.id)
              return (
                <button key={dog.id} onClick={() => {
                  if (isSelected) {
                    setSelectedDogIds(selectedDogIds.filter(id => id !== dog.id))
                    setDogCount(selectedDogIds.length - 1)
                  } else {
                    setSelectedDogIds([...selectedDogIds, dog.id])
                    setDogCount(selectedDogIds.length + 1)
                  }
                }}
                  style={{ padding: '10px 24px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', fontWeight: 'bold', borderColor: isSelected ? '#003087' : '#ddd', backgroundColor: isSelected ? '#003087' : 'white', color: isSelected ? 'white' : '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PawPrint size={16} /> {dog.name}
                </button>
              )
            })}
          </div>
          {selectedDogIds.length === 0 && (
            <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={13} /> Please select at least one dog
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {PLANS.map(plan => {
            const price = dogCount === 2 ? plan.price2 : plan.price1
            const perSession = dogCount === 2 ? plan.perSession2 : plan.perSession1
            const isLoading = checkoutLoading === `${plan.key}-${dogCount}`
            const isCurrent = membership?.plan === plan.key && membership?.dog_count === dogCount

            return (
              <div key={plan.key} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: plan.popular ? '0 4px 20px rgba(255,107,53,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', border: plan.popular ? '2px solid #FF6B35' : '2px solid transparent' }}>
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
                    {[
                      `${plan.sessions} sessions/month${dogCount === 2 ? ` per dog (${plan.sessions * 2} total)` : ''}`,
                      `$${perSession}/session${dogCount === 2 ? ' per dog' : ''}`,
                    ].map((text, i) => (
                      <p key={i} style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={14} color="#28a745" /> {text}
                      </p>
                    ))}
                    <p style={{ margin: 0, color: '#28a745', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} color="#28a745" /> Save ${dogCount === 2 ? ((90 - perSession * 2) * plan.sessions).toFixed(0) : ((50 - perSession) * plan.sessions).toFixed(0)}/month vs a la carte
                    </p>
                  </div>
                  {isCurrent ? (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle size={16} color="#155724" /> Current Plan
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

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CreditCard size={20} color="#003087" />
            <h3 style={{ color: '#003087', margin: 0 }}>A La Carte Sessions</h3>
          </div>
          <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: '14px' }}>No commitment. Pay per session.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: '1 Dog', price: '$50', type: 'alacarte' },
              { label: '2 Dogs', price: '$90', type: 'alacarte2' },
            ].map(({ label, price, type }) => (
              <div key={type} style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <PawPrint size={16} color="#003087" /> {label}
                </p>
                <p style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 'bold', color: '#003087' }}>{price}</p>
                <button onClick={() => handleCheckout(type, undefined)} disabled={checkoutLoading === type}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {checkoutLoading === type ? 'Loading...' : 'Book & Pay →'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}