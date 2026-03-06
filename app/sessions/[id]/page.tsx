'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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

      // Get previous sessions for comparison
      const { data: prevSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('dog_id', sessionData.dog_id)
        .neq('id', id)
        .order('session_date', { ascending: false })
        .limit(5)

      setPreviousSessions(prevSessions || [])
      setLoading(false)
    }
    init()
  }, [id])

  const formatDate = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const getIntensityColor = (score: number) => {
    if (score >= 80) return '#FF6B35'
    if (score >= 50) return '#ffc107'
    return '#28a745'
  }

  const getIntensityLabel = (score: number) => {
    if (score >= 80) return 'High'
    if (score >= 50) return 'Moderate'
    return 'Light'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Session not found.</p>
    </div>
  )

    const comparisonStats = [
    { label: 'Distance', key: 'distance_miles', unit: 'mi', current: session.distance_miles },
    { label: 'Calories', key: 'calories_burned', unit: 'cal', current: session.calories_burned },
    { label: 'Steps', key: 'steps', unit: '', current: session.steps },
    { label: 'Activity Score', key: 'activity_score', unit: '', current: session.activity_score },
    { label: 'Peak Intensity', key: 'peak_intensity', unit: '', current: session.peak_intensity },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Dog header */}
        <div style={{ backgroundColor: '#003087', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {dog?.photo_url ? (
            <img src={dog.photo_url} alt={dog.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🐾</div>
          )}
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>{dog?.name}</h2>
            <p style={{ margin: 0, opacity: 0.8 }}>{formatDate(session.session_date)}</p>
          </div>
        </div>

        {/* Main stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { icon: '⏱️', label: 'Duration', value: session.duration_minutes ? `${session.duration_minutes} min` : '—' },
            { icon: '📍', label: 'Distance', value: session.distance_miles ? `${session.distance_miles} mi` : '—' },
            { icon: '🔥', label: 'Calories', value: session.calories_burned ? `${session.calories_burned}` : '—' },
            { icon: '👟', label: 'Steps', value: session.steps ? session.steps.toLocaleString() : '—' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#003087' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Activity score + peak intensity */}
        {(session.activity_score || session.peak_intensity) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {session.activity_score && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#333' }}>Activity Score</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: getIntensityColor(session.activity_score) }}>{session.activity_score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${session.activity_score}%`, backgroundColor: getIntensityColor(session.activity_score), borderRadius: '4px' }} />
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{getIntensityLabel(session.activity_score)}</p>
                  </div>
                </div>
              </div>
            )}
            {session.peak_intensity && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#333' }}>Peak Intensity</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: getIntensityColor(session.peak_intensity) }}>{session.peak_intensity}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${session.peak_intensity}%`, backgroundColor: getIntensityColor(session.peak_intensity), borderRadius: '4px' }} />
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{getIntensityLabel(session.peak_intensity)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FitBark placeholder */}
        {!session.distance_miles && !session.calories_burned && (
          <div style={{ backgroundColor: '#fff3e0', border: '1px solid #FF6B35', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#FF6B35', fontSize: '16px' }}>📡 FitBark Data Coming Soon</p>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Once FitBark is synced, this session will show full activity data including distance, calories, steps, and intensity graphs.</p>
          </div>
        )}

        {/* Comparison chart */}
        {previousSessions.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, color: '#003087' }}>📊 vs Previous Sessions</h3>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{stat.label}</span>
                      {diff !== null && (
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: Number(diff) >= 0 ? '#28a745' : '#dc3545' }}>
                          {Number(diff) >= 0 ? '↑' : '↓'} {Math.abs(Number(diff))}% vs avg
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#666', width: '60px' }}>This</span>
                      <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(current / maxVal) * 100}%`, backgroundColor: '#FF6B35', borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', width: '50px', textAlign: 'right' }}>{current || '—'} {stat.unit}</span>
                    </div>
                    {prevAvg !== null && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#666', width: '60px' }}>Avg</span>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(prevAvg / maxVal) * 100}%`, backgroundColor: '#003087', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', width: '50px', textAlign: 'right' }}>{prevAvg.toFixed(1)} {stat.unit}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>📝 Session Notes</h3>
            <p style={{ margin: 0, color: '#555', fontStyle: 'italic', fontSize: '15px', lineHeight: '1.6' }}>"{session.notes}"</p>
          </div>
        )}
      </div>
    </div>
  )
}