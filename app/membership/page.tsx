'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react'

const PLANS = [
  { key: 'starter', name: 'Starter', sessions: 4, price1: 180, price2: 324, priceAdd: 144, perSession1: 45, perSession2: 40.50, description: 'Perfect for getting started' },
  { key: 'active', name: 'Active', sessions: 8, price1: 340, price2: 612, priceAdd: 272, perSession1: 42.50, perSession2: 38.25, description: 'Most popular for regular runners', popular: true },
  { key: 'athlete', name: 'Athlete', sessions: 12, price1: 480, price2: 864, priceAdd: 384, perSession1: 40, perSession2: 36, description: 'Maximum gains for serious dogs' }
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
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([])

  const effectiveDogCount = membership
    ? Math.min(2, (membership.dog_count || 1) + selectedDogIds.length)
    : selectedDogIds.length || dogCount

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
        const { data: dogsData } = await supabase.from('dogs').select('id, name, photo_url').eq('owner_id', ownerData.id)
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
    const isAddon = !!membership && effectiveDogCount === 2
    const key = type === 'alacarte' || type === 'alacarte2' ? type : `${plan}-${dogCount}`
    setCheckoutLoading(key)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, ownerEmail, type, plan, dogCount: effectiveDogCount, dogIds: selectedDogIds, isAddon })
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
      setCancelSuccess(true)
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#f88124', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .plan-card:hover { transform: translateY(-2px); }
        .dog-btn:hover { transform: translateY(-1px); }
        .checkout-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Alerts */}
        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={18} color="#155724" /> Payment successful! Your membership is now active.
          </div>
        )}
        {cancelSuccess && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px' }}>
            <XCircle size={18} color="#856404" /> Membership cancelled. Access continues until the end of your billing period.
          </div>
        )}
        {cancelled && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
            <AlertCircle size={18} color="#856404" /> Payment cancelled — no charge was made.
          </div>
        )}

        {/* Active Membership Card */}
        {membership && (
          <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 8px 32px rgba(0,48,135,0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.04, pointerEvents: 'none' }}>
              <PawPrint size={220} color="white" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Current Plan</p>
                <h2 style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
                  {membership.plan.charAt(0).toUpperCase() + membership.plan.slice(1)} Membership
                </h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px' }}>
                    <PawPrint size={14} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{membership.dog_count} dog{membership.dog_count > 1 ? 's' : ''} · {membership.sessions_per_month} sessions/month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px' }}>
                    <Calendar size={14} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Renews {formatDate(membership.current_period_end)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', padding: '16px 28px', borderRadius: '16px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions Remaining</p>
                  <p style={{ margin: '0 0 2px', fontSize: '42px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{membership.sessions_remaining}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>of {membership.sessions_per_month} this month</p>
                </div>
                <button onClick={handleCancelMembership}
                  style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <XCircle size={14} /> Cancel Membership
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dog Selector */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#1a1a2e', fontSize: '16px' }}>Which dog(s) is this membership for?</p>
          <p style={{ margin: '0 0 16px', color: '#888', fontSize: '13px' }}>Select the dog(s) you'd like to cover with a membership plan.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {dogs.map(dog => {
              const isSelected = selectedDogIds.includes(dog.id)
              return (
                <button key={dog.id} className="dog-btn" onClick={() => {
                  if (isSelected) {
                    setSelectedDogIds(selectedDogIds.filter(id => id !== dog.id))
                    setDogCount(Math.max(1, selectedDogIds.length - 1))
                  } else {
                    setSelectedDogIds([...selectedDogIds, dog.id])
                    setDogCount(selectedDogIds.length + 1)
                  }
                }}
                  style={{ padding: '10px 18px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                    backgroundColor: isSelected ? '#2c5a9e' : '#f0f2f7',
                    color: isSelected ? 'white' : '#2c5a9e',
                  }}>
                  {dog.photo_url
                    ? <img src={dog.photo_url} alt={dog.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : '#d8dff0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PawPrint size={13} color={isSelected ? 'white' : '#2c5a9e'} />
                      </div>
                  }
                  {dog.name}
                </button>
              )
            })}
          </div>
          {membership && selectedDogIds.length > 0 && (
            <p style={{ color: '#2c5a9e', fontSize: '13px', marginTop: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={13} color="#2c5a9e" /> 2-dog pricing applied — you already have an active membership
            </p>
          )}
          {selectedDogIds.length === 0 && (
            <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px', margin: '12px 0 0' }}>
              <AlertCircle size={13} /> Please select at least one dog to see pricing
            </p>
          )}
        </div>

        {/* Section Header */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '20px', fontWeight: '800' }}>
            {membership ? 'Upgrade Your Plan' : 'Choose a Membership'}
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Save per session vs a la carte. Cancel anytime.</p>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {PLANS.map(plan => {
            const price = membership && effectiveDogCount === 2 ? plan.priceAdd : effectiveDogCount === 2 ? plan.price2 : plan.price1
            const perSession = effectiveDogCount === 2 ? plan.perSession2 : plan.perSession1
            const isLoading = checkoutLoading === `${plan.key}-${effectiveDogCount}`
            const isCurrent = membership?.plan === plan.key && membership?.dog_count === dogCount
              && selectedDogIds.length > 0 && selectedDogIds.every(id => (membership?.dog_ids || []).includes(id))

            return (
              <div key={plan.key} className="plan-card"
                style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s',
                  border: plan.popular ? '2px solid #f88124' : '2px solid transparent',
                  boxShadow: plan.popular ? '0 8px 28px rgba(255,107,53,0.2)' : '0 2px 12px rgba(0,0,0,0.06)'
                }}>
                {plan.popular && (
                  <div style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', textAlign: 'center', padding: '7px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ padding: '24px' }}>
                  <h3 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>{plan.name}</h3>
                  <p style={{ color: '#888', margin: '0 0 18px', fontSize: '13px' }}>{plan.description}</p>
                  <div style={{ marginBottom: '18px' }}>
                    <span style={{ fontSize: '38px', fontWeight: '800', color: '#2c5a9e', letterSpacing: '-1px' }}>${price}</span>
                    <span style={{ color: '#aaa', fontSize: '14px' }}>/month</span>
                    {membership && effectiveDogCount === 2 && (
                      <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0', fontWeight: '600' }}>Additional dog added to your existing membership</p>
                    )}
                  </div>
                  <div style={{ background: '#f0f2f7', padding: '14px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      `${plan.sessions} sessions/month${effectiveDogCount === 2 ? ` per dog (${plan.sessions * 2} total)` : ''}`,
                      `$${perSession}/session${effectiveDogCount === 2 ? ' per dog' : ''}`,
                    ].map((text, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '13px', fontWeight: '600' }}>
                        <div style={{ width: '20px', height: '20px', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle size={12} color="#28a745" />
                        </div>
                        {text}
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#28a745', fontSize: '13px', fontWeight: '700' }}>
                      <div style={{ width: '20px', height: '20px', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={12} color="#28a745" />
                      </div>
                      Save ${effectiveDogCount === 2 ? ((90 - perSession * 2) * plan.sessions).toFixed(0) : ((50 - perSession) * plan.sessions).toFixed(0)}/month vs a la carte
                    </div>
                  </div>
                  {isCurrent ? (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '13px', borderRadius: '12px', textAlign: 'center', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                      <CheckCircle size={16} color="#155724" /> Current Plan
                    </div>
                  ) : (
                    <button onClick={() => handleCheckout('membership', plan.key)} disabled={!!isLoading} className="checkout-btn"
                      style={{ width: '100%', padding: '13px', background: plan.popular ? 'linear-gradient(135deg, #f88124, #f9a04e)' : 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: plan.popular ? '0 4px 16px rgba(255,107,53,0.35)' : '0 4px 16px rgba(0,48,135,0.25)'
                      }}>
                      {isLoading ? 'Loading…' : `Get ${plan.name} →`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* A La Carte */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={17} color="#2c5a9e" />
            </div>
            <h3 style={{ color: '#1a1a2e', margin: 0, fontSize: '16px', fontWeight: '700' }}>A La Carte Sessions</h3>
          </div>
          <p style={{ color: '#888', margin: '0 0 20px 56px', fontSize: '13px' }}>No commitment. Pay per session.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { label: '1 Dog', price: '$50', type: 'alacarte' },
              { label: '2 Dogs', price: '$90', type: 'alacarte2' },
            ].map(({ label, price, type }) => (
              <div key={type} style={{ background: '#f0f2f7', padding: '22px', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  <PawPrint size={15} color="#2c5a9e" />
                  <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{label}</span>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: '34px', fontWeight: '800', color: '#2c5a9e', letterSpacing: '-1px' }}>{price}</p>
                <button onClick={() => handleCheckout(type)} disabled={checkoutLoading === type} className="checkout-btn"
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,48,135,0.25)' }}>
                  {checkoutLoading === type ? 'Loading…' : 'Book & Pay →'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}