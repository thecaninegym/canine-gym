'use client'
import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function AddOwner() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('owners')
      .insert([{ name, email, phone }])

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setName('')
      setEmail('')
      setPhone('')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '24px' }}>Add New Owner</h2>
        {success && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>Owner added successfully!</div>}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
            </div>
            {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Add Owner'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}