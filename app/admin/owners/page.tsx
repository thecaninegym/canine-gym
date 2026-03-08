'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Plus, Phone, Mail, MapPin, CheckCircle, AlertTriangle, Pencil } from 'lucide-react'

export default function AllOwners() {
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase.from('owners').select('*, dogs(name), waiver_signed, waiver_signed_at').order('name')
      setOwners(data || [])
      setLoading(false)
    }
    fetchOwners()
  }, [])

  const filtered = owners.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      <nav style={{ background: 'linear-gradient(135deg, #001a4d 0%, #003087 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PawPrint size={20} color="#FF6B35" />
          </div>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>The Canine Gym <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>· Admin</span></span>
        </div>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>All Owners</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>{owners.length} clients</p>
          </div>
          <a href="/admin/owners/new" style={{ background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)', color: 'white', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}>
            <Plus size={15} /> Add Owner
          </a>
        </div>

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', outline: 'none', fontFamily: 'inherit' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.map(owner => (
              <div key={owner.id} style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#1a1a2e', fontSize: '16px' }}>{owner.name}</p>
                    {owner.waiver_signed ? (
                      <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle size={10} /> Waiver Signed
                      </span>
                    ) : (
                      <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={10} /> No Waiver
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    {owner.phone && <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#aaa" /> {owner.phone}</span>}
                    <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} color="#aaa" /> {owner.email}</span>
                    {owner.address && <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#aaa" /> {owner.address}</span>}
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PawPrint size={11} color="#ccc" /> {owner.dogs?.map((d: any) => d.name).join(', ') || 'No dogs yet'}
                  </p>
                  {owner.waiver_signed && (
                    <a href={`/admin/owners/${owner.id}/waiver`} style={{ color: '#003087', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: '600' }}>
                      View waiver →
                    </a>
                  )}
                </div>
                <a href={`/admin/owners/${owner.id}/edit`} style={{ background: 'linear-gradient(135deg, #003087, #0052cc)', color: 'white', padding: '9px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
                  <Pencil size={13} /> Edit
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}