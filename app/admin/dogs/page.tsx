'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Plus, Activity, Shield, ShieldCheck, Clock, ShieldAlert, Stethoscope, MapPin } from 'lucide-react'

export default function AllDogs() {
  const [dogs, setDogs] = useState<any[]>([])
  const [vaccines, setVaccines] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchDogs = async () => {
      const { data } = await supabase.from('dogs').select('*, owners(id, name, email, phone), leaderboard_settings(city)').order('name')
      setDogs(data || [])
      if (data && data.length > 0) {
        const dogIds = data.map((d: any) => d.id)
        const { data: vaccineData } = await supabase.from('dog_vaccines').select('*').in('dog_id', dogIds).order('uploaded_at', { ascending: false })
        if (vaccineData) {
          const vMap: Record<string, any> = {}
          let pending = 0
          for (const v of vaccineData) {
            if (!vMap[v.dog_id]) { vMap[v.dog_id] = v; if (v.status === 'pending') pending++ }
          }
          setVaccines(vMap)
          setPendingCount(pending)
        }
      }
      setLoading(false)
    }
    fetchDogs()
  }, [])

  const getVaccineBadge = (dogId: string) => {
    const v = vaccines[dogId]
    if (!v) return { color: '#dc3545', bg: '#f8d7da', icon: <Shield size={11} />, label: 'No Vaccines' }
    if (v.status === 'approved') return { color: '#28a745', bg: '#d4edda', icon: <ShieldCheck size={11} />, label: 'Approved' }
    if (v.status === 'pending') return { color: '#856404', bg: '#fff3cd', icon: <Clock size={11} />, label: 'Pending Review' }
    return { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={11} />, label: 'Rejected' }
  }

  const filtered = dogs.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.owners?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-white.png" alt="The Canine Gym" style={{ height: '40px', width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: '15px' }}>· Admin</span>
        </div>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>All Dogs</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>{dogs.length} registered</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a href="/admin/dogs/vaccines" style={{ background: pendingCount > 0 ? '#fff3cd' : 'white', color: pendingCount > 0 ? '#856404' : '#555', border: pendingCount > 0 ? '2px solid #ffc107' : '1.5px solid #e5e8f0', padding: '9px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} /> Vaccine Reviews
              {pendingCount > 0 && (
                <span style={{ background: '#f88124', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                  {pendingCount}
                </span>
              )}
            </a>
            <a href="/admin/dogs/new" style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
              <Plus size={15} /> Add Dog
            </a>
          </div>
        </div>

        {/* Pending banner */}
        {pendingCount > 0 && (
          <div style={{ background: '#fff3cd', border: '1.5px solid #ffc107', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#856404', fontWeight: '600', fontSize: '14px' }}>
              <Clock size={16} /> {pendingCount} vaccine record{pendingCount !== 1 ? 's' : ''} waiting for your review
            </div>
            <a href="/admin/dogs/vaccines" style={{ background: '#856404', color: 'white', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>Review Now →</a>
          </div>
        )}

        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by dog or owner name…"
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', outline: 'none', fontFamily: 'inherit' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>No dogs found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.map((dog: any) => {
              const badge = getVaccineBadge(dog.id)
              return (
                <div key={dog.id} style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {dog.photo_url
                      ? <img src={dog.photo_url} alt={dog.name} style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={22} color="#ccc" /></div>
                    }
                    <div>
                      <p style={{ margin: '0 0 3px', fontWeight: '800', color: '#1a1a2e', fontSize: '16px' }}>{dog.name}</p>
                      <p style={{ margin: '0 0 3px', color: '#888', fontSize: '13px' }}>
                        {dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}
                        {dog.leaderboard_settings?.city && <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} />{dog.leaderboard_settings.city}</span>}
                      </p>
                      <p style={{ margin: '0 0 6px', color: '#aaa', fontSize: '12px' }}>👤 {dog.owners?.name} · {dog.owners?.email}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, color: badge.color, padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          {badge.icon} {badge.label}
                        </span>
                        {(dog.vet_name || dog.vet_clinic) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '11px' }}>
                            <Stethoscope size={11} /> {dog.vet_clinic || dog.vet_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href="/admin/dogs/vaccines"
                      style={{ background: badge.label === 'Pending Review' ? '#fff3cd' : '#eef2fb', color: badge.label === 'Pending Review' ? '#856404' : '#2c5a9e', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', border: badge.label === 'Pending Review' ? '1.5px solid #ffc107' : '1.5px solid #c8d4f0' }}>
                      <Shield size={13} /> Vaccines
                    </a>
                    <a href={`/admin/sessions/new?dog=${dog.id}`} style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(255,107,53,0.25)' }}>
                      <Activity size={13} /> Log Session
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}