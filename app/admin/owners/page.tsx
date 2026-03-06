'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AllOwners() {
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase
        .from('owners')
        .select('*, dogs(name)')
        .order('name')
      setOwners(data || [])
      setLoading(false)
    }
    fetchOwners()
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym — Admin</h1>
        <a href="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>
      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#003087', margin: 0 }}>All Owners ({owners.length})</h2>
          <a href="/admin/owners/new" style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>+ Add Owner</a>
        </div>
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {owners.map(owner => (
              <div key={owner.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#003087', margin: '0 0 4px 0', fontSize: '18px' }}>{owner.name}</h3>
                  <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>📞 {owner.phone} · ✉️ {owner.email}</p>
                  {owner.address && <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px' }}>📍 {owner.address}</p>}
                  <p style={{ color: '#999', margin: 0, fontSize: '13px' }}>🐾 {owner.dogs?.map((d: any) => d.name).join(', ') || 'No dogs yet'}</p>
                </div>
                <a href={`/admin/owners/${owner.id}/edit`} style={{ backgroundColor: '#003087', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>Edit</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}