'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { PawPrint, ArrowLeft, CheckCircle } from 'lucide-react'

export default function AddDog() {
  const [owners, setOwners] = useState<any[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState('')
  const [birthday, setBirthday] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase.from('owners').select('*').order('name')
      setOwners(data || [])
    }
    fetchOwners()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: dogData, error: dogError } = await supabase.from('dogs').insert([{ owner_id: ownerId, name, breed, weight: weight || null, birthday: birthday || null }]).select()
    if (dogError) { setError(dogError.message); setLoading(false); return }
    await supabase.from('leaderboard_settings').insert([{ dog_id: dogData[0].id, visibility: 'anonymous', display_name: name, city }])
    setSuccess(true)
    setOwnerId(''); setName(''); setBreed(''); setWeight(''); setBirthday(''); setCity('')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <PawPrint size={28} color="#003087" />
          <h2 style={{ color: '#003087', margin: 0 }}>Add New Dog</h2>
        </div>
        {success && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#155724" /> Dog added successfully!
          </div>
        )}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Dog Name', value: name, onChange: setName, type: 'text', required: true },
              { label: 'Breed', value: breed, onChange: setBreed, type: 'text' },
              { label: 'Weight (lbs)', value: weight, onChange: setWeight, type: 'number' },
              { label: 'Birthday', value: birthday, onChange: setBirthday, type: 'date' },
            ].map(({ label, value, onChange, type, required }) => (
              <div key={label} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Owner</label>
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }}>
                <option value="">Select an owner...</option>
                {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }}>
                <option value="">Select a city...</option>
                {['Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Add Dog'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}