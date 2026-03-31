'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, CheckCircle, PenLine } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700', color: '#555', fontSize: '13px' }

const sectionHeader = { color: '#2c5a9e', fontWeight: '800' as const, fontSize: '13px', margin: '20px 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }
const subHeader = { color: '#1a1a2e', fontWeight: '700' as const, fontSize: '13px', margin: '14px 0 4px' }
const bullet = { margin: '4px 0 4px 16px', paddingLeft: '8px', borderLeft: '2px solid #e5e8f0', color: '#555', fontSize: '14px', lineHeight: '1.8' }

export default function Waiver() {
  const [ownerId, setOwnerId] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [typedName, setTypedName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [optOutMedia, setOptOutMedia] = useState(false)
  const [spendingLimit, setSpendingLimit] = useState('')
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
    if (typedName.trim().toLowerCase() !== ownerName.trim().toLowerCase()) {
      setError(`Please type your full name exactly as it appears: "${ownerName}"`)
      return
    }
    if (!agreed) { setError('Please check the box to agree to the terms.'); return }
    setSaving(true)

    // Call the server-side API route so IP and timestamp are captured server-side
    const res = await fetch('/api/sign-waiver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId,
        waiverName: typedName.trim(),
        optOutMedia,
        spendingLimit: spendingLimit || null,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error || 'Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    window.location.href = '/dashboard'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: '64px', width: 'auto', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ width: '180px', height: '3px', background: '#f0f2f7', borderRadius: '2px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ height: '100%', background: '#f88124', borderRadius: '2px', animation: 'sweep 1.2s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes sweep { 0% { width: 0%; marginLeft: 0%; } 50% { width: 60%; } 100% { width: 0%; marginLeft: 100%; } }`}</style>
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
            <div style={{ width: '64px', height: '64px', background: '#d4edda', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
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
            {/* Waiver Text */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '16px', maxHeight: '520px', overflowY: 'auto', lineHeight: '1.8', color: '#555', fontSize: '14px' }}>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f2f7' }}>
                <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '15px', color: '#1a1a2e', letterSpacing: '0.5px' }}>THE CANINE GYM</p>
                <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#1a1a2e', letterSpacing: '0.3px' }}>LIABILITY WAIVER AND SERVICE AGREEMENT</p>
              </div>

              {/* Preamble */}
              <p style={{ marginTop: 0 }}>
                This Liability Waiver and Service Agreement ("Agreement") is a legally binding contract between The Canine Gym LLC, an Indiana limited liability company (together with its owners, members, managers, employees, independent contractors, and agents, collectively the "Company") and the undersigned client ("Client"). It governs the initial session and all subsequent sessions until terminated as described below.
              </p>

              {/* Section 1 */}
              <h4 style={sectionHeader}>1. Description of Services & Transfer of Control</h4>
              <p>The Company provides mobile, in-van dog fitness sessions utilizing a non-motorized slatmill/treadmill housed inside the Company's mobile fitness unit ("Van").</p>

              <p style={{ ...subHeader }}>The Process:</p>
              <p style={{ marginTop: 0 }}>Company staff will arrive at Client's designated address, signal their arrival, and receive Client's dog(s) directly from Client, or from an authorized adult representative (18+) designated by Client, at the doorway or curb ("Handoff Location"). Staff will attach a Company lead, walk the dog(s) to the Van, conduct a supervised 30-minute conditioning session on the slatmill, and return the dog(s) to Client at the same Handoff Location upon completion.</p>

              <p style={subHeader}>Transfer of Control:</p>
              <p style={{ marginTop: 0 }}>The Company assumes full custody and responsibility for the dog(s) once they are securely leashed by Company staff at the Handoff Location. Custody returns to Client upon physical handoff at the Handoff Location after the session. All risks during the Transfer of Control period, including the outdoor walk to and from the Van, loading, unloading, and time inside the Van, are addressed in Sections 2 and 4.</p>

              <p style={subHeader}>Harness Requirement:</p>
              <p style={{ marginTop: 0 }}>For safety, Client's dog(s) must be presented in a properly fitted, Y-front or back-clip body harness at the time of handoff. The Company will not exercise any dog on a neck collar. While Company staff may visually check the fit of a Client-supplied harness, the ultimate responsibility for the integrity and proper fit of the harness remains solely with the Client. If a suitable harness is not provided, the Company reserves the right to refuse service for that session and the full cancellation fee will apply. The Company does not supply harnesses.</p>

              <p style={subHeader}>No Entry Policy:</p>
              <p style={{ marginTop: 0 }}>Company staff are strictly prohibited from entering Client's residence at any time.</p>

              <p style={subHeader}>Parking & Safe Work Zone:</p>
              <p style={{ marginTop: 0 }}>Client is responsible for ensuring a legal, safe parking space for the Van within 50 feet of the Handoff Location. If Company staff determines that parking or the Handoff Location is unsafe, including due to traffic, lack of space, or obstruction, staff will notify Client and allow a reasonable opportunity to identify an alternative location. If no safe alternative can be identified, the session will be cancelled and treated as a late cancellation subject to the cancellation fee in Section 7.</p>

              <p style={subHeader}>Multiple Dog Sessions:</p>
              <p style={{ marginTop: 0 }}>For multi-dog sessions, dogs will be transported to and from the Van one at a time. Client or Client's authorized representative is responsible for maintaining control of all remaining dogs during each individual transfer. Company staff will not be responsible for any dog left unattended at the Handoff Location while another dog is being loaded or unloaded.</p>

              <p style={subHeader}>No-Show Policy:</p>
              <p style={{ marginTop: 0 }}>If no Client or authorized representative is present at the Handoff Location within 10 minutes of the scheduled session time, the session will be treated as a late cancellation and the full cancellation fee applies.</p>

              <p style={subHeader}>Client Observation:</p>
              <p style={{ marginTop: 0 }}>Client may elect to observe the session inside the Van. The Van is a confined workspace containing mechanical fitness equipment. For safety reasons, only the Client or their authorized adult representative (18+) may enter the Van. No children under the age of 18 are permitted inside the Van at any time. By entering the Van, Client assumes all personal risk of injury and acknowledges that Company staff may ask Client to exit at any time if their presence affects session safety or quality.</p>

              {/* Section 2 */}
              <h4 style={sectionHeader}>2. Assumption of Risk</h4>
              <p>Client acknowledges that physical exercise involves inherent risks for dogs, including but not limited to: muscle strains, ligament tears, pad abrasions, cardiovascular stress, heat exhaustion, and injury during loading, unloading, or outdoor transfer. Client voluntarily assumes all such risks.</p>

              <p style={subHeader}>Heat & Environmental Conditions:</p>
              <p style={{ marginTop: 0 }}>Client acknowledges that exercise inside a mobile unit may involve elevated temperatures and humidity, and that dogs can experience heat stress more rapidly in an enclosed environment than during outdoor activity. Company staff has the sole right to shorten or immediately terminate any session if, in staff's reasonable judgment, ambient conditions or the dog's physical response indicate a risk of heat stress or physical harm. A session shortened or terminated due to safety concerns does not entitle Client to a refund of the session fee, but no additional fee will be charged.</p>
              <p>Client warrants that their dog(s) are physically fit and, where required under Section 3, have veterinary clearance for strenuous exercise. Client agrees to immediately notify the Company in writing of any health condition, injury, surgery, medication change, or behavioral concern that may affect their dog's ability to participate safely.</p>

              {/* Section 3 */}
              <h4 style={sectionHeader}>3. Health, Vaccination & Behavioral Requirements</h4>
              <p>Client warrants the following, and agrees that the Company's acceptance of Client's dog(s) is made in reliance on these representations:</p>

              <p style={subHeader}>Vaccinations:</p>
              <p style={{ marginTop: 0 }}>Client's dog(s) are current on Rabies, Distemper/Parvovirus (DA2PP), Bordetella, Leptospirosis, and Canine Influenza (to the extent recommended for the dog's age and lifestyle by a licensed veterinarian). Client shall provide written proof of current vaccinations before the first session and upon renewal.</p>

              <p style={subHeader}>Parasite Prevention:</p>
              <p style={{ marginTop: 0 }}>Client's dog(s) are on a regular veterinarian-recommended flea, tick, and parasite prevention program.</p>

              <p style={subHeader}>Veterinary Clearance:</p>
              <p style={{ marginTop: 0 }}>Client's dog(s) have been evaluated by a veterinarian within the preceding 12 months. Dogs with known cardiac, orthopedic, neurological, or respiratory conditions, must confirm veterinary clearance before their first session.</p>

              <p style={subHeader}>Age & Breed Restrictions:</p>
              <p style={{ marginTop: 0 }}>Dogs must be at least six (6) months of age. Brachycephalic breeds (e.g., Bulldogs, Pugs, Boston Terriers, French Bulldogs, etc.) require additional confirmation of veterinary clearance specifically approving slatmill exercise before the first session.</p>

              <p style={subHeader}>Pre-Exercise Feeding & Cool-Down Protocol:</p>
              <p style={{ marginTop: 0 }}>Client agrees not to feed the dog a full meal or allow large amounts of water intake within two (2) hours prior to the scheduled session. Client further agrees not to feed the dog a full meal for at least sixty (60) minutes following the session. Client acknowledges that failure to follow this protocol increases the risk of life-threatening Gastric Dilatation-Volvulus (GDV / "bloat") and voluntarily assumes all risk associated with failure to follow this protocol. Client is advised to consult their veterinarian regarding breed-specific exercise and feeding guidelines.</p>

              <p style={subHeader}>Fitness to Participate:</p>
              <p style={{ marginTop: 0 }}>Client's dog(s) will not be presented for a session if showing visible signs of illness, injury, lameness, or distress on the day of the session.</p>

              <p style={subHeader}>Bite & Aggression History:</p>
              <p style={{ marginTop: 0 }}>Client discloses, in the Dog Information Form completed by Client during the online account registration process, any and all prior bite incidents or known aggression, regardless of circumstance or severity. Failure to disclose a known bite history is a material misrepresentation and grounds for immediate termination and indemnification claims against Client.</p>

              <p>The Company reserves the right to refuse service at any time if Company staff reasonably determines that a dog poses a health or safety risk. If refusal occurs before the session begins, no session fee is charged. If refusal occurs after the session has commenced, the full session fee applies.</p>

              <p style={subHeader}>Client Authority and Capacity:</p>
              <p style={{ marginTop: 0 }}>Client represents and warrants that: (a) Client is at least eighteen (18) years of age and has full legal capacity to enter this Agreement; (b) Client is the owner of the dog(s) or has the full legal authority of the owner to deliver the dog(s) to the Company and bind the owner to this Agreement; and (c) no third party has any ownership interest, lien, or claim that would interfere with the Company's temporary custody of the dog(s).</p>

              {/* Section 4 */}
              <h4 style={sectionHeader}>4. Release of Liability</h4>
              <p>To the fullest extent permitted by Indiana law, Client hereby releases, waives, and discharges the Company from any and all liability, claims, or causes of action, including those arising from the ordinary negligence of the Company (whether active or passive), for:</p>
              <div style={bullet}>Injury, illness, or death of Client's dog(s) during or after any session, during the Transfer of Control period, or during any emergency veterinary transport;</div>
              <div style={bullet}>Personal injury to Client while entering, inside, or exiting the Van;</div>
              <div style={{ ...bullet, marginBottom: '12px' }}>Any loss, damage, or escape occurring during the Transfer of Control period.</div>
              <p>Nothing in this Agreement releases the Company from liability for gross negligence or willful misconduct. The exclusion of gross negligence from this release is intentional and does not limit the enforceability of this release as to ordinary negligence.</p>
              <p style={subHeader}>Limitation of Liability:</p>
              <p style={{ marginTop: 0 }}>In no event shall the Company's total liability to Client exceed the total fees paid by Client in the 30 days preceding the incident giving rise to the claim.</p>

              {/* Section 5 */}
              <h4 style={sectionHeader}>5. Indemnification</h4>
              <p>Client agrees to indemnify and hold harmless the Company from any and all claims, costs, and expenses (including reasonable attorneys' fees) arising from:</p>
              <div style={bullet}>Bites or injuries inflicted by Client's dog upon Company staff, contractors, or third parties;</div>
              <div style={bullet}>Damage to Company equipment or the Van caused by Client's dog, including but not limited to damage to the slatmill, belts, or interior of the Van;</div>
              <div style={bullet}>Client's material misrepresentation of the dog's health, vaccination, or bite history;</div>
              <div style={bullet}>Any third-party claim arising from Client's dog's behavior while in Company custody, where that behavior was known or reasonably foreseeable by Client and not disclosed;</div>
              <div style={{ ...bullet, marginBottom: '12px' }}>Any damage caused by the dog to Client's property, Client's driveway, lawn, landscaping, or third-party property during the Transfer of Control period, unless such damage results from the Company's gross negligence.</div>

              {/* Section 6 */}
              <h4 style={sectionHeader}>6. Emergency Medical Authorization</h4>
              <p>In the event of a medical emergency involving Client's dog while in the Company's care, the Company is authorized to seek veterinary care at Client's designated veterinarian (listed in the Dog Information Form) or, if unavailable, at the nearest emergency veterinary facility. The Company will make reasonable efforts to contact Client before authorizing treatment. If Client is unreachable and delay would risk the dog's health or life, the Company is authorized to act in the dog's best interest without prior approval.</p>
              <p>Client agrees to be responsible for all costs related to such emergency treatment. Any such costs not collected at the time of treatment will be invoiced to Client and are due within fourteen (14) days of the invoice date.</p>

              {/* Section 7 */}
              <h4 style={sectionHeader}>7. Booking, Payment & Cancellation</h4>
              <p style={subHeader}>Prepaid Online Booking:</p>
              <p style={{ marginTop: 0 }}>All sessions must be booked and paid in full in advance through the Company's website. No session is confirmed until full payment is received and a booking confirmation is issued. The Company does not accept cash, checks, or in-person payments. Current pricing is displayed on the Company's website at the time of booking and may be updated at any time; confirmed and paid sessions are always honored at the rate paid.</p>

              <p style={subHeader}>Cancellation:</p>
              <p style={{ marginTop: 0 }}>48 hours' notice is required to cancel or reschedule. Cancellations with less than 48 hours' notice, and no-shows, are charged the full session fee. Cancellations due to documented veterinary illness, written veterinary confirmation, which may be provided by email to the Company's designated address, required within 48 hours, are exempt from the cancellation fee.</p>

              <p style={subHeader}>Equipment Refusal:</p>
              <p style={{ marginTop: 0 }}>If a dog refuses to use the slatmill or otherwise does not participate during the 30-minute session window, the full session fee still applies.</p>

              <p style={subHeader}>Failed Payment:</p>
              <p style={{ marginTop: 0 }}>If a payment method on file fails and is not rectified within 48 hours of notification by the Company, all future sessions booked by Client will be cancelled without further notice.</p>

              <p style={subHeader}>Chargebacks:</p>
              <p style={{ marginTop: 0 }}>If a payment is disputed through Client's card issuer and the Company determines the dispute to be unwarranted, the Company reserves the right to suspend service pending resolution and to recover any associated chargeback fees from Client.</p>

              {/* Section 8 */}
              <h4 style={sectionHeader}>8. Photo & Media Release</h4>
              <p>Client grants permission to photograph or record Client's dog(s) during sessions for use in marketing materials and social media. The Company will make reasonable efforts to avoid capturing Client's full home address, license plates, or other personally identifying information in published content. Client acknowledges that incidental background features of the Handoff Location or Van exterior may appear in published media and agrees this does not constitute a violation of this Agreement, provided Client's full address is not deliberately featured.</p>

              {/* Section 9 */}
              <h4 style={sectionHeader}>9. General Provisions</h4>
              <p style={subHeader}>Governing Law & Disputes:</p>
              <p style={{ marginTop: 0 }}>This Agreement is governed by Indiana law. Any dispute arising from this Agreement shall be resolved by binding arbitration administered under AAA Consumer Arbitration Rules in Hamilton County, Indiana. The prevailing party is entitled to recover reasonable attorneys' fees. Either party may elect to bring an individual claim in small claims court in lieu of arbitration, provided the claim falls within that court's jurisdictional limits.</p>

              <p style={subHeader}>Force Majeure:</p>
              <p style={{ marginTop: 0 }}>The Company is not in breach for failure to perform due to severe weather, vehicle breakdown, staff illness, or other events beyond its reasonable control. No cancellation fee applies to sessions cancelled by the Company under these circumstances.</p>

              <p style={subHeader}>Termination:</p>
              <p style={{ marginTop: 0 }}>Either party may terminate this Agreement with 14 days' written notice. The Company may terminate immediately and without notice for cause, including a dog bite on staff, material misrepresentation by Client, or repeated cancellation policy violations. Written notice for purposes of termination may be delivered by email to the address on file in Client's account, or through a notification via the Company's Online Booking Platform.</p>

              <p style={subHeader}>Amendment:</p>
              <p style={{ marginTop: 0 }}>The Company may amend this Agreement by providing Client with thirty (30) days' written notice (as defined under Termination above) of the updated terms. Continued booking of sessions after the effective date of any amendment constitutes Client's acceptance of the revised Agreement.</p>

              <p style={subHeader}>Electronic Signatures:</p>
              <p style={{ marginTop: 0 }}>This Agreement may be executed electronically. An electronic signature, including via DocuSign or an equivalent platform, is as legally binding as a handwritten signature under Indiana's Uniform Electronic Transactions Act.</p>

              <p style={subHeader}>Severability:</p>
              <p style={{ marginTop: 0 }}>If any provision of this Agreement is found unenforceable, the remaining provisions continue in full effect.</p>

              <p style={subHeader}>No Waiver:</p>
              <p style={{ marginTop: 0 }}>Failure to enforce any provision on one occasion does not waive the right to enforce it in the future.</p>

              <p style={subHeader}>Entire Agreement:</p>
              <p style={{ marginTop: 0 }}>This Agreement, together with the Dog Information Form completed during online account registration, constitutes the entire agreement between the parties and supersedes all prior representations or understandings.</p>

              <p style={subHeader}>Successors and Assigns:</p>
              <p style={{ marginTop: 0 }}>This Agreement shall be binding upon and inure to the benefit of the parties and their respective heirs, successors, permitted assigns, and legal representatives. Client may not assign or transfer this Agreement or any rights hereunder without the prior written consent of the Company. The Company may assign this Agreement in connection with a merger, acquisition, or sale of all or substantially all of its business assets without Client's consent.</p>

              <p style={subHeader}>Insurance:</p>
              <p style={{ marginTop: 0, marginBottom: 0 }}>The Company endeavors to maintain appropriate commercial liability and auto insurance for its mobile operations, but Client's assumption of risk and release of liability remain in full force regardless of the Company's insurance status.</p>
            </div>

            {/* Signature Form */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>

              {/* Closing statement */}
              <div style={{ background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: '700', lineHeight: 1.7 }}>
                  BY SIGNING BELOW, CLIENT CONFIRMS THEY HAVE READ THIS AGREEMENT IN ITS ENTIRETY, UNDERSTAND ITS TERMS, AND AGREE TO BE BOUND BY THEM, INCLUDING THE RELEASE OF LIABILITY IN SECTION 4, THE INDEMNIFICATION OBLIGATIONS IN SECTION 5, AND THE MANDATORY ARBITRATION CLAUSE IN SECTION 9.
                </p>
              </div>

              <form onSubmit={handleSubmit}>

                {/* Media opt-out */}
                <div style={{ marginBottom: '20px', background: '#f8f9fc', border: '1.5px solid #e5e8f0', borderRadius: '12px', padding: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={optOutMedia} onChange={e => setOptOutMedia(e.target.checked)}
                      style={{ marginTop: '2px', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0, accentColor: '#2c5a9e' }} />
                    <span style={{ color: '#555', fontSize: '13px', lineHeight: '1.7' }}>
                      <strong style={{ color: '#1a1a2e' }}>Section 8, Media Opt-Out:</strong> Check here to OPT OUT of the Photo & Media Release. Opt-out takes effect within 5 business days of receipt. Previously published content need not be removed.
                    </span>
                  </label>
                </div>

                {/* Emergency spending limit */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>
                    Section 6, Emergency Veterinary Pre-Authorized Spending Limit ($)
                  </label>
                  <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px', lineHeight: 1.6 }}>
                    If left blank, the Company will act in the best interest of your dog's life and safety with no spending limit.
                  </p>
                  <input type="number" value={spendingLimit} onChange={e => setSpendingLimit(e.target.value)}
                    placeholder="Leave blank for no limit" min="0" step="1"
                    style={{ ...inputStyle, maxWidth: '260px' }} />
                </div>

                {/* Typed name */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>
                    Type your full name to sign: <span style={{ color: '#f88124', fontWeight: '800' }}>"{ownerName}"</span>
                  </label>
                  <input type="text" value={typedName} onChange={e => setTypedName(e.target.value)} required
                    placeholder="Type your full name exactly as shown above" style={inputStyle} />
                </div>

                {/* Agree checkbox */}
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
                  Signed electronically — timestamp and IP address recorded server-side.
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}