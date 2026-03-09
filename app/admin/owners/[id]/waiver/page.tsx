'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { PawPrint, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function ViewWaiver() {
  const params = useParams()
  const id = params.id as string
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwner = async () => {
      const { data } = await supabase.from('owners').select('*').eq('id', id).single()
      setOwner(data)
      setLoading(false)
    }
    if (id) fetchOwner()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-white.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin/owners" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> All Owners
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '760px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Signed Waiver</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Liability Waiver & Service Agreement for <strong style={{ color: '#1a1a2e' }}>{owner?.name}</strong></p>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          {!owner?.waiver_signed ? (
            <div style={{ background: '#fff3cd', border: '1.5px solid #ffc107', padding: '28px', borderRadius: '16px', textAlign: 'center' }}>
              <AlertTriangle size={32} color="#856404" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, color: '#856404', fontWeight: '700', fontSize: '15px' }}>This client has not yet signed the waiver.</p>
            </div>
          ) : (
            <>
              {/* Signature summary banner */}
              <div style={{ background: 'linear-gradient(135deg, #1a7a2e, #28a745)', padding: '20px 24px', borderRadius: '16px', marginBottom: '20px', display: 'flex', gap: '32px', flexWrap: 'wrap' as const, boxShadow: '0 4px 16px rgba(40,167,69,0.25)' }}>
                {[
                  { label: 'Signed By', value: owner.waiver_name },
                  { label: 'Date Signed', value: new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  { label: 'Email', value: owner.email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '15px', color: 'white', fontWeight: '700' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Waiver document */}
              <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', lineHeight: '1.8', color: '#444', fontSize: '14px' }}>
                <h3 style={{ color: '#2c5a9e', marginTop: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '0.3px' }}>THE CANINE GYM — LIABILITY WAIVER AND SERVICE AGREEMENT</h3>
                <p>This Liability Waiver and Service Agreement ("Agreement") is entered into between The Canine Gym ("Company") and the undersigned client ("Client") as of the date of signing.</p>

                {[
                  { num: '1', title: 'SERVICES', text: "The Canine Gym provides in-home and on-location dog fitness sessions, including but not limited to running, walking, and physical conditioning services for dogs. Sessions are 30 minutes in duration and are conducted by trained Canine Gym staff at the Client's designated address." },
                  { num: '2', title: 'ASSUMPTION OF RISK', text: "Client acknowledges that participation in physical exercise activities involves inherent risks, including but not limited to physical injury, illness, or death of the Client's dog. Client voluntarily assumes all risks associated with the dog fitness services provided by The Canine Gym. Client confirms that their dog is in good health and physically fit to participate in exercise sessions. Client agrees to immediately notify The Canine Gym of any health conditions, injuries, or behavioral concerns that may affect their dog's ability to participate safely." },
                  { num: '3', title: 'HEALTH AND VACCINATION REQUIREMENTS', text: "Client warrants that their dog is current on all required vaccinations including but not limited to rabies, distemper, and Bordetella. Client agrees that their dog will not participate in sessions if showing signs of illness, injury, or aggressive behavior. The Canine Gym reserves the right to refuse service to any dog showing signs of illness or aggression without penalty to the Company." },
                  { num: '4', title: 'RELEASE OF LIABILITY', text: "To the fullest extent permitted by law, Client hereby releases, waives, discharges, and covenants not to sue The Canine Gym, its owners, employees, agents, and representatives from any and all liability, claims, demands, actions, and causes of action arising out of or related to any loss, damage, injury, or death that may be sustained by Client's dog while participating in The Canine Gym's services, whether caused by the negligence of The Canine Gym or otherwise." },
                  { num: '5', title: 'CANCELLATION POLICY', text: "Client agrees to provide at least 48 hours notice for session cancellations. Cancellations made with less than 48 hours notice will be subject to a cancellation fee equal to the cost of one session. Cancellations due to documented dog illness are exempt from cancellation fees. No-shows without notice will be charged the full session fee." },
                  { num: '6', title: 'PAYMENT', text: "Client agrees to pay for services as invoiced by The Canine Gym. Standard session pricing is $50 per session for one dog, and $95 per session for multiple dogs from the same household. Pricing is subject to change with 30 days written notice." },
                  { num: '7', title: 'PHOTO AND MEDIA RELEASE', text: "Client grants The Canine Gym permission to photograph or record their dog during sessions for use in marketing materials, social media, and promotional content. Client may opt out of this permission by notifying The Canine Gym in writing." },
                  { num: '8', title: 'PROPERTY ACCESS', text: "Client grants The Canine Gym staff permission to access their property for the purpose of conducting scheduled sessions. Client agrees to ensure safe access to their property and adequate space for session activities." },
                  { num: '9', title: 'GOVERNING LAW', text: "This Agreement shall be governed by the laws of the State of Indiana. Any disputes arising from this Agreement shall be resolved in Hamilton County, Indiana." },
                  { num: '10', title: 'ENTIRE AGREEMENT', text: "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. By signing below, Client acknowledges that they have read, understood, and agree to be bound by all terms of this Agreement." },
                ].map(({ num, title, text }) => (
                  <div key={num}>
                    <h4 style={{ color: '#2c5a9e', margin: '24px 0 8px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{num}. {title}</h4>
                    <p style={{ margin: 0 }}>{text}</p>
                  </div>
                ))}

                {/* Signature block */}
                <div style={{ borderTop: '2px solid #eef0f5', marginTop: '36px', paddingTop: '28px' }}>
                  <p style={{ margin: '0 0 6px', color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Electronic Signature</p>
                  <p style={{ margin: '0 0 6px', fontSize: '24px', color: '#2c5a9e', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{owner.waiver_name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                    Signed electronically on {new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {owner.email}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}