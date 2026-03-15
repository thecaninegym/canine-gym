'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// Password must be 8+ chars, with uppercase, lowercase, number, and special character
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) return 'Password must include at least one special character (e.g. !@#$%).'
  return null
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e2e6ed' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#e2e6ed', '#e74c3c', '#f88124', '#f0c040', '#28a745']
  return { score, label: labels[score], color: colors[score] }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password)
  if (!password) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i <= score ? color : '#e2e6ed',
            transition: 'background 0.2s'
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color, fontWeight: '700' }}>{label}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
          {[
            { check: password.length >= 8, text: '8+ characters' },
            { check: /[A-Z]/.test(password), text: 'Uppercase' },
            { check: /[a-z]/.test(password), text: 'Lowercase' },
            { check: /[0-9]/.test(password), text: 'Number' },
            { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password), text: 'Special character' },
          ].map(({ check, text }) => (
            <span key={text} style={{ fontSize: '10px', color: check ? '#28a745' : '#bbb', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {check ? '✓' : '·'} {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
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

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', border: '1.5px solid #ddd',
    borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000',
    fontFamily: 'inherit', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2c5a9e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ maxWidth: '220px', width: '100%', height: 'auto' }} />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#2c5a9e', margin: '0 0 12px 0', fontWeight: '800' }}>Password Updated!</h2>
              <p style={{ color: '#666', marginBottom: '0' }}>Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <h2 style={{ color: '#2c5a9e', margin: '0 0 8px 0', fontWeight: '800' }}>Set New Password</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Choose a strong password for your account.</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#333', fontSize: '13px' }}>New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
                <PasswordStrengthBar password={password} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', color: '#333', fontSize: '13px' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#e74c3c', fontWeight: '600' }}>Passwords do not match.</p>
                )}
              </div>
              {error && <div style={{ background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#c53030', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: '#f88124', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
