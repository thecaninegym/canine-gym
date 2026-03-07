'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { PawPrint, ArrowLeft, ShieldCheck, ShieldAlert, Clock, CheckCircle, X, Calendar, Stethoscope, Phone, MapPin } from 'lucide-react'

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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>

  const renderCard = (vaccine: any, isPending: boolean) => {
    const dog = vaccine.dogs
    const owner = dog?.owners
    const rd = reviewData[vaccine.id] || {}
    const badge = vaccine.status === 'approved'
      ? { color: '#28a745', bg: '#d4edda', icon: <ShieldCheck size={13} />, label: 'Approved' }
      : vaccine.status === 'rejected'
      ? { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={13} />, label: 'Rejected' }
      : { color: '#856404', bg: '#fff3cd', icon: <Clock size={13} />, label: 'Pending Review' }

    return (
      <div key={vaccine.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: isPending ? '2px solid #ffc107' : '1px solid #e5e5e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {dog?.photo_url
              ? <img src={dog.photo_url} alt={dog.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PawPrint size={24} color="#ccc" /></div>
            }
            <div>
              <h3 style={{ color: '#003087', margin: '0 0 3px 0', fontSize: '18px' }}>{dog?.name}</h3>
              <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>{dog?.breed} · Owner: {owner?.name}</p>
              <p style={{ color: '#999', margin: 0, fontSize: '13px' }}>{owner?.email} · Submitted {new Date(vaccine.uploaded_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: badge.bg, color: badge.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            {badge.icon} {badge.label}
          </div>
        </div>

        {(dog?.vet_name || dog?.vet_clinic || dog?.vet_phone) && (
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {dog.vet_clinic && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {dog.vet_clinic}</span>}
            {dog.vet_name && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={12} /> {dog.vet_name}</span>}
            {dog.vet_phone && <span style={{ color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {dog.vet_phone}</span>}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '700', color: '#333', fontSize: '13px', margin: '0 0 8px 0' }}>Submitted Photo</p>
          {vaccine.photo_url?.toLowerCase().includes('.pdf') ? (
            <a href={vaccine.photo_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ width: '100%', maxWidth: '400px', height: '120px', border: '2px solid #003087', borderRadius: '10px', backgroundColor: '#f0f4ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px' }}>📄</div>
                <span style={{ color: '#003087', fontWeight: '700', fontSize: '13px' }}>Click to open PDF</span>
              </div>
            </a>
          ) : (
            <a href={vaccine.photo_url} target="_blank" rel="noopener noreferrer">
              <img src={vaccine.photo_url} alt="vaccine record" style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '8px', border: '1px solid #ddd', objectFit: 'contain', cursor: 'pointer', display: 'block' }} />
            </a>
          )}
          <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0 0' }}>Click to open full size</p>
        </div>

        {(isPending || vaccine.status === 'approved') && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: '700', color: '#333', fontSize: '13px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} /> Enter Expiration Dates (leave blank if not applicable)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {[{ key: 'rabies_exp', label: 'Rabies' }, { key: 'dhpp_exp', label: 'DHPP' }, { key: 'bordetella_exp', label: 'Bordetella' }, { key: 'leptospira_exp', label: 'Leptospira' }, { key: 'influenza_exp', label: 'Influenza' }].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#555', fontSize: '12px' }}>{f.label}</label>
                  <input type="date" value={rd[f.key] || ''}
                    onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], [f.key]: e.target.value } }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', color: '#000' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#555', fontSize: '12px' }}>Other Vaccines / Notes</label>
              <input type="text" value={rd.other_vaccines || ''} placeholder="e.g. Lyme exp 6/2026"
                onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], other_vaccines: e.target.value } }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', color: '#000' }} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
            {isPending ? 'Rejection Reason (required if rejecting)' : 'Admin Notes'}
          </label>
          <textarea value={rd.admin_notes || ''} rows={2}
            placeholder={isPending ? 'Tell the owner what needs to be fixed...' : 'Any notes...'}
            onChange={e => setReviewData(prev => ({ ...prev, [vaccine.id]: { ...prev[vaccine.id], admin_notes: e.target.value } }))}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', color: '#000', resize: 'vertical' }} />
        </div>

        {success === vaccine.id && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>
            <CheckCircle size={16} /> Approved and client notified!
          </div>
        )}

        {isPending && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleApprove(vaccine)} disabled={saving === vaccine.id}
              style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> {saving === vaccine.id ? 'Saving...' : 'Approve'}
            </button>
            <button onClick={() => handleReject(vaccine)} disabled={saving === vaccine.id}
              style={{ flex: 1, padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <X size={16} /> {saving === vaccine.id ? 'Saving...' : 'Reject'}
            </button>
          </div>
        )}
        {!isPending && vaccine.status === 'approved' && (
          <button onClick={() => handleApprove(vaccine)} disabled={saving === vaccine.id}
            style={{ padding: '10px 20px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            {saving === vaccine.id ? 'Saving...' : 'Update Expiry Dates'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <a href="/admin/dogs" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> All Dogs
        </a>
      </nav>
      <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <ShieldCheck size={28} color="#003087" />
          <div>
            <h2 style={{ color: '#003087', margin: 0 }}>Vaccine Records</h2>
            {pending.length > 0 && <p style={{ color: '#856404', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600' }}>{pending.length} record{pending.length !== 1 ? 's' : ''} awaiting review</p>}
          </div>
        </div>
        {vaccines.length === 0 && <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}><p style={{ color: '#666' }}>No vaccine records submitted yet.</p></div>}
        {pending.length > 0 && <div style={{ marginBottom: '32px' }}><h3 style={{ color: '#856404', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Pending Review ({pending.length})</h3>{pending.map(v => renderCard(v, true))}</div>}
        {reviewed.length > 0 && <div><h3 style={{ color: '#555', margin: '0 0 16px 0', fontSize: '16px' }}>Previously Reviewed</h3>{reviewed.map(v => renderCard(v, false))}</div>}
      </div>
    </div>
  )
}