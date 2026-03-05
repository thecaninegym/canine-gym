'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { key: 'sessions', label: 'Most Sessions', field: 'session_count' },
  { key: 'miles', label: 'Most Miles', field: 'total_miles' },
  { key: 'calories', label: 'Most Calories', field: 'total_calories' },
]

const CITIES = ['All Cities', 'Carmel', 'Fishers', 'Zionsville', 'Westfield', 'Noblesville', 'Fortville', 'McCordsville', 'Lawrence']

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [category, setCategory] = useState('sessions')
  const [city, setCity] = useState('All Cities')
  const [loading, setLoading] = useState(true)
  const [currentDogId, setCurrentDogId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: ownerData } = await supabase
          .from('owners')
          .select('id')
          .eq('email', user.email)
          .single()
        if (ownerData) {
          const { data: dogsData } = await supabase
            .from('dogs')
            .select('id')
            .eq('owner_id', ownerData.id)
            .limit(1)
          if (dogsData && dogsData.length > 0) {
            setCurrentDogId(dogsData[0].id)
          }
        }
      }
      fetchLeaderboard()
    }
    init()
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [category, city])

  const fetchLeaderboard = async () => {
    setLoading(true)

    // Get all dogs with their leaderboard settings
    let query = supabase
      .from('leaderboard_settings')
      .select('*, dogs(id, name, breed, dog_achievements(count))')
      .neq('visibility', 'private')

    if (city !== 'All Cities') {
      query = query.eq('city', city)
    }

    const { data: settingsData } = await query

    if (!settingsData) { setLoading(false); return }

    // Get session stats for each dog
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const dogIds = settingsData.map(s => s.dog_id)

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('dog_id, distance_miles, calories_burned')
      .in('dog_id', dogIds)
      .gte('session_date', firstOfMonth)

    // Aggregate stats per dog
    const statsMap: Record<string, any> = {}
    dogIds.forEach(id => {
      statsMap[id] = { session_count: 0, total_miles: 0, total_calories: 0 }
    })

    sessionData?.forEach(session => {
      if (statsMap[session.dog_id]) {
        statsMap[session.dog_id].session_count++
        statsMap[session.dog_id].total_miles += session.distance_miles || 0
        statsMap[session.dog_id].total_calories += session.calories_burned || 0
      }
    })

    // Build leaderboard entries
    const entries = settingsData.map(setting => {
      const stats = statsMap[setting.dog_id] || {}
      const isAnonymous = setting.visibility === 'anonymous'
      return {
        dog_id: setting.dog_id,
        display_name: isAnonymous ? `🐾 Mystery Pup` : (setting.display_name || setting.dogs?.name),
        city: setting.city,
        is_anonymous: isAnonymous,
        session_count: stats.session_count || 0,
        total_miles: parseFloat((stats.total_miles || 0).toFixed(2)),
        total_calories: stats.total_calories || 0,
        achievement_count: setting.dogs?.dog_achievements?.[0]?.count || 0
      }
    })

    // Sort by selected category
    const fieldMap: Record<string, string> = {
      sessions: 'session_count',
      miles: 'total_miles',
      calories: 'total_calories'
    }
    const sortField = fieldMap[category]
    entries.sort((a, b) => b[sortField] - a[sortField])

    setLeaderboard(entries)
    setLoading(false)
  }

  const getCategoryValue = (entry: any) => {
    if (category === 'sessions') return `${entry.session_count} sessions`
    if (category === 'miles') return `${entry.total_miles} miles`
    if (category === 'calories') return `${entry.total_calories} cal`
    return ''
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return { backgroundColor: '#FFD700', color: '#333' }
    if (index === 1) return { backgroundColor: '#C0C0C0', color: '#333' }
    if (index === 2) return { backgroundColor: '#CD7F32', color: 'white' }
    return { backgroundColor: '#f0f0f0', color: '#333' }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>← My Dashboard</a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: '#003087', marginBottom: '8px' }}>🏆 Leaderboard</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>Monthly rankings — resets on the 1st of each month</p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>CATEGORY</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#000', backgroundColor: 'white' }}>
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>CITY</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#000', backgroundColor: 'white' }}>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '24px', color: '#666', margin: 0 }}>Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ padding: '24px', color: '#666', margin: 0 }}>No entries yet for this category.</p>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe = entry.dog_id === currentDogId
              return (
                <div key={entry.dog_id} style={{
                  padding: '16px 24px',
                  borderBottom: i < leaderboard.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  backgroundColor: isMe ? '#E8EEF7' : 'white'
                }}>
                  <div style={{ ...getRankStyle(i), width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>{entry.display_name}</span>
                      {isMe && <span style={{ backgroundColor: '#003087', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>YOU</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: '#666' }}>{entry.city} · {entry.achievement_count} badges</span>
                  </div>
                  <div style={{ backgroundColor: '#FF6B35', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                    {getCategoryValue(entry)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '16px' }}>
          Privacy settings control how your dog appears. Anonymous dogs show as 🐾 Mystery Pup.
        </p>
      </div>
    </div>
  )
}