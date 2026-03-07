'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Plus, Activity, Shield, ShieldCheck, Clock, ShieldAlert, Stethoscope } from 'lucide-react'

export default function AllDogs() {
  const [dogs, setDogs] = useState<any[]>([])
  const [vaccines, setVaccines] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym — Admin</h1>
        </div>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={28} color="#003087" />
            <h2 style={{ color: '#003087', margin: 0 }}>All Dogs ({dogs.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a href="/admin/dogs/vaccines"
              style={{ backgroundColor: pendingCount > 0 ? '#fff3cd' : '#f0f0f0', color: pendingCount > 0 ? '#856404' : '#555', border: pendingCount > 0 ? '2px solid #ffc107' : '2px solid transparent', padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} /> Vaccine Reviews
              {pendingCount > 0 && (
                <span style={{ backgroundColor: '#FF6B35', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  {pendingCount}
                </span>
              )}
            </a>
            <a href="/admin/dogs/new" style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Dog
            </a>
          </div>
        </div>

        {pendingCount > 0 && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#856404', fontWeight: '600', fontSize: '14px' }}>
              <Clock size={16} /> {pendingCount} vaccine record{pendingCount !== 1 ? 's' : ''} waiting for your review
            </div>
            <a href="/admin/dogs/vaccines" style={{ backgroundColor: '#856404', color: 'white', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>Review Now →</a>
          </div>
        )}

        {loading ? <p style={{ color: '#666' }}>Loading...</p> : dogs.length === 0 ? <p style={{ color: '#666' }}>No dogs yet.</p> : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {dogs.map((dog: any) => {
              const badge = getVaccineBadge(dog.id)
              return (
                <div key={dog.id} style={{ backgroundColor: 'white', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {dog.photo_url
                      ? <img src={dog.photo_url} alt={dog.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={24} color="#ccc" /></div>
                    }
                    <div>
                      <h3 style={{ color: '#003087', margin: '0 0 3px 0', fontSize: '18px' }}>{dog.name}</h3>
                      <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '13px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''} · {dog.leaderboard_settings?.city}</p>
                      <p style={{ color: '#888', margin: '0 0 6px 0', fontSize: '13px' }}>Owner: {dog.owners?.name} · {dog.owners?.email}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: badge.bg, color: badge.color, padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          {badge.icon} {badge.label}
                        </div>
                        {(dog.vet_name || dog.vet_clinic) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#555', fontSize: '11px' }}>
                            <Stethoscope size={11} /> {dog.vet_clinic || dog.vet_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href="/admin/dogs/vaccines"
                      style={{ backgroundColor: badge.label === 'Pending Review' ? '#fff3cd' : '#f0f4ff', color: badge.label === 'Pending Review' ? '#856404' : '#003087', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', border: badge.label === 'Pending Review' ? '1px solid #ffc107' : 'none' }}>
                      <Shield size={13} /> Vaccines
                    </a>
                    <a href={`/admin/sessions/new?dog=${dog.id}`} style={{ backgroundColor: '#FF6B35', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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