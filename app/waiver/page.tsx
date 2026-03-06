'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

      const { data: ownerData } = await supabase
        .from('owners')
        .select('id, name, waiver_signed, waiver_signed_at')
        .eq('email', user.email)
        .single()

      if (ownerData) {
        setOwnerId(ownerData.id)
        setOwnerName(ownerData.name || '')
        if (ownerData.waiver_signed) setAlreadySigned(true)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (typedName.trim().toLowerCase() !== ownerName.trim().toLowerCase()) {
      setError(`Please type your full name exactly as it appears: "${ownerName}"`)
      return
    }

    if (!agreed) {
      setError('Please check the box to agree to the terms.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('owners')
      .update({
        waiver_signed: true,
        waiver_signed_at: new Date().toISOString(),
        waiver_name: typedName.trim()
      })
      .eq('id', ownerId)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    window.location.href = '/dashboard'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '8px' }}>Liability Waiver & Service Agreement</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Please read carefully and sign before your first session.</p>

        {alreadySigned ? (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>✅ Waiver Already Signed</h3>
            <p style={{ margin: '0 0 16px 0' }}>You have already signed the waiver. You're all set!</p>
            <a href="/dashboard" style={{ backgroundColor: '#003087', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Back to Dashboard</a>
          </div>
        ) : (
          <>
            {/* Waiver text */}
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px', maxHeight: '500px', overflowY: 'auto', lineHeight: '1.8', color: '#444', fontSize: '14px' }}>
              <h3 style={{ color: '#003087', marginTop: 0 }}>THE CANINE GYM — LIABILITY WAIVER AND SERVICE AGREEMENT</h3>
              <p>This Liability Waiver and Service Agreement ("Agreement") is entered into between The Canine Gym ("Company") and the undersigned client ("Client") as of the date of signing.</p>

              <h4 style={{ color: '#003087' }}>1. SERVICES</h4>
              <p>The Canine Gym provides in-home and on-location dog fitness sessions, including but not limited to running, walking, and physical conditioning services for dogs. Sessions are 30 minutes in duration and are conducted by trained Canine Gym staff at the Client's designated address.</p>

              <h4 style={{ color: '#003087' }}>2. ASSUMPTION OF RISK</h4>
              <p>Client acknowledges that participation in physical exercise activities involves inherent risks, including but not limited to physical injury, illness, or death of the Client's dog. Client voluntarily assumes all risks associated with the dog fitness services provided by The Canine Gym. Client confirms that their dog is in good health and physically fit to participate in exercise sessions. Client agrees to immediately notify The Canine Gym of any health conditions, injuries, or behavioral concerns that may affect their dog's ability to participate safely.</p>

              <h4 style={{ color: '#003087' }}>3. HEALTH AND VACCINATION REQUIREMENTS</h4>
              <p>Client warrants that their dog is current on all required vaccinations including but not limited to rabies, distemper, and Bordetella. Client agrees that their dog will not participate in sessions if showing signs of illness, injury, or aggressive behavior. The Canine Gym reserves the right to refuse service to any dog showing signs of illness or aggression without penalty to the Company.</p>

              <h4 style={{ color: '#003087' }}>4. RELEASE OF LIABILITY</h4>
              <p>To the fullest extent permitted by law, Client hereby releases, waives, discharges, and covenants not to sue The Canine Gym, its owners, employees, agents, and representatives from any and all liability, claims, demands, actions, and causes of action arising out of or related to any loss, damage, injury, or death that may be sustained by Client's dog while participating in The Canine Gym's services, whether caused by the negligence of The Canine Gym or otherwise.</p>

              <h4 style={{ color: '#003087' }}>5. CANCELLATION POLICY</h4>
              <p>Client agrees to provide at least 48 hours notice for session cancellations. Cancellations made with less than 48 hours notice will be subject to a cancellation fee equal to the cost of one session. Cancellations due to documented dog illness are exempt from cancellation fees. No-shows without notice will be charged the full session fee.</p>

              <h4 style={{ color: '#003087' }}>6. PAYMENT</h4>
              <p>Client agrees to pay for services as invoiced by The Canine Gym. Standard session pricing is $50 per session for one dog, and $95 per session for multiple dogs from the same household. Pricing is subject to change with 30 days written notice.</p>

              <h4 style={{ color: '#003087' }}>7. PHOTO AND MEDIA RELEASE</h4>
              <p>Client grants The Canine Gym permission to photograph or record their dog during sessions for use in marketing materials, social media, and promotional content. Client may opt out of this permission by notifying The Canine Gym in writing.</p>

              <h4 style={{ color: '#003087' }}>8. PROPERTY ACCESS</h4>
              <p>Client grants The Canine Gym staff permission to access their property for the purpose of conducting scheduled sessions. Client agrees to ensure safe access to their property and adequate space for session activities.</p>

              <h4 style={{ color: '#003087' }}>9. GOVERNING LAW</h4>
              <p>This Agreement shall be governed by the laws of the State of Indiana. Any disputes arising from this Agreement shall be resolved in Hamilton County, Indiana.</p>

              <h4 style={{ color: '#003087' }}>10. ENTIRE AGREEMENT</h4>
              <p style={{ marginBottom: 0 }}>This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. By signing below, Client acknowledges that they have read, understood, and agree to be bound by all terms of this Agreement.</p>
            </div>

            {/* Signature section */}
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>
                    Type your full name to sign: <span style={{ color: '#FF6B35' }}>"{ownerName}"</span>
                  </label>
                  <input type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)} required
                    placeholder="Type your full name exactly as shown above"
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }} />
                </div>
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="agree" style={{ color: '#333', fontSize: '14px', lineHeight: '1.6', cursor: 'pointer' }}>
                    I have read and fully understand this Liability Waiver and Service Agreement. I agree to all terms and conditions stated above and confirm that all information provided is accurate. I understand this is a legally binding agreement.
                  </label>
                </div>
                {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
                <button type="submit" disabled={saving}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Signing...' : '✍️ Sign & Continue'}
                </button>
                <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
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