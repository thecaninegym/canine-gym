'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { PawPrint, ArrowLeft, CheckCircle, User } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' as const, color: '#1a1a2e', fontFamily: 'inherit', outline: 'none' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700' as const, color: '#555', fontSize: '13px' }

export default function EditOwner() {
  const params = useParams()
  const id = params.id as string
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOwner = async () => {
      const { data } = await supabase.from('owners').select('*').eq('id', id).single()
      if (data) { setName(data.name || ''); setEmail(data.email || ''); setPhone(data.phone || ''); setAddress(data.address || ''); setCity(data.city || ''); setZip(data.zip || '') }
      setLoading(false)
    }
    if (id) fetchOwner()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('owners').update({ name, email, phone, address, city, zip }).eq('id', id)
    const { data: dogData } = await supabase.from('dogs').select('id').eq('owner_id', id)
    if (dogData && dogData.length > 0) {
      await supabase.from('leaderboard_settings').update({ city }).in('dog_id', dogData.map((d: any) => d.id))
    }
    if (error) { setError(error.message) } else { setSuccess(true) }
    setSaving(false)
  }

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
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin/owners" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> All Owners
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Edit Owner</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Update contact and location info</p>
          </div>
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
            <CheckCircle size={17} color="#155724" /> Saved successfully!
          </div>
        )}

        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', value: name, onChange: setName, type: 'text', required: true },
              { label: 'Email', value: email, onChange: setEmail, type: 'email', required: true },
              { label: 'Phone', value: phone, onChange: setPhone, type: 'tel' },
              { label: 'Street Address', value: address, onChange: setAddress, type: 'text', placeholder: '123 Main St' },
              { label: 'Zip Code', value: zip, onChange: setZip, type: 'text', placeholder: '46032' },
            ].map(({ label, value, onChange, type, required, placeholder }) => (
              <div key={label} style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>{label}{required && <span style={{ color: '#f88124', marginLeft: '3px' }}>*</span>}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
                  style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select a city...</option>
                {['Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={saving}
              style={{ width: '100%', padding: '13px', background: saving ? '#ccc' : 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(255,107,53,0.35)', transition: 'all 0.2s' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}