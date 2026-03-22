'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { trackEvent } from '../../components/Analytics'

const PLANS = [
  { key: 'starter', name: 'Standard', sessions: 4, price: 180, perSession: 45, description: 'Perfect for getting started' },
  { key: 'active', name: 'Pro', sessions: 8, price: 340, perSession: 42.50, description: 'Most popular for regular runners', popular: true },
  { key: 'athlete', name: 'Elite', sessions: 12, price: 480, perSession: 40, description: 'Maximum gains for serious dogs' }
]

export default function Membership() {
  const [ownerId, setOwnerId] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [dogs, setDogs] = useState<any[]>([])
  const [membershipsMap, setMembershipsMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState('')
  const [selectedDogId, setSelectedDogId] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [hasOtherActiveMembership, setHasOtherActiveMembership] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') { setSuccess(true); trackEvent('membership_purchased') }
    if (params.get('cancelled') === 'true') setCancelled(true)
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setOwnerEmail(user.email || '')
      const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
      if (ownerData) {
        setOwnerId(ownerData.id)
        const { data: dogsData } = await supabase.from('dogs').select('id, name, photo_url').eq('owner_id', ownerData.id).order('name')
        setDogs(dogsData || [])
        if (dogsData && dogsData.length > 0) setSelectedDogId(dogsData[0].id)
        const { data: membershipRows } = await supabase
          .from('memberships').select('*').eq('owner_id', ownerData.id)
          .in('status', ['active', 'cancelled']).gte('current_period_end', new Date().toISOString())
        const map: Record<string, any> = {}
        for (const m of membershipRows || []) map[m.dog_id] = m
        setMembershipsMap(map)
        // Check if owner has at least one active membership (for 2nd dog pricing)
        const activeMemberships = (membershipRows || []).filter((m: any) => m.status === 'active')
        setHasOtherActiveMembership(activeMemberships.length > 0)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCheckout = async (type: string, plan?: string) => {
    if (type === 'membership' && !selectedDogId) { alert('Please select a dog first.'); return }
    const key = type === 'alacarte' || type === 'alacarte2' ? type : `${plan}-${selectedDogId}`
    setCheckoutLoading(key)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, ownerEmail, type, plan, dogCount: 1, dogIds: type === 'membership' ? [selectedDogId] : [] })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setCheckoutLoading('')
  }

  const handleCancelMembership = async (dogId: string) => {
    const membership = membershipsMap[dogId]
    if (!membership) return
    const dogName = dogs.find(d => d.id === dogId)?.name || 'this dog'
    if (!confirm(`Cancel ${dogName}'s membership? It will remain active until the end of the billing period.`)) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/cancel-membership', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ subscriptionId: membership.stripe_subscription_id })
    })
    const data = await res.json()
    if (data.success) { setMembershipsMap(prev => ({ ...prev, [dogId]: { ...prev[dogId], status: 'cancelled' } })); setCancelSuccess(true) }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const selectedDog = dogs.find(d => d.id === selectedDogId)
  const selectedMembership = membershipsMap[selectedDogId]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: '64px', width: 'auto', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ width: '180px', height: '3px', background: '#f0f2f7', borderRadius: '2px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ height: '100%', background: '#f88124', borderRadius: '2px', animation: 'sweep 1.2s ease-in-out infinite' }} />
        </div>
        <style>{`
          @keyframes sweep {
            0% { width: 0%; marginLeft: 0%; }
            50% { width: 60%; }
            100% { width: 0%; marginLeft: 100%; }
          }
        `}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .plan-card:hover { transform: translateY(-2px); }
        .checkout-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        * { box-sizing: border-box; }
        @media (max-width: 520px) {
          .membership-card-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .membership-card-left { align-items: center !important; }
          .membership-card-left > div { justify-content: center !important; }
          .membership-card-right { align-items: center !important; width: 100% !important; }
        }
      `}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '960px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={18} color="#155724" /> Payment successful! Membership is now active.
          </div>
        )}
        {cancelSuccess && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px' }}>
            <XCircle size={18} color="#856404" /> Membership cancelled. Access continues until the end of the billing period.
          </div>
        )}
        {cancelled && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
            <AlertCircle size={18} color="#856404" /> Payment cancelled — no charge was made.
          </div>
        )}

        {/* Dog selector tabs — only shown when owner has multiple dogs */}
        {dogs.length > 1 && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Whose membership are you managing?</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {dogs.map(dog => {
                const isSelected = selectedDogId === dog.id
                const dogMembership = membershipsMap[dog.id]
                return (
                  <button key={dog.id} onClick={() => setSelectedDogId(dog.id)}
                    style={{ padding: '10px 18px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', backgroundColor: isSelected ? '#2c5a9e' : '#f0f2f7', color: isSelected ? 'white' : '#2c5a9e' }}>
                    {dog.photo_url
                      ? <img src={dog.photo_url} alt={dog.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : '#d8dff0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PawPrint size={12} color={isSelected ? 'white' : '#2c5a9e'} />
                        </div>
                    }
                    {dog.name}
                    {dogMembership?.status === 'active' && (
                      <span style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : '#d4edda', color: isSelected ? 'white' : '#155724', padding: '1px 7px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Active</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Active membership card for the selected dog */}
        {selectedMembership && selectedDog && (
          <div style={{ background: selectedMembership.status === 'cancelled' ? 'linear-gradient(135deg, #4a5568, #6c757d)' : 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 8px 32px rgba(0,48,135,0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.04, pointerEvents: 'none' }}><PawPrint size={220} color="white" /></div>
            <div className="membership-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexWrap: 'wrap', gap: '20px' }}>
              <div className="membership-card-left" style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                  {selectedDog.name}'s Plan
                  {selectedMembership.status === 'cancelled' && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.15)', padding: '1px 8px', borderRadius: '20px', fontSize: '10px' }}>Cancelled</span>}
                </p>
                <h2 style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
                  {{ starter: 'Standard', active: 'Pro', athlete: 'Elite' }[selectedMembership.plan] || selectedMembership.plan} Membership
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px' }}>
                    <PawPrint size={14} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{selectedMembership.sessions_per_month} sessions/month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px' }}>
                    <Calendar size={14} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                      {selectedMembership.status === 'cancelled' ? 'Access until' : 'Renews'} {formatDate(selectedMembership.current_period_end)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="membership-card-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', padding: '16px 28px', borderRadius: '16px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions Remaining</p>
                  <p style={{ margin: '0 0 2px', fontSize: '42px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{selectedMembership.sessions_remaining}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>of {selectedMembership.sessions_per_month} this month</p>
                </div>
                {selectedMembership.status === 'active' && (
                  <button onClick={() => handleCancelMembership(selectedDogId)}
                    style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={14} /> Cancel Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plan purchase cards — shown when dog has no plan or plan is cancelled */}
        {selectedDog && (!selectedMembership || selectedMembership.status === 'cancelled') && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '20px', fontWeight: '800' }}>
                {selectedMembership?.status === 'cancelled' ? `Reactivate ${selectedDog.name}'s Plan` : `Choose a Plan for ${selectedDog.name}`}
              </h2>
              <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Save per session vs a la carte. Cancel anytime.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {PLANS.map(plan => {
                const isLoading = checkoutLoading === `${plan.key}-${selectedDogId}`
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
                      <p style={{ color: '#888', margin: '0 0 12px', fontSize: '13px' }}>{plan.description}</p>
                      {hasOtherActiveMembership && !selectedMembership && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fff0ea', color: '#f88124', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '10px' }}>
                          🐾 2nd Dog Discount Applied
                        </div>
                      )}
                      <div style={{ marginBottom: '18px' }}>
                        {hasOtherActiveMembership && !selectedMembership ? (
                          <>
                            <span style={{ fontSize: '38px', fontWeight: '800', color: '#2c5a9e', letterSpacing: '-1px' }}>${{ starter: 144, active: 272, athlete: 384 }[plan.key]}</span>
                            <span style={{ color: '#aaa', fontSize: '14px', textDecoration: 'line-through', marginLeft: '6px' }}>${plan.price}</span>
                            <span style={{ color: '#aaa', fontSize: '14px' }}>/month</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '38px', fontWeight: '800', color: '#2c5a9e', letterSpacing: '-1px' }}>${plan.price}</span>
                            <span style={{ color: '#aaa', fontSize: '14px' }}>/month</span>
                          </>
                        )}
                      </div>
                      <div style={{ background: '#f0f2f7', padding: '14px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          `${plan.sessions} sessions/month`,
                          `$${plan.perSession}/session`,
                          `Save $${((55 - plan.perSession) * plan.sessions).toFixed(0)}/month vs a la carte`,
                        ].map((text, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: i === 2 ? '#28a745' : '#444', fontSize: '13px', fontWeight: i === 2 ? '700' : '600' }}>
                            <div style={{ width: '20px', height: '20px', background: '#d4edda', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <CheckCircle size={12} color="#28a745" />
                            </div>
                            {text}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => handleCheckout('membership', plan.key)} disabled={!!isLoading} className="checkout-btn"
                        style={{ width: '100%', padding: '13px', background: plan.popular ? 'linear-gradient(135deg, #f88124, #f9a04e)' : 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: plan.popular ? '0 4px 16px rgba(255,107,53,0.35)' : '0 4px 16px rgba(0,48,135,0.25)'
                        }}>
                        {isLoading ? 'Loading…' : `Get ${plan.name} for ${selectedDog.name} →`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

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
              { label: '1 Dog', price: '$55', type: 'alacarte' },
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