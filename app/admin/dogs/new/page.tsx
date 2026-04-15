'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { PawPrint, ArrowLeft, CheckCircle } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

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
    supabase.from('owners').select('*').order('name').then(({ data }) => setOwners(data || []))
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
            <PawPrint size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Add New Dog</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Register a dog to the gym</p>
          </div>
        </div>

        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle size={18} /> Dog added successfully!
          </div>
        )}
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: '600' }}>{error}</div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Owner</label>
                <select value={ownerId} onChange={e => setOwnerId(e.target.value)} required style={{ ...inputStyle, background: 'white' }}>
                  <option value="">Select owner…</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Dog Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Breed</label>
                <input type="text" value={breed} onChange={e => setBreed(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Weight (lbs)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Birthday</label>
                <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City (Leaderboard)</label>
                <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inputStyle, background: 'white' }}>
                  <option value="">Select city…</option>
                  {['Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville', 'Pendleton', 'Indianapolis', 'Sheridan'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Adding…' : 'Add Dog'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}