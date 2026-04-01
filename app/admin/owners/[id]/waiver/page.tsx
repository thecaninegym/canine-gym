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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: '64px', width: 'auto', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ width: '180px', height: '3px', background: '#f0f2f7', borderRadius: '2px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ height: '100%', background: '#f88124', borderRadius: '2px', animation: 'sweep 1.2s ease-in-out infinite' }} />
        </div>
        <style>{`
          @keyframes sweep {
            0% { width: 0%; marginLeft: 0%; }
            50% { width: 60%; }
            100% { width: 0%; marginLeft: 100%; }
          }
        `}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin/owners" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
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
              <div style={{ background: 'linear-gradient(135deg, #1a7a2e, #28a745)', padding: '20px 24px', borderRadius: '16px', marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' as const, boxShadow: '0 4px 16px rgba(40,167,69,0.25)' }}>
                {[
                  { label: 'Signed By', value: owner.waiver_name },
                  { label: 'Date Signed', value: new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  { label: 'Time (UTC)', value: new Date(owner.waiver_signed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) },
                  { label: 'Email', value: owner.email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'white', fontWeight: '700' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Server-captured signing details */}
              <div style={{ background: '#f8f9fc', border: '1.5px solid #e5e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: '800', color: '#2c5a9e', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Server-Captured Signing Record</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {[
                    { label: 'IP Address', value: owner.waiver_ip_address || 'Not captured' },
                    { label: 'User Agent', value: owner.waiver_user_agent || 'Not captured' },
                    { label: 'Emergency Spending Limit', value: owner.waiver_spending_limit ? `$${owner.waiver_spending_limit.toLocaleString()}` : 'No limit (left blank)' },
                    { label: 'Media Release Opt-Out', value: owner.waiver_media_opt_out ? 'Yes — opted out' : 'No — opted in' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#1a1a2e', fontWeight: '600', wordBreak: 'break-all' as const }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waiver document */}
              <div style={{ background: 'white', padding: '32px 40px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', lineHeight: '1.8', color: '#444', fontSize: '14px' }}>

                <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f2f7' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>THE CANINE GYM</p>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>LIABILITY WAIVER AND SERVICE AGREEMENT</p>
                </div>

                <p style={{ marginTop: 0 }}>This Liability Waiver and Service Agreement ("Agreement") is a legally binding contract between The Canine Gym LLC, an Indiana limited liability company (together with its owners, members, managers, employees, independent contractors, and agents, collectively the "Company") and the undersigned client ("Client"). It governs the initial session and all subsequent sessions until terminated as described below.</p>

                {[
                  { num: '1', title: 'DESCRIPTION OF SERVICES & TRANSFER OF CONTROL', text: "The Company provides mobile, in-van dog fitness sessions utilizing a non-motorized slatmill/treadmill housed inside the Company's mobile fitness unit (\"Van\"). Company staff will arrive at Client's designated address, receive Client's dog(s) at the doorway or curb (\"Handoff Location\"), attach a Company lead, walk the dog(s) to the Van, conduct a supervised 30-minute conditioning session on the slatmill, and return the dog(s) to Client at the same Handoff Location upon completion. The Company assumes full custody once the dog(s) are securely leashed at the Handoff Location. Dogs must be presented in a properly fitted Y-front or back-clip body harness. Company staff are strictly prohibited from entering Client's residence. No children under 18 are permitted inside the Van at any time." },
                  { num: '2', title: 'ASSUMPTION OF RISK', text: "Client acknowledges that physical exercise involves inherent risks for dogs, including but not limited to: muscle strains, ligament tears, pad abrasions, cardiovascular stress, heat exhaustion, and injury during loading, unloading, or outdoor transfer. Client voluntarily assumes all such risks. Client warrants that their dog(s) are physically fit and, where required under Section 3, have veterinary clearance for strenuous exercise. Client agrees to immediately notify the Company in writing of any health condition, injury, surgery, medication change, or behavioral concern that may affect their dog's ability to participate safely." },
                  { num: '3', title: 'HEALTH, VACCINATION & BEHAVIORAL REQUIREMENTS', text: "Client warrants that their dog(s) are current on Rabies, Distemper/Parvovirus (DA2PP), Bordetella, Leptospirosis, and Canine Influenza and shall provide written proof before the first session. Dogs must be on a veterinarian-recommended flea, tick, and parasite prevention program. Dogs aged 7 or older, or dogs with known cardiac, orthopedic, neurological, or respiratory conditions, must provide written veterinary clearance. Dogs must be at least six (6) months of age. Brachycephalic breeds require additional written veterinary clearance specifically approving slatmill exercise. Client agrees not to feed the dog a full meal or allow large amounts of water intake within two (2) hours prior to the session. Client's dog(s) will not be presented for a session if showing visible signs of illness, injury, lameness, or distress. Client discloses any and all prior bite incidents or known aggression in the Dog Information Form." },
                  { num: '4', title: 'RELEASE OF LIABILITY', text: "To the fullest extent permitted by Indiana law, Client hereby releases, waives, and discharges the Company from any and all liability, claims, or causes of action, including those arising from the ordinary negligence of the Company, for: injury, illness, or death of Client's dog(s) during or after any session; personal injury to Client while entering, inside, or exiting the Van; and any loss, damage, or escape occurring during the Transfer of Control period. Nothing in this Agreement releases the Company from liability for gross negligence or willful misconduct. In no event shall the Company's total liability to Client exceed the total fees paid by Client in the 30 days preceding the incident." },
                  { num: '5', title: 'INDEMNIFICATION', text: "Client agrees to indemnify and hold harmless the Company from any and all claims, costs, and expenses (including reasonable attorneys' fees) arising from: bites or injuries inflicted by Client's dog upon Company staff, contractors, or third parties; damage to Company equipment or the Van caused by Client's dog; Client's material misrepresentation of the dog's health, vaccination, or bite history; any third-party claim arising from Client's dog's behavior while in Company custody where that behavior was known or reasonably foreseeable by Client; and any damage caused by the dog to Client's or third-party property during the Transfer of Control period, unless resulting from the Company's gross negligence." },
                  { num: '6', title: 'EMERGENCY MEDICAL AUTHORIZATION', text: "In the event of a medical emergency involving Client's dog while in the Company's care, the Company is authorized to seek veterinary care at Client's designated veterinarian or, if unavailable, the nearest emergency veterinary facility. The Company will make reasonable efforts to contact Client before authorizing treatment. If Client is unreachable and delay would risk the dog's health or life, the Company is authorized to act in the dog's best interest without prior approval. Client agrees to be responsible for all costs related to such emergency treatment, due within fourteen (14) days of the invoice date." },
                  { num: '7', title: 'BOOKING, PAYMENT & CANCELLATION', text: "All sessions must be booked and paid in full in advance through the Company's website. 48 hours' notice is required to cancel or reschedule. Cancellations with less than 48 hours' notice, and no-shows, are charged the full session fee. Cancellations due to documented veterinary illness are exempt from the cancellation fee. If a dog refuses to use the slatmill, the full session fee still applies. Failed payments not rectified within 48 hours will result in cancellation of all future booked sessions." },
                  { num: '8', title: 'PHOTO & MEDIA RELEASE', text: "Client grants permission to photograph or record Client's dog(s) during sessions for use in marketing materials and social media. The Company will make reasonable efforts to avoid capturing Client's full home address, license plates, or other personally identifying information in published content." },
                  { num: '9', title: 'GENERAL PROVISIONS', text: "This Agreement is governed by Indiana law. Any dispute shall be resolved by binding arbitration under AAA Consumer Arbitration Rules in Hamilton County, Indiana. Either party may terminate with 14 days' written notice; the Company may terminate immediately for cause. The Company may amend this Agreement with 30 days' written notice; continued booking after the effective date constitutes acceptance. An electronic signature is as legally binding as a handwritten signature under Indiana's Uniform Electronic Transactions Act. This Agreement, together with the Dog Information Form completed during online account registration, constitutes the entire agreement between the parties." },
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
                    Signed electronically on {new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(owner.waiver_signed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} UTC · {owner.email} · IP: {owner.waiver_ip_address || 'not captured'}
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