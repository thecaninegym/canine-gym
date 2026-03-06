'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { PawPrint, ArrowLeft, CheckCircle } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <a href="/admin/owners" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Owners
        </a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>Edit Owner</h2>
        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#155724" /> Saved successfully!
          </div>
        )}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', value: name, onChange: setName, type: 'text', required: true },
              { label: 'Email', value: email, onChange: setEmail, type: 'email', required: true },
              { label: 'Phone', value: phone, onChange: setPhone, type: 'tel' },
              { label: 'Street Address', value: address, onChange: setAddress, type: 'text', placeholder: '123 Main St' },
              { label: 'Zip Code', value: zip, onChange: setZip, type: 'text', placeholder: '46032' },
            ].map(({ label, value, onChange, type, required, placeholder }) => (
              <div key={label} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
              </div>
            ))}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }}>
                <option value="">Select a city...</option>
                {['Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            <button type="submit" disabled={saving}
              style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}