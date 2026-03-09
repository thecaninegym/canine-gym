'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { PawPrint, Mail, CheckCircle } from 'lucide-react'

const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: 'white', outline: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.08)' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }

function LoginContent() {
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
  const searchParams = useSearchParams()
useEffect(() => {
  const m = searchParams.get('mode')
  if (m === 'signup') setMode('signup')
}, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Invalid email or password.'); setLoading(false); return }
    window.location.href = data.user?.email === 'dev@thecaninegym.com' ? '/admin' : '/dashboard'
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }
    const { error: signupError } = await supabase.auth.signUp({ email, password })
if (signupError) { setError(signupError.message); setLoading(false); return }
// Sign in immediately so session is active before inserting
await supabase.auth.signInWithPassword({ email, password })
const fullName = `${firstName} ${lastName}`.trim()
await supabase.from('owners').insert([{ name: fullName, email, phone }])
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'welcome', to: email, data: { ownerName: firstName, dogName: 'your dog' } }) })
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'admin_notification', to: 'dev@thecaninegym.com', data: { action: 'New Client Signed Up', dogName: 'Not yet added', ownerName: `${firstName} ${lastName}`, date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), time: email } }) })
    await supabase.auth.signInWithPassword({ email, password })
    window.location.href = '/dashboard'
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app.thecaninegym.com/update-password' })
    if (error) { setError(error.message); setLoading(false); return }
    setResetSent(true); setLoading(false)
  }

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => { setMode(newMode); setError(null); setResetSent(false) }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Montserrat', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px rgba(0,48,135,0.8) inset !important; -webkit-text-fill-color: white !important; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(255,107,53,0.6) !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.15); }
        * { box-sizing: border-box; }
      `}</style>

      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,107,53,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.35s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo-white.png" alt="The Canine Gym" style={{ height: '64px', width: 'auto', margin: '0 auto 8px', display: 'block' }} />
        </div>

        {signupSuccess ? (
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '36px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(34,197,94,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={30} color="#22c55e" />
            </div>
            <h2 style={{ color: 'white', margin: '0 0 10px', fontWeight: '800', fontSize: '20px' }}>Welcome to the pack!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>Your account has been created. You can log in now!</p>
            <button onClick={() => { setMode('login'); setSignupSuccess(false) }}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px' }}>

            {/* Tab switcher */}
            {mode !== 'reset' && (
              <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                <button onClick={() => switchMode('login')}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s', background: mode === 'login' ? 'rgba(255,255,255,0.15)' : 'transparent', color: mode === 'login' ? 'white' : 'rgba(255,255,255,0.45)' }}>
                  Log In
                </button>
                <button onClick={() => switchMode('signup')}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s', background: mode === 'signup' ? 'rgba(255,255,255,0.15)' : 'transparent', color: mode === 'signup' ? 'white' : 'rgba(255,255,255,0.45)' }}>
                  Sign Up
                </button>
              </div>
            )}

            {/* Login */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '22px', textAlign: 'right' }}>
                  <button type="button" onClick={() => switchMode('reset')}
                    style={{ background: 'none', border: 'none', color: '#f88124', fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                    Forgot password?
                  </button>
                </div>
                {error && <div style={{ background: 'rgba(220,53,69,0.15)', border: '1.5px solid rgba(220,53,69,0.3)', color: '#ff8a94', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
                  {loading ? 'Logging in…' : 'Log In'}
                </button>
              </form>
            )}

            {/* Signup */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jane" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Smith" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(317) 555-0123" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                {error && <div style={{ background: 'rgba(220,53,69,0.15)', border: '1.5px solid rgba(220,53,69,0.3)', color: '#ff8a94', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Reset */}
            {mode === 'reset' && (
              resetSent ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(0,48,135,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Mail size={28} color="white" />
                  </div>
                  <h3 style={{ color: 'white', margin: '0 0 10px', fontWeight: '800', fontSize: '18px' }}>Check your email!</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>We sent a reset link to <strong style={{ color: 'white' }}>{email}</strong>.</p>
                  <button onClick={() => switchMode('login')}
                    style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div style={{ marginBottom: '6px' }}>
                    <h3 style={{ color: 'white', margin: '0 0 6px', fontWeight: '800', fontSize: '18px' }}>Reset Password</h3>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</p>
                  </div>
                  <div style={{ marginBottom: '22px' }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                  </div>
                  {error && <div style={{ background: 'rgba(220,53,69,0.15)', border: '1.5px solid rgba(220,53,69,0.3)', color: '#ff8a94', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => switchMode('login')}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}