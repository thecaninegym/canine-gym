'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'

export default function ViewWaiver() {
  const params = useParams()
  const id = params.id as string
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwner = async () => {
      const { data } = await supabase
        .from('owners')
        .select('*')
        .eq('id', id)
        .single()
      setOwner(data)
      setLoading(false)
    }
    if (id) fetchOwner()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin/owners" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Owners</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '8px' }}>Signed Waiver</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Liability Waiver & Service Agreement for <strong>{owner?.name}</strong></p>

        {!owner?.waiver_signed ? (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#856404', fontWeight: 'bold', fontSize: '16px' }}>⚠️ This client has not yet signed the waiver.</p>
          </div>
        ) : (
          <>
            {/* Signature summary */}
            <div style={{ backgroundColor: '#d4edda', border: '1px solid #28a745', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#155724', fontWeight: 'bold', textTransform: 'uppercase' }}>Signed By</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#155724', fontWeight: 'bold' }}>{owner.waiver_name}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#155724', fontWeight: 'bold', textTransform: 'uppercase' }}>Date Signed</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#155724', fontWeight: 'bold' }}>{new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#155724', fontWeight: 'bold', textTransform: 'uppercase' }}>Email</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#155724', fontWeight: 'bold' }}>{owner.email}</p>
              </div>
            </div>

            {/* Waiver text */}
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', lineHeight: '1.8', color: '#444', fontSize: '14px' }}>
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
              <p>This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. By signing below, Client acknowledges that they have read, understood, and agree to be bound by all terms of this Agreement.</p>

              {/* Signature block */}
              <div style={{ borderTop: '2px solid #003087', marginTop: '32px', paddingTop: '24px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#333', fontWeight: 'bold' }}>Electronic Signature:</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#003087', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{owner.waiver_name}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Signed electronically on {new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {owner.email}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}