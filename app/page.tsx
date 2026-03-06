'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    if (data.user?.email === 'dev@thecaninegym.com') {
      window.location.href = '/admin'
    } else {
      window.location.href = '/dashboard'
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
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

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    const fullName = `${firstName} ${lastName}`.trim()
    await supabase.from('owners').insert([{ name: fullName, email, phone }])

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        to: email,
        data: { ownerName: firstName, dogName: 'your dog' }
      })
    })

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        to: 'dev@thecaninegym.com',
        data: {
          action: '🎉 New Client Signed Up',
          dogName: 'Not yet added',
          ownerName: `${firstName} ${lastName}`,
          date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: email
        }
      })
    })

    setSignupSuccess(true)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.thecaninegym.com/update-password'
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setResetSent(true)
    setLoading(false)
  }

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode)
    setError(null)
    setResetSent(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0' }}>The Canine Gym</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>The run comes to you.</p>
        </div>

        {signupSuccess ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#003087', margin: '0 0 12px 0' }}>Welcome to the pack!</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>Your account has been created. Check your email to confirm your address, then log in to get started.</p>
            <button onClick={() => { setMode('login'); setSignupSuccess(false) }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px' }}>

            {/* Mode toggle — only show for login and signup */}
            {mode !== 'reset' && (
              <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '4px' }}>
                <button onClick={() => switchMode('login')}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', backgroundColor: mode === 'login' ? '#003087' : 'transparent', color: mode === 'login' ? 'white' : '#666' }}>
                  Log In
                </button>
                <button onClick={() => switchMode('signup')}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', backgroundColor: mode === 'signup' ? '#003087' : 'transparent', color: mode === 'signup' ? 'white' : '#666' }}>
                  Sign Up
                </button>
              </div>
            )}

            {/* Login form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                  <button type="button" onClick={() => switchMode('reset')}
                    style={{ background: 'none', border: 'none', color: '#FF6B35', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                    Forgot your password?
                  </button>
                </div>
                {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            )}

            {/* Signup form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Reset form */}
            {mode === 'reset' && (
              resetSent ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                  <h3 style={{ color: '#003087', margin: '0 0 12px 0' }}>Check your email!</h3>
                  <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.</p>
                  <button onClick={() => switchMode('login')}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <h3 style={{ color: '#003087', margin: '0 0 8px 0' }}>Reset Password</h3>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Enter your email and we'll send you a reset link.</p>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
                  </div>
                  {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => switchMode('login')}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    Back to Login
                  </button>
                </form>
              )
            )}

          </div>
        )}
      </div>
    </div>
  )
}