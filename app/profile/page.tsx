'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, User, CheckCircle } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

export default function Profile() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [gymTag, setGymTag] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [smsConsent, setSmsConsent] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('*').eq('email', user.email).single()
      if (ownerData) {
        setOwnerId(ownerData.id)
        setName(ownerData.name || '')
        setPhone(ownerData.phone || '')
        setAddress(ownerData.address || '')
        setCity(ownerData.city || '')
        setZip(ownerData.zip || '')
        setGymTag(ownerData.gym_tag || '')
        setSmsConsent(ownerData.sms_consent || false)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('owners').update({ name, phone, address, city, zip, gym_tag: gymTag.toLowerCase().replace(/[^a-z0-9_]/g, '') || null, sms_consent: smsConsent }).eq('id', ownerId)
    const { data: dogData } = await supabase.from('dogs').select('id').eq('owner_id', ownerId)
    if (dogData && dogData.length > 0) {
      await supabase.from('leaderboard_settings').update({ city }).in('dog_id', dogData.map((d: any) => d.id))
    }
    if (error) { setError(error.message); setSaving(false) } else { setSuccess(true); setTimeout(() => { window.location.href = '/dashboard' }, 1000) }
  }

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
        input:focus, select:focus { border-color: #2c5a9e !important; box-shadow: 0 0 0 3px rgba(0,48,135,0.08); }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>My Profile</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Update your personal information</p>
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '13px 18px', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={17} /> Saved successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#ffeaea', color: '#dc3545', padding: '13px 18px', borderRadius: '12px', marginBottom: '18px', fontSize: '14px', fontWeight: '600' }}>{error}</div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1.5px solid #f0f2f7' }}>
            <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={17} color="#2c5a9e" />
            </div>
            <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Personal Details</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="Jane Smith" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="(317) 555-0123" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ background: '#f8f9ff', border: '1.5px solid #e5e8f0', borderRadius: '12px', padding: '16px 18px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={e => setSmsConsent(e.target.checked)}
                      style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#f88124', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', fontWeight: '500' }}>
                      I agree to receive text messages from The Canine Gym including booking confirmations, session reminders, and account notifications. Message & data rates may apply.{' '}
                      <strong style={{ color: '#001840' }}>Reply STOP at any time to opt out.</strong>
                    </span>
                  </label>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Gym Tag <span style={{ color: '#aaa', fontWeight: '400' }}>— your unique handle for friends to find you</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#f88124', fontWeight: '800', fontSize: '14px' }}>@</span>
                  <input type="text" value={gymTag} onChange={e => setGymTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={{ ...inputStyle, paddingLeft: '28px' }} placeholder="e.g. gravysmom" />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Street Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} placeholder="123 Main St" />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                  <option value="">Select a city…</option>
                  {['Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Zip Code</label>
                <input type="text" value={zip} onChange={e => setZip(e.target.value)} style={inputStyle} placeholder="46032" />
              </div>
            </div>

            <button type="submit" disabled={saving}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,48,135,0.25)', marginTop: '8px' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}