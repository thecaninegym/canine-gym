'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Timer, MapPin, Flame, Zap, Gauge, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react'

type Tab = 'duration' | 'distance' | 'avg_speed' | 'peak_speed' | 'calories' | 'weight'

export default function SessionDetail() {
  const params = useParams()
  const id = params.id as string
  const [session, setSession] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [previousSessions, setPreviousSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('duration')
  const [openTip, setOpenTip] = useState<string | null>(null)
  const chartScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [activeTab, session])

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*, dogs(name, breed, photo_url, owner_id)')
        .eq('id', id)
        .single()
      if (!sessionData) { setLoading(false); return }
      setSession(sessionData)
      setDog(sessionData.dogs)
      const { data: prevSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', sessionData.dog_id)
        .neq('id', id)
        .order('session_date', { ascending: false })
        .limit(6)
      setPreviousSessions(prevSessions || [])
      setLoading(false)
    }
    init()
  }, [id])

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

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

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7' }}>
      <p style={{ color: '#888', fontSize: '15px' }}>Session not found.</p>
    </div>
  )

  const hasSlatmillData = session.distance_miles || session.avg_speed_mph || session.peak_speed_mph

  // Effort score — 0 to 100
  // Weighted: active ratio (40pts) + speed consistency (30pts) + speed vs peak (30pts)
  const calcEffortScore = (s: any): number | null => {
    if (!s.avg_speed_mph || !s.peak_speed_mph || !s.duration_minutes) return null
    const totalSeconds = s.duration_minutes * 60
    const activeRatio = s.active_seconds ? Math.min(s.active_seconds / totalSeconds, 1) : 0.7 // default 70% if no data
    const speedRatio = Math.min(s.avg_speed_mph / s.peak_speed_mph, 1)
    // Pace consistency: lower std dev is better. Assume 2.0 mph std dev = 0 score, 0 = 100 score
    const consistencyScore = s.pace_consistency !== null && s.pace_consistency !== undefined
      ? Math.max(0, 1 - (s.pace_consistency / 2.0))
      : 0.6 // default if no data
    const score = (activeRatio * 40) + (consistencyScore * 30) + (speedRatio * 30)
    return Math.round(Math.min(100, Math.max(0, score)))
  }

  const effortScore = calcEffortScore(session)

  const getEffortLabel = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: '#f88124' }
    if (score >= 70) return { label: 'Strong', color: '#2c5a9e' }
    if (score >= 55) return { label: 'Good', color: '#22c55e' }
    if (score >= 40) return { label: 'Moderate', color: '#f59e0b' }
    return { label: 'Light', color: '#94a3b8' }
  }

  // Active vs rest
  const totalSeconds = session.duration_minutes ? Math.round(session.duration_minutes * 60) : null
  const activeSeconds = session.active_seconds || null
  const restSeconds = totalSeconds && activeSeconds ? totalSeconds - activeSeconds : null
  const activeRatio = totalSeconds && activeSeconds ? (activeSeconds / totalSeconds) * 100 : null

  // Pace consistency label
  const getPaceLabel = (stdDev: number) => {
    if (stdDev < 0.3) return { label: 'Very Consistent', color: '#22c55e' }
    if (stdDev < 0.6) return { label: 'Consistent', color: '#2c5a9e' }
    if (stdDev < 1.0) return { label: 'Variable', color: '#f59e0b' }
    return { label: 'Highly Variable', color: '#dc3545' }
  }

  // Chart setup
  const chartSessions = [...previousSessions].reverse().concat([session])

  const tabs: { key: Tab; label: string; unit: string; color: string; getValue: (s: any) => number | null }[] = [
    { key: 'duration',   label: 'Duration',   unit: 'min', color: '#2c5a9e', getValue: s => s.duration_minutes || null },
    { key: 'distance',   label: 'Distance',   unit: 'mi',  color: '#2c5a9e', getValue: s => s.distance_miles || null },
    { key: 'avg_speed',  label: 'Avg Speed',  unit: 'mph', color: '#2c5a9e', getValue: s => s.avg_speed_mph || null },
    { key: 'peak_speed', label: 'Peak Speed', unit: 'mph', color: '#f88124', getValue: s => s.peak_speed_mph || null },
    { key: 'calories',   label: 'Calories',   unit: 'cal', color: '#f88124', getValue: s => s.calories || null },
    { key: 'weight',     label: 'Weight',     unit: 'lbs', color: '#2c5a9e', getValue: s => s.dog_weight_lbs || null },
  ]

  const activeTabDef = tabs.find(t => t.key === activeTab)!
  const chartValues = chartSessions.map(s => ({ session: s, value: activeTabDef.getValue(s) }))
  const maxVal = Math.max(...chartValues.map(c => c.value || 0), 0.01)
  const prevValues = previousSessions.map(s => activeTabDef.getValue(s)).filter((v): v is number => v !== null)
  const prevAvg = avg(prevValues)
  const currentVal = activeTabDef.getValue(session)
  const pctChange = currentVal && prevAvg ? ((currentVal - prevAvg) / prevAvg * 100) : null

  const CHART_H = 120
  const BAR_W = 60
  const CHART_TOTAL_W = chartSessions.length * (BAR_W + 10)

  const formatVal = (val: number | null, unit: string) => {
    if (val === null) return '—'
    if (unit === 'cal') return Math.round(val).toString()
    if (unit === 'min') return val % 1 === 0 ? val.toString() : val.toFixed(1)
    return val.toFixed(2)
  }

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const TipIcon = ({ id, text }: { id: string; text: string }) => (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpenTip(openTip === id ? null : id) }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#e5e8f0', color: '#888', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginLeft: '6px', flexShrink: 0, userSelect: 'none' }}>
        i
      </span>
      {openTip === id && (
        <span style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: 'white', fontSize: '12px', fontWeight: '500', lineHeight: 1.5, padding: '8px 12px', borderRadius: '8px', width: '220px', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
          {text}
          <span style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', background: '#1a1a2e', borderRadius: '1px', rotate: '45deg' }} />
        </span>
      )}
    </span>
  )

  return (
    <div onClick={() => setOpenTip(null)} style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        .tab-btn { transition: all 0.15s ease; cursor: pointer; white-space: nowrap; }
        .tab-btn:not(.tab-active):hover { background: #eef2fb !important; }
      `}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(248,129,36,0.12)' }} />
          {dog?.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} style={{ width: '80px', height: '80px', borderRadius: '18px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PawPrint size={36} color="rgba(255,255,255,0.5)" />
            </div>
          )}
          <div style={{ position: 'relative', flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: 'white' }}>{dog?.name}</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{formatDate(session.session_date)}</p>
          </div>
          {/* Effort Score badge in hero */}
          {effortScore !== null && (() => {
            const { label, color } = getEffortLabel(effortScore)
            return (
              <div style={{ textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{effortScore}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>effort</span>
                </div>
                <span style={{ display: 'block', marginTop: '5px', fontSize: '10px', fontWeight: '700', color, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px', position: 'relative' }}>
                  {label}
                  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
  <span
    onClick={(e) => { e.stopPropagation(); setOpenTip(openTip === 'effort' ? null : 'effort') }}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', color: 'white', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginLeft: '6px', flexShrink: 0 }}>
    i
  </span>
  {openTip === 'effort' && (
    <span style={{ position: 'absolute', top: '0px', right: '24px', background: '#1a1a2e', color: 'white', fontSize: '12px', fontWeight: '500', lineHeight: 1.5, padding: '8px 12px', borderRadius: '8px', width: '200px', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      A 0–100 score combining how active your dog was, how consistent their pace was, and how close their average speed was to their peak.
    </span>
  )}
</span>
                </span>
              </div>
            )
          })()}
        </div>

        {/* Stat cards */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: <Timer size={20} color="#2c5a9e" />, label: 'Duration', value: session.duration_minutes ? (session.duration_minutes % 1 === 0 ? String(session.duration_minutes) : session.duration_minutes.toFixed(1)) : '—', unit: session.duration_minutes ? 'min' : '', bg: '#eef2fb', accent: '#2c5a9e', tab: 'duration' as Tab },
            { icon: <MapPin size={20} color="#2c5a9e" />, label: 'Distance', value: session.distance_miles ? session.distance_miles.toFixed(2) : '—', unit: session.distance_miles ? 'mi' : '', bg: '#eef2fb', accent: '#2c5a9e', tab: 'distance' as Tab },
            { icon: <Gauge size={20} color="#2c5a9e" />, label: 'Avg Speed', value: session.avg_speed_mph ? session.avg_speed_mph.toFixed(1) : '—', unit: session.avg_speed_mph ? 'mph' : '', bg: '#eef2fb', accent: '#2c5a9e', tab: 'avg_speed' as Tab },
            { icon: <Zap size={20} color="#f88124" />, label: 'Peak Speed', value: session.peak_speed_mph ? session.peak_speed_mph.toFixed(1) : '—', unit: session.peak_speed_mph ? 'mph' : '', bg: '#fff5e6', accent: '#f88124', tab: 'peak_speed' as Tab },
            { icon: <Flame size={20} color="#f88124" />, label: 'Calories', value: session.calories ? Math.round(session.calories) : '—', unit: session.calories ? 'cal' : '', bg: '#fff5e6', accent: '#f88124', tab: 'calories' as Tab },
            { icon: <PawPrint size={20} color="#2c5a9e" />, label: 'Weight', value: session.dog_weight_lbs ? session.dog_weight_lbs.toFixed(1) : '—', unit: session.dog_weight_lbs ? 'lbs' : '', bg: '#eef2fb', accent: '#2c5a9e', tab: 'weight' as Tab },
          ].map(stat => (
            <div key={stat.label} onClick={() => setActiveTab(stat.tab)}
              style={{ background: activeTab === stat.tab ? 'linear-gradient(135deg, #001840, #2c5a9e)' : 'white', padding: '16px 12px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: activeTab === stat.tab ? '1.5px solid #2c5a9e' : '1.5px solid #eef0f5', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: '40px', height: '40px', background: activeTab === stat.tab ? 'rgba(255,255,255,0.2)' : stat.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                {activeTab === stat.tab ? (
                  <div style={{ filter: 'brightness(0) invert(1)' }}>{stat.icon}</div>
                ) : stat.icon}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: activeTab === stat.tab ? 'white' : '#1a1a2e', lineHeight: 1 }}>{stat.value}</div>
              {stat.unit && <div style={{ fontSize: '11px', color: activeTab === stat.tab ? 'rgba(255,255,255,0.7)' : stat.accent, fontWeight: '700', marginTop: '2px' }}>{stat.unit}</div>}
              <div style={{ fontSize: '11px', color: activeTab === stat.tab ? 'rgba(255,255,255,0.6)' : '#aaa', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabbed chart */}
        {chartSessions.length > 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={17} color="#2c5a9e" />
                </div>
                <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>{activeTabDef.label} Over Time</span>
              </div>
              {pctChange !== null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: pctChange >= 0 ? '#22c55e' : '#dc3545', background: pctChange >= 0 ? '#f0fdf4' : '#ffeaea', padding: '4px 10px', borderRadius: '20px' }}>
                  {pctChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(pctChange).toFixed(0)}% vs your average
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {tabs.map(tab => (
                <button key={tab.key} className={`tab-btn${activeTab === tab.key ? ' tab-active' : ''}`} onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit', background: activeTab === tab.key ? '#2c5a9e' : '#f0f2f7', color: activeTab === tab.key ? 'white' : '#888', flexShrink: 0 }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div ref={chartScrollRef} style={{ overflowX: 'auto' }}>
              <svg width={Math.max(500, CHART_TOTAL_W + 20)} viewBox={`0 0 ${Math.max(500, CHART_TOTAL_W + 20)} ${CHART_H + 50}`} style={{ display: 'block', minWidth: '100%' }}>
                {[0.25, 0.5, 0.75, 1].map(pct => (
                  <line key={pct} x1="0" y1={CHART_H - pct * CHART_H} x2={Math.max(400, CHART_TOTAL_W + 20)} y2={CHART_H - pct * CHART_H} stroke="#f0f2f7" strokeWidth="1" />
                ))}
                {chartValues.map((c, i) => {
                  const isCurrent = c.session.id === session.id
                  const barH = c.value ? (c.value / maxVal) * CHART_H : 0
                  const x = i * (BAR_W + 10) + 5
                  const dateLabel = c.session.session_date
                    ? new Date(c.session.session_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''
                  return (
                    <g key={c.session.id}>
                      <rect x={x} y={CHART_H - barH} width={BAR_W} height={barH} rx="4"
                        fill={isCurrent ? activeTabDef.color : activeTabDef.color === '#f88124' ? '#fdd9b5' : '#c8d4f0'} />
                      {c.value !== null && barH > 16 && (
                        <text x={x + BAR_W / 2} y={CHART_H - barH + 14} textAnchor="middle"
                          style={{ fontSize: '9px', fill: 'white', fontWeight: '800', fontFamily: 'inherit' }}>
                          {formatVal(c.value, activeTabDef.unit)}
                        </text>
                      )}
                      <text x={x + BAR_W / 2} y={CHART_H + 18} textAnchor="middle"
                        style={{ fontSize: '10px', fill: isCurrent ? '#1a1a2e' : '#aaa', fontWeight: isCurrent ? '800' : '600', fontFamily: 'inherit' }}>
                        {isCurrent ? 'Today' : dateLabel}
                      </text>
                      <text x={x + BAR_W / 2} y={CHART_H + 32} textAnchor="middle"
                        style={{ fontSize: '9px', fill: isCurrent ? activeTabDef.color : '#ccc', fontWeight: '700', fontFamily: 'inherit' }}>
                        {c.value !== null ? activeTabDef.unit : ''}
                      </text>
                    </g>
                  )
                })}
                <line x1="0" y1={CHART_H} x2={Math.max(400, CHART_TOTAL_W + 20)} y2={CHART_H} stroke="#e5e8f0" strokeWidth="1.5" />
                {prevAvg && (
                  <>
                    <line x1="0" y1={CHART_H - (prevAvg / maxVal) * CHART_H} x2={Math.max(400, CHART_TOTAL_W + 20)} y2={CHART_H - (prevAvg / maxVal) * CHART_H} stroke="#f88124" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x="6" y={CHART_H - (prevAvg / maxVal) * CHART_H - 4}
                      style={{ fontSize: '9px', fill: '#f88124', fontWeight: '700', fontFamily: 'inherit' }}>avg</text>
                  </>
                )}
              </svg>
            </div>

            {chartValues.every(c => c.value === null) && (
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#bbb', textAlign: 'center' }}>
                No {activeTabDef.label.toLowerCase()} data yet — will populate once sessions are logged
              </p>
            )}
          </div>
        )}

        {/* Performance Analysis — Pace Consistency + Active vs Rest */}
        {hasSlatmillData && (session.pace_consistency !== null || activeSeconds !== null) && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px', display: 'flex', alignItems: 'center' }}>Performance Analysis</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Pace Consistency */}
              {session.pace_consistency !== null && session.pace_consistency !== undefined && (() => {
                const { label, color } = getPaceLabel(session.pace_consistency)
                const consistencyPct = Math.max(0, Math.min(100, (1 - session.pace_consistency / 2.0) * 100))
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#555', display: 'inline-flex', alignItems: 'center' }}>Pace Consistency<TipIcon id="pace" text="Measures how steady your dog's speed was. Lower variation means a more even pace throughout the session." /></span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '700', color, background: color + '18', padding: '2px 8px', borderRadius: '10px' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a2e' }}>±{session.pace_consistency.toFixed(2)} mph</span>
                    </div>
                    <div style={{ height: '10px', background: '#f0f2f7', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${consistencyPct}%`, background: color, borderRadius: '5px' }} />
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                      Speed varied by ±{session.pace_consistency.toFixed(2)} mph from average — {label.toLowerCase()} pace
                    </p>
                  </div>
                )
              })()}

              {/* Active vs Rest */}
              {activeSeconds !== null && totalSeconds !== null && restSeconds !== null && activeRatio !== null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#555', display: 'inline-flex', alignItems: 'center' }}>Active vs Rest Time<TipIcon id="active" text="How much of the session the belt was actually moving vs. stopped. Higher active time means more continuous effort." /></span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2c5a9e' }}>{activeRatio.toFixed(0)}% active</span>
                  </div>
                  <div style={{ height: '10px', background: '#f0f2f7', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${activeRatio}%`, background: '#2c5a9e', borderRadius: '5px 0 0 5px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#2c5a9e', fontWeight: '700' }}>Active: {formatSeconds(activeSeconds)}</span>
                    <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '700' }}>Rest: {formatSeconds(restSeconds)}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Speed Breakdown */}
        {hasSlatmillData && session.avg_speed_mph && session.peak_speed_mph && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gauge size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px', display: 'inline-flex', alignItems: 'center' }}>Speed Breakdown<TipIcon id="speed" text="Compares your dog's average running speed to their fastest burst during the session." /></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Average Speed', value: session.avg_speed_mph, max: session.peak_speed_mph * 1.1, color: '#2c5a9e', unit: 'mph' },
                { label: 'Peak Speed', value: session.peak_speed_mph, max: session.peak_speed_mph * 1.1, color: '#f88124', unit: 'mph' },
              ].map(({ label, value, max, color, unit }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#555' }}>{label}</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color }}>{value.toFixed(1)} {unit}</span>
                  </div>
                  <div style={{ height: '10px', background: '#f0f2f7', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                Running at {((session.avg_speed_mph / session.peak_speed_mph) * 100).toFixed(0)}% of peak speed on average
              </p>
            </div>
          </div>
        )}

        {/* Trainer Notes */}
        {session.notes && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Trainer Notes</span>
            </div>
            <p style={{ margin: 0, color: '#555', fontStyle: 'italic', fontSize: '15px', lineHeight: 1.7, borderLeft: '3px solid #e5e8f0', paddingLeft: '14px' }}>"{session.notes}"</p>
          </div>
        )}

      </div>
    </div>
  )
}
