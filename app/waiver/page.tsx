'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, CheckCircle, PenLine } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

export default function Waiver() {
  const [ownerId, setOwnerId] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [typedName, setTypedName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadySigned, setAlreadySigned] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('id, name, waiver_signed, waiver_signed_at').eq('email', user.email).single()
      if (ownerData) { setOwnerId(ownerData.id); setOwnerName(ownerData.name || ''); if (ownerData.waiver_signed) setAlreadySigned(true) }
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (typedName.trim().toLowerCase() !== ownerName.trim().toLowerCase()) { setError(`Please type your full name exactly as it appears: "${ownerName}"`); return }
    if (!agreed) { setError('Please check the box to agree to the terms.'); return }
    setSaving(true)
    const { error } = await supabase.from('owners').update({ waiver_signed: true, waiver_signed_at: new Date().toISOString(), waiver_name: typedName.trim() }).eq('id', ownerId)
    if (error) { setError(error.message); setSaving(false); return }
    window.location.href = '/dashboard'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#f88124', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        input:focus, select:focus { border-color: #2c5a9e !important; box-shadow: 0 0 0 3px rgba(0,48,135,0.08); }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '700px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Liability Waiver & Service Agreement</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Please read carefully and sign before your first session.</p>
        </div>

        {alreadySigned ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #b8dfc4' }}>
            <div style={{ width: '64px', height: '80px', background: '#d4edda', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#155724" />
            </div>
            <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800', fontSize: '18px' }}>Waiver Already Signed</h3>
            <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px' }}>You have already signed the waiver. You're all set!</p>
            <a href="/dashboard" style={{ background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'inline-block' }}>
              Back to Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Waiver text */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '16px', maxHeight: '480px', overflowY: 'auto', lineHeight: '1.8', color: '#555', fontSize: '14px' }}>
              <h3 style={{ color: '#1a1a2e', marginTop: 0, fontWeight: '800', fontSize: '15px' }}>THE CANINE GYM — LIABILITY WAIVER AND SERVICE AGREEMENT</h3>
              <p>This Liability Waiver and Service Agreement ("Agreement") is entered into between The Canine Gym ("Company") and the undersigned client ("Client") as of the date of signing.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>1. SERVICES</h4>
              <p>The Canine Gym provides in-home and on-location dog fitness sessions, including but not limited to running, walking, and physical conditioning services for dogs. Sessions are 30 minutes in duration and are conducted by trained Canine Gym staff at the Client's designated address.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>2. ASSUMPTION OF RISK</h4>
              <p>Client acknowledges that participation in physical exercise activities involves inherent risks, including but not limited to physical injury, illness, or death of the Client's dog. Client voluntarily assumes all risks associated with the dog fitness services provided by The Canine Gym. Client confirms that their dog is in good health and physically fit to participate in exercise sessions. Client agrees to immediately notify The Canine Gym of any health conditions, injuries, or behavioral concerns that may affect their dog's ability to participate safely.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>3. HEALTH AND VACCINATION REQUIREMENTS</h4>
              <p>Client warrants that their dog is current on all required vaccinations including but not limited to rabies, distemper, and Bordetella. Client agrees that their dog will not participate in sessions if showing signs of illness, injury, or aggressive behavior. The Canine Gym reserves the right to refuse service to any dog showing signs of illness or aggression without penalty to the Company.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>4. RELEASE OF LIABILITY</h4>
              <p>To the fullest extent permitted by law, Client hereby releases, waives, discharges, and covenants not to sue The Canine Gym, its owners, employees, agents, and representatives from any and all liability, claims, demands, actions, and causes of action arising out of or related to any loss, damage, injury, or death that may be sustained by Client's dog while participating in The Canine Gym's services, whether caused by the negligence of The Canine Gym or otherwise.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>5. CANCELLATION POLICY</h4>
              <p>Client agrees to provide at least 48 hours notice for session cancellations. Cancellations made with less than 48 hours notice will be subject to a cancellation fee equal to the cost of one session. Cancellations due to documented dog illness are exempt from cancellation fees. No-shows without notice will be charged the full session fee.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>6. PAYMENT</h4>
              <p>Client agrees to pay for services as invoiced by The Canine Gym. Standard session pricing is $50 per session for one dog, and $95 per session for multiple dogs from the same household. Pricing is subject to change with 30 days written notice.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>7. PHOTO AND MEDIA RELEASE</h4>
              <p>Client grants The Canine Gym permission to photograph or record their dog during sessions for use in marketing materials, social media, and promotional content. Client may opt out of this permission by notifying The Canine Gym in writing.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>8. PROPERTY ACCESS</h4>
              <p>Client grants The Canine Gym staff permission to access their property for the purpose of conducting scheduled sessions. Client agrees to ensure safe access to their property and adequate space for session activities.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>9. GOVERNING LAW</h4>
              <p>This Agreement shall be governed by the laws of the State of Indiana. Any disputes arising from this Agreement shall be resolved in Hamilton County, Indiana.</p>
              <h4 style={{ color: '#2c5a9e', fontWeight: '800', fontSize: '13px' }}>10. ENTIRE AGREEMENT</h4>
              <p style={{ marginBottom: 0 }}>This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. By signing below, Client acknowledges that they have read, understood, and agree to be bound by all terms of this Agreement.</p>
            </div>

            {/* Signature form */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>
                    Type your full name to sign: <span style={{ color: '#f88124', fontWeight: '800' }}>"{ownerName}"</span>
                  </label>
                  <input type="text" value={typedName} onChange={e => setTypedName(e.target.value)} required
                    placeholder="Type your full name exactly as shown above" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#f8f9ff', border: '1.5px solid #e5e8f0', borderRadius: '12px', padding: '16px' }}>
                  <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: '2px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, accentColor: '#2c5a9e' }} />
                  <label htmlFor="agree" style={{ color: '#555', fontSize: '13px', lineHeight: '1.7', cursor: 'pointer' }}>
                    I have read and fully understand this Liability Waiver and Service Agreement. I agree to all terms and conditions stated above and confirm that all information provided is accurate. I understand this is a legally binding agreement.
                  </label>
                </div>

                {error && (
                  <div style={{ background: '#ffeaea', color: '#dc3545', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>{error}</div>
                )}

                <button type="submit" disabled={saving}
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' }}>
                  <PenLine size={17} /> {saving ? 'Signing…' : 'Sign & Continue'}
                </button>

                <p style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                  Signed electronically on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}