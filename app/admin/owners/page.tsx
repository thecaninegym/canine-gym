'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Plus, Phone, Mail, MapPin, CheckCircle, AlertTriangle, Pencil } from 'lucide-react'

export default function AllOwners() {
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase.from('owners').select('*, dogs(name), waiver_signed, waiver_signed_at').order('name')
      setOwners(data || [])
      setLoading(false)
    }
    fetchOwners()
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
      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PawPrint size={28} color="#003087" />
            <h2 style={{ color: '#003087', margin: 0 }}>All Owners ({owners.length})</h2>
          </div>
          <a href="/admin/owners/new" style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Owner
          </a>
        </div>
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {owners.map(owner => (
              <div key={owner.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#003087', margin: '0 0 6px 0', fontSize: '18px' }}>{owner.name}</h3>
                  <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} color="#999" /> {owner.phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} color="#999" /> {owner.email}</span>
                  </p>
                  {owner.address && (
                    <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#999" /> {owner.address}
                    </p>
                  )}
                  <p style={{ color: '#999', margin: '0 0 4px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PawPrint size={13} color="#ccc" /> {owner.dogs?.map((d: any) => d.name).join(', ') || 'No dogs yet'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    {owner.waiver_signed ? (
                      <a href={`/admin/owners/${owner.id}/waiver`} style={{ color: '#28a745', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} color="#28a745" /> Waiver signed {new Date(owner.waiver_signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — View →
                      </a>
                    ) : (
                      <span style={{ color: '#dc3545', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} color="#dc3545" /> Waiver not signed
                      </span>
                    )}
                  </p>
                </div>
                <a href={`/admin/owners/${owner.id}/edit`} style={{ backgroundColor: '#003087', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pencil size={14} /> Edit
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}