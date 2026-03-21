'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import {
  ArrowLeft, PawPrint, Activity, Flame, Navigation, Clock,
  Zap, TrendingUp, ChevronDown, ChevronUp, Calendar, Trophy
} from 'lucide-react'

export default function DogOverallStats() {
  const { id } = useParams()
  const [dog, setDog] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [chartMetric, setChartMetric] = useState<'avg_speed_mph' | 'distance_miles' | 'calories'>('avg_speed_mph')

  useEffect(() => {
    const init = async () => {
      // Verify this dog belongs to the logged-in owner
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
      if (!ownerData) { window.location.href = '/dashboard'; return }

      const { data: dogData } = await supabase
        .from('dogs')
        .select('*, leaderboard_settings(city)')
        .eq('id', id)
        .eq('owner_id', ownerData.id)
        .single()

      if (!dogData) { window.location.href = '/dashboard'; return }
      setDog(dogData)

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', id)
        .order('session_date', { ascending: false })

      setSessions(sessionData || [])
      setLoading(false)
    }
    init()
  }, [id])

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

  if (!dog) return null

  // ── Lifetime stats ──────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMiles = sessions.reduce((s, x) => s + (x.distance_miles || 0), 0)
  const totalCalories = sessions.reduce((s, x) => s + (x.calories || 0), 0)
  const totalMinutes = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0)
  const speedSessions = sessions.filter(s => s.avg_speed_mph)
  const avgSpeed = speedSessions.length ? speedSessions.reduce((s, x) => s + x.avg_speed_mph, 0) / speedSessions.length : null
  const peakEver = sessions.reduce((max, s) => Math.max(max, s.peak_speed_mph || 0), 0)

  // Personal bests
  const pbSpeed = sessions.reduce((max, s) => Math.max(max, s.peak_speed_mph || 0), 0)
  const pbDistance = sessions.reduce((max, s) => Math.max(max, s.distance_miles || 0), 0)
  const pbDuration = sessions.reduce((max, s) => Math.max(max, s.duration_minutes || 0), 0)

  // ── Chart ───────────────────────────────────────────────────
  const chartSessions = [...sessions].filter(s => s[chartMetric] && s[chartMetric] > 0).reverse().slice(-12)
  const chartValues = chartSessions.map(s => s[chartMetric] || 0)
  const chartMax = Math.max(...chartValues, 0.01)

  // ── Helpers ─────────────────────────────────────────────────
  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const metricLabel = { avg_speed_mph: 'Avg Speed (mph)', distance_miles: 'Distance (mi)', calories: 'Calories' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        .session-row:hover { background: #fafbff !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          {dog.photo_url
            ? <img src={dog.photo_url} alt={dog.name} style={{ width: '76px', height: '76px', borderRadius: '16px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            : <div style={{ width: '76px', height: '76px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={32} color="rgba(255,255,255,0.5)" /></div>
          }
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: 'white' }}>{dog.name}</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}</p>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Overall Stats</p>
          </div>
        </div>

        {/* ── Lifetime Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: <Calendar size={16} color="#2c5a9e" />, label: 'Sessions', value: totalSessions, unit: '' },
            { icon: <Navigation size={16} color="#2c5a9e" />, label: 'Total Miles', value: totalMiles.toFixed(2), unit: 'mi' },
            { icon: <Flame size={16} color="#f88124" />, label: 'Calories', value: totalCalories.toLocaleString(), unit: 'cal' },
            { icon: <Clock size={16} color="#2c5a9e" />, label: 'Time', value: fmtDuration(totalMinutes), unit: '' },
            { icon: <Activity size={16} color="#2c5a9e" />, label: 'Avg Speed', value: avgSpeed ? avgSpeed.toFixed(1) : '—', unit: avgSpeed ? 'mph' : '' },
            { icon: <Zap size={16} color="#f88124" />, label: 'All-Time Peak', value: peakEver ? peakEver.toFixed(1) : '—', unit: peakEver ? 'mph' : '' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1.5px solid #eef0f5', textAlign: 'center' }}>
              <div style={{ marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 }}>
                {stat.value}<span style={{ fontSize: '11px', fontWeight: '600', color: '#aaa', marginLeft: '2px' }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Personal Bests ── */}
        {(pbSpeed > 0 || pbDistance > 0) && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Trophy size={16} color="#f88124" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>Personal Bests</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Top Speed', value: pbSpeed ? `${pbSpeed.toFixed(1)} mph` : '—', color: '#f88124', bg: '#fff5e6' },
                { label: 'Longest Run', value: pbDistance ? `${pbDistance.toFixed(2)} mi` : '—', color: '#2c5a9e', bg: '#eef2fb' },
                { label: 'Longest Session', value: pbDuration ? fmtDuration(pbDuration) : '—', color: '#2c5a9e', bg: '#eef2fb' },
              ].map(pb => (
                <div key={pb.label} style={{ background: pb.bg, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: pb.color }}>{pb.value}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', marginTop: '4px' }}>{pb.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Progress Chart ── */}
        {chartSessions.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #eef0f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#2c5a9e" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>Progress Over Time</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['avg_speed_mph', 'distance_miles', 'calories'] as const).map(m => (
                  <button key={m} onClick={() => setChartMetric(m)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: 'none', background: chartMetric === m ? '#2c5a9e' : '#f0f2f7', color: chartMetric === m ? 'white' : '#666', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    {m === 'avg_speed_mph' ? 'Speed' : m === 'distance_miles' ? 'Miles' : 'Calories'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', position: 'relative' }}>
              {chartSessions.map((s) => {
                const val = s[chartMetric] || 0
                const barH = chartMax > 0 ? Math.max((val / chartMax) * 90, 4) : 4
                const label = chartMetric === 'calories' ? `${Math.round(val)}` : chartMetric === 'avg_speed_mph' ? `${val.toFixed(1)}` : `${val.toFixed(2)}`
                return (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#2c5a9e', marginBottom: '4px' }}>{label}</span>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg, #2c5a9e, #1a3d6e)', borderRadius: '4px 4px 0 0', height: `${barH}px` }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: '#bbb', fontWeight: '600' }}>{chartSessions[0] ? fmtDate(chartSessions[0].session_date) : ''}</span>
              <span style={{ fontSize: '10px', color: '#bbb', fontWeight: '600' }}>{metricLabel[chartMetric]} · last {chartSessions.length} sessions</span>
              <span style={{ fontSize: '10px', color: '#bbb', fontWeight: '600' }}>{chartSessions.at(-1) ? fmtDate(chartSessions.at(-1)!.session_date) : ''}</span>
            </div>
          </div>
        )}

        {/* ── Session History ── */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #eef0f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Activity size={16} color="#2c5a9e" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>Session History</h3>
            <span style={{ marginLeft: 'auto', background: '#f0f2f7', color: '#888', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>{totalSessions} total</span>
          </div>

          {sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '32px 0', fontSize: '14px' }}>No sessions logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((s: any) => {
                const isOpen = expandedSession === s.id
                const hasSlatmill = s.avg_speed_mph || s.distance_miles
                return (
                  <div key={s.id} style={{ border: '1.5px solid #eef0f5', borderRadius: '14px', overflow: 'hidden' }}>
                    {/* Row — tapping opens detail OR expands inline */}
                    <div className="session-row" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'white', transition: 'background 0.15s' }}>
                      <div onClick={() => window.location.href = `/sessions/${s.id}`} role="button" style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{fmtDate(s.session_date)}</span>
                          {hasSlatmill && <span style={{ background: '#eef2fb', color: '#2c5a9e', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>📡 Sensor Data</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {fmtDuration(s.duration_minutes || 0)}</span>
                          {s.distance_miles ? <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Navigation size={11} /> {s.distance_miles.toFixed(2)} mi</span> : null}
                          {s.avg_speed_mph ? <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={11} /> {s.avg_speed_mph.toFixed(1)} mph avg</span> : null}
                          {s.calories ? <span style={{ fontSize: '12px', color: '#f88124', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={11} /> {s.calories} cal</span> : null}
                        </div>
                      </div>
                      <a href={`/sessions/${s.id}`} style={{ color: '#2c5a9e', fontSize: '12px', fontWeight: '700', textDecoration: 'none', background: '#eef2fb', padding: '6px 12px', borderRadius: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        View →
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}