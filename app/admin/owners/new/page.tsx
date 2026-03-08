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
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('owners').insert([{ name, email, phone, address, city, zip }])
    if (error) { setError(error.message); setLoading(false); return }
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'welcome', to: email, data: { ownerName: name, dogName: 'your dog' } }) })
    setSuccess(true)
    setName(''); setEmail(''); setPhone(''); setAddress(''); setCity(''); setZip('')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>
      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PawPrint size={20} color="#FF6B35" /></div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>The Canine Gym <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>· Admin</span></span>
        </div>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001a4d, #003087)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Adding…' : 'Add Owner'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}