'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import {
  ArrowLeft, PawPrint, Activity, Flame, Navigation, Clock,
  Zap, TrendingUp, ChevronDown, ChevronUp, Shield, ShieldCheck,
  ShieldAlert, MapPin, Stethoscope, Calendar, User, Mail, Phone
} from 'lucide-react'

export default function DogProfile() {
  const { id } = useParams()
  const [dog, setDog] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [vaccine, setVaccine] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [chartMetric, setChartMetric] = useState<'avg_speed_mph' | 'distance_miles' | 'calories'>('avg_speed_mph')

  useEffect(() => {
    const fetch = async () => {
      const [{ data: dogData }, { data: sessionData }, { data: vaccineData }] = await Promise.all([
        supabase.from('dogs').select('*, owners(id, name, email, phone), leaderboard_settings(city)').eq('id', id).single(),
        supabase.from('sessions').select('*').eq('dog_id', id).order('session_date', { ascending: false }),
        supabase.from('dog_vaccines').select('*').eq('dog_id', id).order('uploaded_at', { ascending: false }).limit(1).single(),
      ])
      setDog(dogData)
      setSessions(sessionData || [])
      setVaccine(vaccineData)
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )
  if (!dog) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <p style={{ color: '#aaa' }}>Dog not found.</p>
    </div>
  )

  // ── Lifetime stats ──────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMiles = sessions.reduce((s, x) => s + (x.distance_miles || 0), 0)
  const totalCalories = sessions.reduce((s, x) => s + (x.calories || 0), 0)
  const totalMinutes = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0)
  const avgSpeed = sessions.filter(s => s.avg_speed_mph).length
    ? sessions.filter(s => s.avg_speed_mph).reduce((s, x) => s + x.avg_speed_mph, 0) / sessions.filter(s => s.avg_speed_mph).length
    : null
  const peakEver = sessions.reduce((max, s) => Math.max(max, s.peak_speed_mph || 0), 0)

  // ── Mini bar chart data ─────────────────────────────────────
  const chartSessions = [...sessions].reverse().slice(-12) // last 12 chronological
  const chartValues = chartSessions.map(s => s[chartMetric] || 0)
  const chartMax = Math.max(...chartValues, 0.01)

  // ── Helpers ─────────────────────────────────────────────────
  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60), m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const vaccineBadge = () => {
    if (!vaccine) return { color: '#dc3545', bg: '#f8d7da', icon: <Shield size={12} />, label: 'No Vaccines' }
    if (vaccine.status === 'approved') return { color: '#28a745', bg: '#d4edda', icon: <ShieldCheck size={12} />, label: 'Approved' }
    if (vaccine.status === 'pending') return { color: '#856404', bg: '#fff3cd', icon: <Clock size={12} />, label: 'Pending Review' }
    return { color: '#dc3545', bg: '#f8d7da', icon: <ShieldAlert size={12} />, label: 'Rejected' }
  }
  const vBadge = vaccineBadge()

  const metricLabel = { avg_speed_mph: 'Avg Speed (mph)', distance_miles: 'Distance (mi)', calories: 'Calories' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        .session-row:hover { background: #fafbff !important; }
        .chart-bar { transition: opacity 0.15s; }
        .chart-bar:hover { opacity: 0.75; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/admin/dogs" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> All Dogs
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* ── Dog Header Card ── */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #eef0f5' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Photo */}
            {dog.photo_url
              ? <img src={dog.photo_url} alt={dog.name} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PawPrint size={32} color="#ccc" /></div>
            }

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a1a2e' }}>{dog.name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: vBadge.bg, color: vBadge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                  {vBadge.icon} {vBadge.label}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                {dog.breed}{dog.weight ? ` · ${dog.weight} lbs` : ''}{dog.age ? ` · ${dog.age} yrs` : ''}
              </p>
              {dog.leaderboard_settings?.city && (
                <p style={{ margin: '0 0 12px', color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} /> {dog.leaderboard_settings.city}
                </p>
              )}

              {/* Owner */}
              <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#444', fontWeight: '600' }}>
                  <User size={13} color="#2c5a9e" /> {dog.owners?.name}
                </span>
                <a href={`mailto:${dog.owners?.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2c5a9e', textDecoration: 'none', fontWeight: '600' }}>
                  <Mail size={13} /> {dog.owners?.email}
                </a>
                {dog.owners?.phone && (
                  <a href={`tel:${dog.owners?.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2c5a9e', textDecoration: 'none', fontWeight: '600' }}>
                    <Phone size={13} /> {dog.owners?.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <a href={`/admin/sessions/new?dog=${dog.id}`} style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(248,129,36,0.3)', whiteSpace: 'nowrap' }}>
                <Activity size={14} /> Log Session
              </a>
              <a href="/admin/dogs/vaccines" style={{ background: '#eef2fb', color: '#2c5a9e', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid #c8d4f0', whiteSpace: 'nowrap' }}>
                <Shield size={14} /> Vaccines
              </a>
            </div>
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
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 }}>{stat.value}<span style={{ fontSize: '11px', fontWeight: '600', color: '#aaa', marginLeft: '2px' }}>{stat.unit}</span></div>
              <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Progress Chart ── */}
        {sessions.some(s => s.avg_speed_mph || s.distance_miles || s.calories) && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #eef0f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#2c5a9e" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>Progress Over Time</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['avg_speed_mph', 'distance_miles', 'calories'] as const).map(m => (
                  <button key={m} onClick={() => setChartMetric(m)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: 'none', background: chartMetric === m ? '#2c5a9e' : '#f0f2f7', color: chartMetric === m ? 'white' : '#666', transition: 'all 0.15s' }}>
                    {m === 'avg_speed_mph' ? 'Speed' : m === 'distance_miles' ? 'Miles' : 'Calories'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
              {chartSessions.map((s, i) => {
                const val = s[chartMetric] || 0
                const pct = chartMax > 0 ? (val / chartMax) * 100 : 0
                return (
                  <div key={s.id} className="chart-bar" title={`${fmtDate(s.session_date)}: ${val.toFixed(chartMetric === 'calories' ? 0 : 2)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'default' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg, #2c5a9e, #1a3d6e)', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, minHeight: '4px' }} />
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
                    {/* Row */}
                    <div className="session-row" onClick={() => setExpandedSession(isOpen ? null : s.id)} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}>
                      <div style={{ flex: 1 }}>
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
                      {isOpen ? <ChevronUp size={16} color="#aaa" /> : <ChevronDown size={16} color="#aaa" />}
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div style={{ padding: '16px 18px', background: '#f8f9fc', borderTop: '1.5px solid #eef0f5' }}>
                        {hasSlatmill && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: s.notes ? '14px' : 0 }}>
                            {[
                              { label: 'Avg Speed', value: s.avg_speed_mph ? `${s.avg_speed_mph.toFixed(1)} mph` : '—' },
                              { label: 'Peak Speed', value: s.peak_speed_mph ? `${s.peak_speed_mph.toFixed(1)} mph` : '—' },
                              { label: 'Distance', value: s.distance_miles ? `${s.distance_miles.toFixed(2)} mi` : '—' },
                              { label: 'Calories', value: s.calories ? `${s.calories} cal` : '—' },
                              { label: 'Active Time', value: s.active_seconds ? fmtDuration(s.active_seconds / 60) : '—' },
                              { label: 'Pace Consistency', value: s.pace_consistency != null ? `${s.pace_consistency.toFixed(2)} σ` : '—' },
                              { label: 'Dog Weight', value: s.dog_weight_lbs ? `${s.dog_weight_lbs} lbs` : '—' },
                            ].map(stat => (
                              <div key={stat.label} style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', border: '1.5px solid #eef0f5' }}>
                                <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>{stat.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a2e' }}>{stat.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {s.notes && (
                          <div style={{ background: 'white', borderRadius: '10px', padding: '12px 14px', border: '1.5px solid #eef0f5' }}>
                            <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', marginBottom: '4px' }}>NOTES</div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: 1.5 }}>{s.notes}</p>
                          </div>
                        )}
                        {!hasSlatmill && !s.notes && (
                          <p style={{ margin: 0, color: '#bbb', fontSize: '13px', textAlign: 'center' }}>No additional data for this session.</p>
                        )}
                      </div>
                    )}
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