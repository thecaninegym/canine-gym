'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Trophy, Medal, Flame, Navigation, Calendar, MapPin, Shield, Star, Crown } from 'lucide-react'

const CATEGORIES = [
  { key: 'sessions', label: 'Sessions', icon: <Calendar size={16} />, field: 'session_count' },
  { key: 'miles', label: 'Miles', icon: <Navigation size={16} />, field: 'total_miles' },
  { key: 'calories', label: 'Calories', icon: <Flame size={16} />, field: 'total_calories' },
]

const CITIES = ['All Cities', 'Carmel', 'Zionsville', 'Fishers', 'Geist', 'Westfield', 'Noblesville']

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
        const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
        if (ownerData) {
          const { data: dogsData } = await supabase.from('dogs').select('id').eq('owner_id', ownerData.id).limit(1)
          if (dogsData && dogsData.length > 0) setCurrentDogId(dogsData[0].id)
        }
      }
      fetchLeaderboard()
    }
    init()
  }, [])

  useEffect(() => { fetchLeaderboard() }, [category, city])

  const fetchLeaderboard = async () => {
    setLoading(true)
    let query = supabase.from('leaderboard_settings').select('*, dogs(id, name, breed, dog_achievements(count))').neq('visibility', 'private')
    if (city !== 'All Cities') query = query.eq('city', city)
    const { data: settingsData } = await query
    if (!settingsData) { setLoading(false); return }

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const dogIds = settingsData.map(s => s.dog_id)

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('dog_id, distance_miles, calories_burned')
      .in('dog_id', dogIds)
      .gte('session_date', firstOfMonth)

    const statsMap: Record<string, any> = {}
    dogIds.forEach(id => { statsMap[id] = { session_count: 0, total_miles: 0, total_calories: 0 } })
    sessionData?.forEach(session => {
      if (statsMap[session.dog_id]) {
        statsMap[session.dog_id].session_count++
        statsMap[session.dog_id].total_miles += session.distance_miles || 0
        statsMap[session.dog_id].total_calories += session.calories_burned || 0
      }
    })

    const entries = settingsData.map(setting => {
      const stats = statsMap[setting.dog_id] || {}
      const isAnonymous = setting.visibility === 'anonymous'
      return {
        dog_id: setting.dog_id,
        display_name: isAnonymous ? 'Mystery Pup' : (setting.display_name || setting.dogs?.name),
        is_anonymous: isAnonymous,
        city: setting.city,
        session_count: stats.session_count || 0,
        total_miles: parseFloat((stats.total_miles || 0).toFixed(2)),
        total_calories: stats.total_calories || 0,
        achievement_count: setting.dogs?.dog_achievements?.[0]?.count || 0
      }
    })

    const fieldMap: Record<string, string> = { sessions: 'session_count', miles: 'total_miles', calories: 'total_calories' }
    entries.sort((a, b) => b[fieldMap[category]] - a[fieldMap[category]])
    setLeaderboard(entries)
    setLoading(false)
  }

  const getCategoryValue = (entry: any) => {
    if (category === 'sessions') return `${entry.session_count}`
    if (category === 'miles') return `${entry.total_miles}`
    if (category === 'calories') return `${entry.total_calories.toLocaleString()}`
    return ''
  }

  const getCategoryUnit = () => {
    if (category === 'sessions') return 'sessions'
    if (category === 'miles') return 'miles'
    if (category === 'calories') return 'cal'
    return ''
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={18} color="#B8860B" />
    if (index === 1) return <Medal size={18} color="#888" />
    if (index === 2) return <Medal size={18} color="#8B4513" />
    return <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#999' }}>{index + 1}</span>
  }

  const getRankBg = (index: number) => {
    if (index === 0) return 'linear-gradient(135deg, #FFF9E6, #FFF3C4)'
    if (index === 1) return 'linear-gradient(135deg, #F5F5F5, #EBEBEB)'
    if (index === 2) return 'linear-gradient(135deg, #FDF0E8, #FAE0CC)'
    return 'white'
  }

  const getRankBorder = (index: number) => {
    if (index === 0) return '2px solid #FFD700'
    if (index === 1) return '2px solid #C0C0C0'
    if (index === 2) return '2px solid #CD7F32'
    return '1px solid #eee'
  }

  const monthName = new Date().toLocaleString('default', { month: 'long' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym</h1>
        </div>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> My Dashboard
        </a>
      </nav>

      <div style={{ background: 'linear-gradient(135deg, #003087 0%, #00409e 100%)', padding: '40px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%', marginBottom: '16px' }}>
            <Trophy size={32} color="#FFD700" />
          </div>
          <h2 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Leaderboard</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>{monthName} Rankings · Resets on the 1st</p>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '-24px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: category === c.key ? '#003087' : '#f0f2f5', color: category === c.key ? 'white' : '#666' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="#666" />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CITIES.map(c => (
                <button key={c} onClick={() => setCity(c)}
                  style={{ padding: '5px 12px', border: '1px solid', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', borderColor: city === c ? '#FF6B35' : '#ddd', backgroundColor: city === c ? '#FFF0EA' : 'white', color: city === c ? '#FF6B35' : '#666' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
              <PawPrint size={32} color="#ddd" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#999', margin: 0 }}>Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
              <Trophy size={32} color="#ddd" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#999', margin: 0 }}>No entries yet — be the first on the board!</p>
            </div>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe = entry.dog_id === currentDogId
              return (
                <div key={entry.dog_id} style={{ background: isMe ? 'linear-gradient(135deg, #E8EEF7, #dce6f5)' : getRankBg(i), border: isMe ? '2px solid #003087' : getRankBorder(i), borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: i < 3 ? '0 4px 12px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: i === 0 ? 'rgba(255,215,0,0.2)' : i === 1 ? 'rgba(192,192,192,0.2)' : i === 2 ? 'rgba(205,127,50,0.2)' : '#f5f5f5' }}>
                    {getRankIcon(i)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {entry.is_anonymous && <PawPrint size={14} color="#003087" />}
                      <span style={{ fontWeight: 'bold', color: '#111', fontSize: '16px' }}>{entry.display_name}</span>
                      {isMe && <span style={{ backgroundColor: '#003087', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>YOU</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                      {entry.city && <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {entry.city}</span>}
                      {entry.achievement_count > 0 && <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '3px' }}><Star size={11} color="#FF6B35" /> {entry.achievement_count} badges</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: i === 0 ? '#B8860B' : i === 1 ? '#666' : i === 2 ? '#8B4513' : '#003087', lineHeight: 1 }}>
                      {getCategoryValue(entry)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {getCategoryUnit()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#bbb', fontSize: '12px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Shield size={12} /> Anonymous dogs appear as Mystery Pup · Manage privacy in your dog settings
        </p>
      </div>
    </div>
  )
}