'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Mail, CheckCircle } from 'lucide-react'

const ORANGE = '#f88124'
const DARK_BLUE = '#001840'
const BLUE = '#2c5a9e'

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #e2e6ed',
  borderRadius: '10px',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
  color: DARK_BLUE,
  outline: 'none',
  fontFamily: 'inherit',
  background: '#f8f9fc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '700',
  color: '#4a5568',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

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

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode); setError(null); setResetSent(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Montserrat', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .login-input:focus { border-color: #f88124 !important; box-shadow: 0 0 0 3px rgba(248,129,36,0.12) !important; background: white !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #f8f9fc inset !important; -webkit-text-fill-color: #001840 !important; }
        input::placeholder { color: #b0b8c8; }
        * { box-sizing: border-box; }
        .tab-btn { transition: all 0.15s ease; }
        .submit-btn { transition: transform 0.1s ease, box-shadow 0.1s ease; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(248,129,36,0.4) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{ position: 'absolute', top: -120, right: -120, width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(248,129,36,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(44,90,158,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.4s ease' }}>

        {/* Full color logo on white pill */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', background: 'white', borderRadius: '20px', padding: '16px 32px', boxShadow: '0 4px 20px rgba(0,24,64,0.10)' }}>
            <img src="/logo.png" alt="The Canine Gym" style={{ height: '72px', width: 'auto', display: 'block' }} />
          </div>
        </div>

        {signupSuccess ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '40px 32px', boxShadow: '0 8px 40px rgba(0,24,64,0.10)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h2 style={{ color: DARK_BLUE, margin: '0 0 10px', fontWeight: '800', fontSize: '20px' }}>Welcome to the pack!</h2>
            <p style={{ color: '#718096', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>Your account has been created. You can log in now!</p>
            <button onClick={() => { setMode('login'); setSignupSuccess(false) }} className="submit-btn"
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(248,129,36,0.3)' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 8px 40px rgba(0,24,64,0.10)' }}>

            {mode !== 'reset' && (
              <div style={{ display: 'flex', marginBottom: '24px', background: '#f0f2f7', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                <button onClick={() => switchMode('login')} className="tab-btn"
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? DARK_BLUE : '#a0aec0', boxShadow: mode === 'login' ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                  Log In
                </button>
                <button onClick={() => switchMode('signup')} className="tab-btn"
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', background: mode === 'signup' ? 'white' : 'transparent', color: mode === 'signup' ? DARK_BLUE : '#a0aec0', boxShadow: mode === 'signup' ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                  Sign Up
                </button>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Password</label>
                  <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '22px', textAlign: 'right' }}>
                  <button type="button" onClick={() => switchMode('reset')}
                    style={{ background: 'none', border: 'none', color: ORANGE, fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: '700', fontFamily: 'inherit' }}>
                    Forgot password?
                  </button>
                </div>
                {error && <div style={{ background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#c53030', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                <button type="submit" disabled={loading} className="submit-btn"
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(248,129,36,0.3)', fontFamily: 'inherit' }}>
                  {loading ? 'Logging in…' : 'Log In →'}
                </button>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input className="login-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jane" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input className="login-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Smith" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Email</label>
                  <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Phone</label>
                  <input className="login-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(317) 555-0123" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Password</label>
                  <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input className="login-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>
                {error && <div style={{ background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#c53030', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                <button type="submit" disabled={loading} className="submit-btn"
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(248,129,36,0.3)', fontFamily: 'inherit' }}>
                  {loading ? 'Creating Account…' : 'Create Account →'}
                </button>
              </form>
            )}

            {mode === 'reset' && (
              resetSent ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(44,90,158,0.08)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Mail size={28} color={BLUE} />
                  </div>
                  <h3 style={{ color: DARK_BLUE, margin: '0 0 10px', fontWeight: '800', fontSize: '18px' }}>Check your email!</h3>
                  <p style={{ color: '#718096', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>We sent a reset link to <strong style={{ color: DARK_BLUE }}>{email}</strong>.</p>
                  <button onClick={() => switchMode('login')} className="tab-btn"
                    style={{ width: '100%', padding: '13px', background: '#f0f2f7', color: DARK_BLUE, border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: DARK_BLUE, margin: '0 0 6px', fontWeight: '800', fontSize: '18px' }}>Reset Password</h3>
                    <p style={{ color: '#718096', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</p>
                  </div>
                  <div style={{ marginBottom: '22px' }}>
                    <label style={labelStyle}>Email</label>
                    <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" style={inputStyle} />
                  </div>
                  {error && <div style={{ background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#c53030', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                  <button type="submit" disabled={loading} className="submit-btn"
                    style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 16px rgba(248,129,36,0.3)', fontFamily: 'inherit' }}>
                    {loading ? 'Sending…' : 'Send Reset Link →'}
                  </button>
                  <button type="button" onClick={() => switchMode('login')} className="tab-btn"
                    style={{ width: '100%', padding: '12px', background: '#f0f2f7', color: '#718096', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Back to Login
                  </button>
                </form>
              )
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#a0aec0', fontSize: '12px', fontWeight: '600' }}>
          Hamilton County, IN · <a href="https://www.thecaninegym.com" style={{ color: '#a0aec0', textDecoration: 'none' }}>thecaninegym.com</a>
        </p>

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