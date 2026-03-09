'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Timer, MapPin, Flame, Activity, BarChart2, FileText, Wifi } from 'lucide-react'

export default function SessionDetail() {
  const params = useParams()
  const id = params.id as string
  const [session, setSession] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [previousSessions, setPreviousSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.from('sessions').select('*, dogs(name, breed, photo_url, owner_id)').eq('id', id).single()
      if (!sessionData) { setLoading(false); return }
      setSession(sessionData)
      setDog(sessionData.dogs)
      const { data: prevSessions } = await supabase.from('sessions').select('*').eq('dog_id', sessionData.dog_id).neq('id', id).order('session_date', { ascending: false }).limit(5)
      setPreviousSessions(prevSessions || [])
      setLoading(false)
    }
    init()
  }, [id])

  const formatDate = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const getIntensityColor = (score: number) => score >= 80 ? '#f88124' : score >= 50 ? '#f59e0b' : '#22c55e'
  const getIntensityLabel = (score: number) => score >= 80 ? 'High' : score >= 50 ? 'Moderate' : 'Light'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#f88124', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7' }}>
      <p style={{ color: '#888', fontSize: '15px' }}>Session not found.</p>
    </div>
  )

  const comparisonStats = [
    { label: 'Distance', key: 'distance_miles', unit: 'mi', current: session.distance_miles },
    { label: 'Calories', key: 'calories_burned', unit: 'cal', current: session.calories_burned },
    { label: 'Steps', key: 'steps', unit: '', current: session.steps },
    { label: 'Activity Score', key: 'activity_score', unit: '', current: session.activity_score },
    { label: 'Peak Intensity', key: 'peak_intensity', unit: '', current: session.peak_intensity },
  ]

  const mainStats = [
    { icon: <Timer size={22} color="#2c5a9e" />, label: 'Duration', value: session.duration_minutes ? `${session.duration_minutes} min` : '—', bg: '#eef2fb' },
    { icon: <MapPin size={22} color="#2c5a9e" />, label: 'Distance', value: session.distance_miles ? `${session.distance_miles} mi` : '—', bg: '#eef2fb' },
    { icon: <Flame size={22} color="#f88124" />, label: 'Calories', value: session.calories_burned ? `${session.calories_burned}` : '—', bg: '#fff5e6' },
    { icon: <Activity size={22} color="#2c5a9e" />, label: 'Steps', value: session.steps ? session.steps.toLocaleString() : '—', bg: '#eef2fb' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-white.png" alt="The Canine Gym" style={{ height: '40px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Hero card */}
        <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,107,53,0.1)' }} />
          {dog?.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} style={{ width: '80px', height: '80px', borderRadius: '18px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PawPrint size={36} color="rgba(255,255,255,0.5)" />
            </div>
          )}
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: 'white' }}>{dog?.name}</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{formatDate(session.session_date)}</p>
          </div>
        </div>

        {/* FitBark notice */}
        {!session.distance_miles && !session.calories_burned && (
          <div style={{ background: 'white', border: '1.5px solid #ffe08a', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', background: '#fff5e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wifi size={20} color="#f88124" />
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: '800', color: '#1a1a2e', fontSize: '14px' }}>FitBark Data Coming Soon</p>
              <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Once FitBark is synced, this session will show full activity data.</p>
            </div>
          </div>
        )}

        {/* Main stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {mainStats.map(stat => (
            <div key={stat.label} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a2e' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', fontWeight: '600' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Intensity scores */}
        {(session.activity_score || session.peak_intensity) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Activity Score', value: session.activity_score },
              { label: 'Peak Intensity', value: session.peak_intensity },
            ].filter(s => s.value).map(({ label, value }) => (
              <div key={label} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '800', color: '#1a1a2e', fontSize: '13px' }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: getIntensityColor(value), lineHeight: 1 }}>{value}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', background: '#f0f2f7', borderRadius: '4px', overflow: 'hidden', marginBottom: '5px' }}>
                      <div style={{ height: '100%', width: `${value}%`, background: getIntensityColor(value), borderRadius: '4px' }} />
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' }}>{getIntensityLabel(value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison */}
        {previousSessions.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>vs Previous Sessions</span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {comparisonStats.map(stat => {
                const prevValues = previousSessions.map(s => s[stat.key] || 0).filter(v => v > 0)
                const prevAvg = prevValues.length > 0 ? prevValues.reduce((a, b) => a + b, 0) / prevValues.length : null
                const current = stat.current || 0
                const diff = prevAvg ? ((current - prevAvg) / prevAvg * 100).toFixed(0) : null
                if (!current && !prevAvg) return null
                const maxVal = Math.max(current, prevAvg || 0) * 1.2 || 1
                return (
                  <div key={stat.key} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '13px' }}>{stat.label}</span>
                      {diff !== null && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: Number(diff) >= 0 ? '#22c55e' : '#dc3545', background: Number(diff) >= 0 ? '#f0fdf4' : '#ffeaea', padding: '2px 8px', borderRadius: '20px' }}>
                          {Number(diff) >= 0 ? '↑' : '↓'} {Math.abs(Number(diff))}% vs avg
                        </span>
                      )}
                    </div>
                    {[{ label: 'This session', value: current, color: '#f88124' }, { label: 'Avg', value: prevAvg, color: '#2c5a9e' }].filter(r => r.value).map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: '#888', width: '76px', fontWeight: '600' }}>{row.label}</span>
                        <div style={{ flex: 1, height: '10px', background: '#f0f2f7', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${((row.value as number) / maxVal) * 100}%`, background: row.color, borderRadius: '5px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a2e', width: '56px', textAlign: 'right' }}>
                          {typeof row.value === 'number' ? (Number.isInteger(row.value) ? row.value : row.value.toFixed(1)) : '—'} {stat.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Session Notes</span>
            </div>
            <p style={{ margin: 0, color: '#555', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.7, borderLeft: '3px solid #e5e8f0', paddingLeft: '14px' }}>"{session.notes}"</p>
          </div>
        )}

      </div>
    </div>
  )
}