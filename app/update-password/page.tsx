'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle } from 'lucide-react'

const ORANGE = '#f88124'
const DARK_BLUE = '#001840'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #e2e6ed',
  borderRadius: '10px',
  fontSize: '14px',
  boxSizing: 'border-box',
  color: DARK_BLUE,
  outline: 'none',
  fontFamily: 'inherit',
  background: '#f8f9fc',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '700',
  color: '#4a5568',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}

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
    if (error) { setError(error.message); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => { window.location.href = '/' }, 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pw-input:focus { border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px rgba(248,129,36,0.12) !important; background: white !important; outline: none; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px #f8f9fc inset !important; -webkit-text-fill-color: ${DARK_BLUE} !important; }
        input::placeholder { color: #b0b8c8; }
        * { box-sizing: border-box; }
        .submit-btn { transition: transform 0.1s ease, box-shadow 0.15s ease; cursor: pointer; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(248,129,36,0.45) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0px); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.4s ease' }}>

        {/* Logo — same as login page */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="The Canine Gym"
            style={{ width: '100%', maxWidth: '280px', height: 'auto', display: 'inline-block' }}
          />
        </div>

        {/* Orange accent line — same as login page */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`, borderRadius: '2px', marginBottom: '0' }} />

        <div style={{ background: 'white', border: '1px solid #e8ecf3', borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '28px 28px 32px', boxShadow: '0 8px 32px rgba(0,24,64,0.08)' }}>

          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#22c55e" />
              </div>
              <h2 style={{ color: DARK_BLUE, margin: '0 0 10px', fontWeight: '800', fontSize: '20px' }}>Password Updated!</h2>
              <p style={{ color: '#718096', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: DARK_BLUE, margin: '0 0 4px', fontWeight: '800', fontSize: '18px' }}>Set New Password</h3>
                <p style={{ color: '#a0aec0', fontSize: '13px', margin: 0 }}>Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>New Password</label>
                  <input className="pw-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                  <PasswordStrengthBar password={password} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input className="pw-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#e74c3c', fontWeight: '600' }}>Passwords do not match.</p>
                  )}
                </div>
                {error && <div style={{ background: '#fff5f5', border: '1.5px solid #feb2b2', color: '#c53030', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                <button type="submit" disabled={loading} className="submit-btn"
                  style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${ORANGE}, #f9a04e)`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(248,129,36,0.3)' }}>
                  {loading ? 'Updating…' : 'Update Password →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#c0c8d8', fontSize: '12px', fontWeight: '600' }}>
          Hamilton County, IN · <a href="https://www.thecaninegym.com" style={{ color: '#c0c8d8', textDecoration: 'none' }}>thecaninegym.com</a>
        </p>

      </div>
    </div>
  )
}
