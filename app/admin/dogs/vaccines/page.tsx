'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { PawPrint, ArrowLeft, ShieldCheck, ShieldAlert, Clock, CheckCircle, X, Calendar, Stethoscope, Phone, MapPin } from 'lucide-react'

const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as const, color: '#1a1a2e', fontFamily: 'inherit', outline: 'none' }
const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: '700' as const, color: '#555', fontSize: '12px' }

export default function AdminVaccineReview() {
  const [vaccines, setVaccines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<Record<string, any>>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== 'dev@thecaninegym.com') { window.location.href = '/'; return }
      fetchVaccines()
    }
    init()
  }, [])

  const fetchVaccines = async () => {
    const { data } = await supabase
      .from('dog_vaccines')
      .select('*, dogs(id, name, breed, photo_url, vet_name, vet_clinic, vet_phone, owners(name, email))')
      .order('uploaded_at', { ascending: false })
    setVaccines(data || [])
    const init: Record<string, any> = {}
    for (const v of (data || [])) {
      init[v.id] = {
        rabies_exp: v.rabies_exp || '', dhpp_exp: v.dhpp_exp || '',
        bordetella_exp: v.bordetella_exp || '', leptospira_exp: v.leptospira_exp || '',
        influenza_exp: v.influenza_exp || '', other_vaccines: v.other_vaccines || '',
        admin_notes: v.admin_notes || '',
      }
    }
    setReviewData(init)
    setLoading(false)
  }

  const handleApprove = async (vaccine: any) => {
    setSaving(vaccine.id)
    const rd = reviewData[vaccine.id] || {}
    await supabase.from('dog_vaccines').update({
      status: 'approved', reviewed_at: new Date().toISOString(),
      rabies_exp: rd.rabies_exp || null, dhpp_exp: rd.dhpp_exp || null,
      bordetella_exp: rd.bordetella_exp || null, leptospira_exp: rd.leptospira_exp || null,
      influenza_exp: rd.influenza_exp || null, other_vaccines: rd.other_vaccines || null,
      admin_notes: rd.admin_notes || null,
    }).eq('id', vaccine.id)
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_approved', to: vaccine.dogs?.owners?.email, data: { ownerName: vaccine.dogs?.owners?.name?.split(' ')[0] || 'there', dogName: vaccine.dogs?.name } })
    })
    setSuccess(vaccine.id)
    setTimeout(() => setSuccess(null), 3000)
    fetchVaccines()
    setSaving(null)
  }

  const handleReject = async (vaccine: any) => {
    const notes = reviewData[vaccine.id]?.admin_notes
    if (!notes) { alert('Please add a rejection note explaining what the owner needs to fix.'); return }
    setSaving(vaccine.id)
    await supabase.from('dog_vaccines').update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: notes }).eq('id', vaccine.id)
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_rejected', to: vaccine.dogs?.owners?.email, data: { ownerName: vaccine.dogs?.owners?.name?.split(' ')[0] || 'there', dogName: vaccine.dogs?.name, reason: notes } })
    })
    setSaving(null)
    fetchVaccines()
  }

  const pending = vaccines.filter(v => v.status === 'pending')
  const reviewed = vaccines.filter(v => v.status !== 'pending')

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

  const renderCard = (vaccine: any, isPending: boolean) => {
    const dog = vaccine.dogs
    const owner = dog?.owners
    const rd = reviewData[vaccine.id] || {}
    const badge = vaccine.status === 'approved'
      ? { color: '#28a745', bg: '#d4edda', icon: <ShieldCheck size={12} />, label: 'Approved' }
      : vaccine.status === 'rejected'
      ? { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={12} />, label: 'Rejected' }
      : { color: '#856404', bg: '#fff3cd', icon: <Clock size={12} />, label: 'Pending Review' }

    return (
      <div key={vaccine.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: isPending ? '2px solid #ffc107' : '1.5px solid #eef0f5' }}>
        {/* Dog + owner header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {dog?.photo_url
              ? <img src={dog.photo_url} alt={dog.name} style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={22} color="#ccc" /></div>
            }
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: '800', color: '#1a1a2e', fontSize: '17px' }}>{dog?.name}</p>
              <p style={{ margin: '0 0 2px', color: '#888', fontSize: '13px' }}>{dog?.breed} · {owner?.name}</p>
              <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>{owner?.email} · Submitted {new Date(vaccine.uploaded_at).toLocaleDateString()}</p>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: badge.bg, color: badge.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
            {badge.icon} {badge.label}
          </span>
        </div>

        {/* Vet info */}
        {(dog?.vet_name || dog?.vet_clinic || dog?.vet_phone) && (
          <div style={{ background: '#f8f9fc', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {dog.vet_clinic && <span style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#aaa" /> {dog.vet_clinic}</span>}
            {dog.vet_name && <span style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={12} color="#aaa" /> {dog.vet_name}</span>}
            {dog.vet_phone && <span style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#aaa" /> {dog.vet_phone}</span>}
          </div>
        )}

        {/* Submitted photo */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '700', color: '#555', fontSize: '12px', margin: '0 0 8px' }}>Submitted Photo</p>
          {vaccine.photo_url?.toLowerCase().includes('.pdf') ? (
            <a href={vaccine.photo_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ width: '100%', maxWidth: '400px', height: '120px', border: '2px solid #2c5a9e', borderRadius: '12px', background: '#eef2fb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px' }}>📄</div>
                <span style={{ color: '#2c5a9e', fontWeight: '700', fontSize: '13px' }}>Click to open PDF</span>
              </div>
            </a>
          ) : (
            <a href={vaccine.photo_url} target="_blank" rel="noopener noreferrer">
              <img src={vaccine.photo_url} alt="vaccine record" style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '10px', border: '1.5px solid #eef0f5', objectFit: 'contain', cursor: 'pointer', display: 'block' }} />
            </a>
          )}
          <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0 0' }}>Click to open full size</p>
        </div>

        {/* Expiry dates */}
        {(isPending || vaccine.status === 'approved') && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: '700', color: '#555', fontSize: '12px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} /> Enter Expiration Dates (leave blank if not applicable)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {[
                { key: 'rabies_exp', label: 'Rabies' },
                { key: 'dhpp_exp', label: 'DHPP' },
                { key: 'bordetella_exp', label: 'Bordetella' },
                { key: 'leptospira_exp', label: 'Leptospira' },
                { key: 'influenza_exp', label: 'Influenza' },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type="date" value={rd[f.key] || ''}
                    onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], [f.key]: e.target.value } }))}
                    style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={labelStyle}>Other Vaccines / Notes</label>
              <input type="text" value={rd.other_vaccines || ''} placeholder="e.g. Lyme exp 6/2026"
                onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], other_vaccines: e.target.value } }))}
                style={inputStyle} />
            </div>
          </div>
        )}

        {/* Admin notes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>{isPending ? 'Rejection Reason (required if rejecting)' : 'Admin Notes'}</label>
          <textarea value={rd.admin_notes || ''} rows={2}
            placeholder={isPending ? 'Tell the owner what needs to be fixed...' : 'Any notes...'}
            onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], admin_notes: e.target.value } }))}
            style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>

        {success === vaccine.id && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            <CheckCircle size={16} /> Approved and client notified!
          </div>
        )}

        {isPending && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleApprove(vaccine)} disabled={saving === vaccine.id}
              style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #28a745, #34c759)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> {saving === vaccine.id ? 'Saving...' : 'Approve'}
            </button>
            <button onClick={() => handleReject(vaccine)} disabled={saving === vaccine.id}
              style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #dc3545, #e85d6d)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <X size={16} /> {saving === vaccine.id ? 'Saving...' : 'Reject'}
            </button>
          </div>
        )}
        {!isPending && vaccine.status === 'approved' && (
          <button onClick={() => handleApprove(vaccine)} disabled={saving === vaccine.id}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            {saving === vaccine.id ? 'Saving...' : 'Update Expiry Dates'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin/dogs" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> All Dogs
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>Vaccine Records</h2>
            {pending.length > 0 && <p style={{ color: '#856404', margin: 0, fontSize: '13px', fontWeight: '700' }}>{pending.length} record{pending.length !== 1 ? 's' : ''} awaiting review</p>}
          </div>
        </div>

        {vaccines.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1.5px solid #eef0f5' }}>
            <p style={{ color: '#aaa', margin: 0 }}>No vaccine records submitted yet.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#856404', margin: '0 0 16px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} /> Pending Review ({pending.length})
            </h3>
            {pending.map(v => renderCard(v, true))}
          </div>
        )}

        {reviewed.length > 0 && (
          <div>
            <h3 style={{ color: '#888', margin: '0 0 16px', fontSize: '15px', fontWeight: '700' }}>Previously Reviewed</h3>
            {reviewed.map(v => renderCard(v, false))}
          </div>
        )}
      </div>
    </div>
  )
}