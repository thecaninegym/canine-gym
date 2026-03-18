'use client'
import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { PawPrint, ArrowLeft, Users, CheckCircle } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

export default function AddOwner() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('owners').insert([{ name, email, phone, address, city, zip, sms_consent: smsConsent }])
    if (error) { setError(error.message); setLoading(false); return }
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'welcome', to: email, data: { ownerName: name, dogName: 'your dog' } }) })
    setSuccess(true)
    setName(''); setEmail(''); setPhone(''); setAddress(''); setCity(''); setZip(''); setSmsConsent(false)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Add New Owner</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Create a new client account</p>
          </div>
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle size={18} /> Owner added successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Full Name', value: name, onChange: setName, type: 'text', required: true, col: '1 / -1' },
                { label: 'Email', value: email, onChange: setEmail, type: 'email', required: true, col: '1 / -1' },
                { label: 'Phone', value: phone, onChange: setPhone, type: 'tel', col: '1 / -1' },
                { label: 'Street Address', value: address, onChange: setAddress, type: 'text', col: '1 / -1' },
                { label: 'City', value: city, onChange: setCity, type: 'text', col: undefined },
                { label: 'Zip Code', value: zip, onChange: setZip, type: 'text', col: undefined },
              ].map(({ label, value, onChange, type, required, col }) => (
                <div key={label} style={{ gridColumn: col }}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} style={inputStyle} />
                </div>
              ))}
            </div>
            {/* SMS Consent */}
            <div style={{ marginTop: '16px', background: '#fff8e6', border: '1.5px solid #ffc107', borderRadius: '12px', padding: '16px 18px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#856404' }}>⚠️ SMS Consent — Admin Note</p>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#856404', lineHeight: '1.6' }}>
                Before checking this box, you must have verbally confirmed with the client that they agree to receive text messages from The Canine Gym for booking confirmations, reminders, and account notifications.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={e => setSmsConsent(e.target.checked)}
                  style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#f88124', flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#856404', fontWeight: '600', lineHeight: '1.6' }}>
                  Client has verbally confirmed SMS consent
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Adding…' : 'Add Owner'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}