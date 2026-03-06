'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Plus, Activity } from 'lucide-react'

export default function AllDogs() {
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDogs = async () => {
      const { data } = await supabase.from('dogs').select('*, owners(name, email, phone), leaderboard_settings(city)').order('name')
      setDogs(data || [])
      setLoading(false)
    }
    fetchDogs()
  }, [])

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={28} color="#003087" />
            <h2 style={{ color: '#003087', margin: 0 }}>All Dogs ({dogs.length})</h2>
          </div>
          <a href="/admin/dogs/new" style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Dog
          </a>
        </div>
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : dogs.length === 0 ? (
          <p style={{ color: '#666' }}>No dogs yet. Add your first dog!</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {dogs.map((dog: any) => (
              <div key={dog.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PawPrint size={24} color="#ccc" />
                    </div>
                  )}
                  <div>
                    <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '20px' }}>{dog.name}</h3>
                    <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}</p>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Owner: {dog.owners?.name} · {dog.leaderboard_settings?.city}</p>
                  </div>
                </div>
                <a href={`/admin/sessions/new?dog=${dog.id}`} style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} /> Log Session
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}