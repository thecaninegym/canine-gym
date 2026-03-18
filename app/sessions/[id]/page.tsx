'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { PawPrint, ArrowLeft, Timer, MapPin, Flame, Zap, Gauge, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function SessionDetail() {
  const params = useParams()
  const id = params.id as string
  const [session, setSession] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [previousSessions, setPreviousSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const diffBadge = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null
    const pct = ((current - previous) / previous * 100)
    const isUp = pct >= 0
    const color = isUp ? '#22c55e' : '#dc3545'
    const bg = isUp ? '#f0fdf4' : '#ffeaea'
    const Icon = isUp ? TrendingUp : TrendingDown
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color, background: bg, padding: '3px 8px', borderRadius: '20px' }}>
        <Icon size={11} /> {Math.abs(pct).toFixed(0)}% vs avg
      </span>
    )
  }

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

  const hasSlatmillData = session.distance_miles || session.avg_speed_mph || session.peak_speed_mph

  // Previous session averages
  const prevWithData = previousSessions.filter(s => s.distance_miles || s.avg_speed_mph)
  const prevAvgDistance = avg(prevWithData.map((s: any) => s.distance_miles).filter(Boolean))
  const prevAvgSpeed = avg(prevWithData.map((s: any) => s.avg_speed_mph).filter(Boolean))
  const prevAvgCalories = avg(prevWithData.map((s: any) => s.calories).filter(Boolean))
  const prevAvgDuration = avg(previousSessions.map((s: any) => s.duration_minutes).filter(Boolean))

  // Chart data — last 6 sessions + current, oldest to newest
  const chartSessions = [...previousSessions].reverse().concat([session])
  const maxDist = Math.max(...chartSessions.map(s => s.distance_miles || 0), 0.1)
  const maxSpeed = Math.max(...chartSessions.map(s => s.avg_speed_mph || 0), 1)

  const CHART_H = 80
  const CHART_W = 280
  const BAR_W = Math.floor(CHART_W / chartSessions.length) - 4

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillBar { from { width: 0%; } to { width: var(--w); } }
        * { box-sizing: border-box; }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(248,129,36,0.12)' }} />
          {dog?.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} style={{ width: '80px', height: '80px', borderRadius: '18px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PawPrint size={36} color="rgba(255,255,255,0.5)" />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: 'white' }}>{dog?.name}</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{formatDate(session.session_date)}</p>
          </div>
        </div>

        {/* Main stat cards */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: <Timer size={20} color="#2c5a9e" />, label: 'Duration', value: session.duration_minutes ? `${typeof session.duration_minutes === 'number' ? session.duration_minutes % 1 === 0 ? session.duration_minutes : session.duration_minutes.toFixed(1) : session.duration_minutes}`, unit: 'min', bg: '#eef2fb', accent: '#2c5a9e' },
            { icon: <MapPin size={20} color="#2c5a9e" />, label: 'Distance', value: session.distance_miles ? session.distance_miles.toFixed(2) : '—', unit: session.distance_miles ? 'mi' : '', bg: '#eef2fb', accent: '#2c5a9e' },
            { icon: <Gauge size={20} color="#2c5a9e" />, label: 'Avg Speed', value: session.avg_speed_mph ? session.avg_speed_mph.toFixed(1) : '—', unit: session.avg_speed_mph ? 'mph' : '', bg: '#eef2fb', accent: '#2c5a9e' },
            { icon: <Zap size={20} color="#f88124" />, label: 'Peak Speed', value: session.peak_speed_mph ? session.peak_speed_mph.toFixed(1) : '—', unit: session.peak_speed_mph ? 'mph' : '', bg: '#fff5e6', accent: '#f88124' },
            { icon: <Flame size={20} color="#f88124" />, label: 'Calories', value: session.calories ? Math.round(session.calories) : '—', unit: session.calories ? 'cal' : '', bg: '#fff5e6', accent: '#f88124' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', padding: '16px 12px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: stat.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 }}>{stat.value}</div>
              {stat.unit && <div style={{ fontSize: '11px', color: stat.accent, fontWeight: '700', marginTop: '2px' }}>{stat.unit}</div>}
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Speed visual — avg vs peak gauge */}
        {hasSlatmillData && session.avg_speed_mph && session.peak_speed_mph && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gauge size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Speed Breakdown</span>
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
                    <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '5px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa', fontWeight: '600' }}>
                Running at {((session.avg_speed_mph / session.peak_speed_mph) * 100).toFixed(0)}% of peak speed on average
              </p>
            </div>
          </div>
        )}

        {/* Session history chart */}
        {chartSessions.length > 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>Session History</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', fontWeight: '600' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#2c5a9e' }} /> Distance
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', fontWeight: '600' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f88124' }} /> Avg Speed
                </span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <svg width="100%" viewBox={`0 0 ${Math.max(CHART_W, chartSessions.length * (BAR_W + 4) + 20)} ${CHART_H + 40}`} style={{ display: 'block' }}>
                {chartSessions.map((s, i) => {
                  const isCurrent = s.id === session.id
                  const distH = s.distance_miles ? (s.distance_miles / maxDist) * CHART_H : 0
                  const speedH = s.avg_speed_mph ? (s.avg_speed_mph / maxSpeed) * CHART_H : 0
                  const x = i * (BAR_W + 4) + 2
                  const halfBar = Math.floor(BAR_W / 2) - 2
                  const dateLabel = s.session_date ? new Date(s.session_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                  return (
                    <g key={s.id}>
                      {/* Distance bar */}
                      <rect x={x} y={CHART_H - distH} width={halfBar} height={distH} rx="3"
                        fill={isCurrent ? '#2c5a9e' : '#c8d4f0'} />
                      {/* Speed bar */}
                      <rect x={x + halfBar + 2} y={CHART_H - speedH} width={halfBar} height={speedH} rx="3"
                        fill={isCurrent ? '#f88124' : '#fdd9b5'} />
                      {/* Date label */}
                      <text x={x + BAR_W / 2} y={CHART_H + 16} textAnchor="middle"
                        style={{ fontSize: '9px', fill: isCurrent ? '#1a1a2e' : '#aaa', fontWeight: isCurrent ? '800' : '600', fontFamily: 'inherit' }}>
                        {isCurrent ? 'Today' : dateLabel}
                      </text>
                    </g>
                  )
                })}
                {/* Baseline */}
                <line x1="0" y1={CHART_H} x2={chartSessions.length * (BAR_W + 4)} y2={CHART_H} stroke="#e5e8f0" strokeWidth="1" />
              </svg>
            </div>
            {maxDist === 0.1 && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#bbb', textAlign: 'center' }}>Distance data will appear once the slatmill sensor is active</p>}
          </div>
        )}

        {/* Comparison vs previous */}
        {prevWithData.length > 0 && hasSlatmillData && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={17} color="#2c5a9e" />
              </div>
              <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>vs Previous Sessions</span>
              <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '600' }}>avg of last {prevWithData.length}</span>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Distance', current: session.distance_miles, prevAvg: prevAvgDistance, unit: 'mi', color: '#2c5a9e' },
                { label: 'Avg Speed', current: session.avg_speed_mph, prevAvg: prevAvgSpeed, unit: 'mph', color: '#2c5a9e' },
                { label: 'Calories', current: session.calories, prevAvg: prevAvgCalories, unit: 'cal', color: '#f88124' },
                { label: 'Duration', current: session.duration_minutes, prevAvg: prevAvgDuration, unit: 'min', color: '#2c5a9e' },
              ].filter(s => s.current && s.prevAvg).map(stat => {
                const maxVal = Math.max(stat.current!, stat.prevAvg!) * 1.15
                return (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '13px' }}>{stat.label}</span>
                      {diffBadge(stat.current, stat.prevAvg)}
                    </div>
                    {[
                      { label: 'This session', value: stat.current!, color: stat.color },
                      { label: 'Your avg', value: stat.prevAvg!, color: '#d0d8e8' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#aaa', width: '72px', fontWeight: '700', flexShrink: 0 }}>{row.label}</span>
                        <div style={{ flex: 1, height: '10px', background: '#f0f2f7', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(row.value / maxVal) * 100}%`, background: row.color, borderRadius: '5px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a2e', width: '52px', textAlign: 'right', flexShrink: 0 }}>
                          {typeof row.value === 'number' && row.value % 1 !== 0 ? row.value.toFixed(1) : Math.round(row.value)} {stat.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
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
