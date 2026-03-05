'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = data.user.email === 'dev@thecaninegym.com' ? '/admin' : '/dashboard'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#003087', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>The Canine Gym</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#333', fontWeight: '500' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#333', fontWeight: '500' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000000' }} />
          </div>
          {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}