'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Supabase handles the token from the URL automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode, ready to update
      }
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => { window.location.href = '/' }, 3000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2c5a9e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0' }}>The Canine Gym</h1>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#2c5a9e', margin: '0 0 12px 0' }}>Password Updated!</h2>
              <p style={{ color: '#666', marginBottom: '0' }}>Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <h2 style={{ color: '#2c5a9e', margin: '0 0 8px 0' }}>Set New Password</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Choose a new password for your account.</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
              </div>
              {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: '#f88124', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}