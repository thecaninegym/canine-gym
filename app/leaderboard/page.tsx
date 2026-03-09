'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Trophy, Medal, Flame, Navigation, Calendar, MapPin, Shield, Star, Crown, X, Award, UserPlus, UserCheck } from 'lucide-react'

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
  const [currentDogIds, setCurrentDogIds] = useState<string[]>([])
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [modalAchievements, setModalAchievements] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all')
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: ownerData } = await supabase.from('owners').select('id').eq('email', user.email).single()
        if (ownerData) {
          setOwnerId(ownerData.id)
          const { data: dogsData } = await supabase.from('dogs').select('id').eq('owner_id', ownerData.id)
          if (dogsData && dogsData.length > 0) setCurrentDogIds(dogsData.map(d => d.id))
          const { data: followsData } = await supabase.from('follows').select('following_owner_id').eq('follower_owner_id', ownerData.id)
          setFollowingIds((followsData || []).map((f: any) => f.following_owner_id))
        }
      }
      fetchLeaderboard()
    }
    init()
  }, [])

  useEffect(() => { fetchLeaderboard() }, [category, city])

  const fetchLeaderboard = async () => {
    setLoading(true)
    let query = supabase.from('leaderboard_settings').select('*, dogs(id, name, breed, photo_url, owner_id, dog_achievements(count))').neq('visibility', 'private')
    if (city !== 'All Cities') query = query.eq('city', city)
    const { data: settingsData } = await query
    if (!settingsData) { setLoading(false); return }

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const dogIds = settingsData.map(s => s.dog_id)

    const { data: sessionData } = await supabase
      .from('sessions').select('dog_id, distance_miles, calories_burned')
      .in('dog_id', dogIds).gte('session_date', firstOfMonth)

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
        owner_id: setting.dogs?.owner_id,
        display_name: isAnonymous ? 'Mystery Pup' : (setting.display_name || setting.dogs?.name),
        is_anonymous: isAnonymous,
        breed: isAnonymous ? null : setting.dogs?.breed,
        photo_url: isAnonymous ? null : setting.dogs?.photo_url,
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

  const openModal = async (entry: any) => {
    setSelectedEntry(entry)
    setModalLoading(true)
    const { data } = await supabase.from('dog_achievements').select('achievement_key, earned_at').eq('dog_id', entry.dog_id).order('earned_at', { ascending: false })
    setModalAchievements(data || [])
    setModalLoading(false)
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
    if (index === 0) return <Crown size={20} color="#B8860B" />
    if (index === 1) return <Medal size={20} color="#888" />
    if (index === 2) return <Medal size={20} color="#8B4513" />
    return <span style={{ fontWeight: '800', fontSize: '14px', color: '#aaa' }}>{index + 1}</span>
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'linear-gradient(135deg, #FFFBEA, #FFF3C4)', border: '2px solid #FFD700', iconBg: 'rgba(255,215,0,0.15)' }
    if (index === 1) return { bg: 'linear-gradient(135deg, #F8F8F8, #EFEFEF)', border: '2px solid #C0C0C0', iconBg: 'rgba(192,192,192,0.2)' }
    if (index === 2) return { bg: 'linear-gradient(135deg, #FDF0E8, #FAE0CC)', border: '2px solid #CD7F32', iconBg: 'rgba(205,127,50,0.15)' }
    return { bg: 'white', border: '1.5px solid #eef0f5', iconBg: '#f0f2f7' }
  }

  const formatAchievementLabel = (key: string) => {
    const labels: Record<string, string> = {
      first_session: 'First Stride 🐾', sessions_5: 'Finding Their Pace', sessions_10: 'Ten and Counting',
      sessions_100: 'Century Club 💯', miles_26: 'Marathon Pup 🏅', calories_10000: 'Calorie Crusher 🔥',
      speed_demon: 'Speed Demon ⚡', personal_best: 'Personal Best 🎯', streak_3: 'On A Roll',
      streak_hat_trick: 'Hat Trick', streak_5: 'Hot Streak', streak_unstoppable: 'Unstoppable', comeback: 'Comeback Kid',
    }
    return labels[key] || key.replace(/_/g, ' ')
  }

  const isFollowingEntry = (ownerIdToCheck: string) => followingIds.includes(ownerIdToCheck)

  const handleFollowFromModal = async (targetOwnerId: string) => {
    if (!ownerId) return
    await supabase.from('follows').insert([{ follower_owner_id: ownerId, following_owner_id: targetOwnerId }])
    setFollowingIds(prev => [...prev, targetOwnerId])
  }

  const handleUnfollowFromModal = async (targetOwnerId: string) => {
    if (!ownerId) return
    await supabase.from('follows').delete().eq('follower_owner_id', ownerId).eq('following_owner_id', targetOwnerId)
    setFollowingIds(prev => prev.filter(id => id !== targetOwnerId))
  }

  const monthName = new Date().toLocaleString('default', { month: 'long' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .entry-row:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .cat-btn:hover { opacity: 0.85; }
        .city-btn:hover { opacity: 0.8; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> My Dashboard
        </a>
      </nav>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', padding: '44px 24px 68px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '320px', height: '320px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.04, pointerEvents: 'none' }}>
          <Trophy size={240} color="white" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '68px', height: '68px', background: 'rgba(255,215,0,0.15)', border: '2px solid rgba(255,215,0,0.3)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={34} color="#FFD700" />
          </div>
          <h2 style={{ color: 'white', fontSize: '34px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Leaderboard</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '14px', fontWeight: '500' }}>{monthName} Rankings · Resets on the 1st</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '-28px auto 0', padding: '0 24px 48px', position: 'relative', zIndex: 2, animation: 'fadeUp 0.35s ease' }}>

        {/* Filters Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          {/* Category Tabs */}
          {/* All vs Friends toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['all', 'friends'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode as any)}
                style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: viewMode === mode ? 'linear-gradient(135deg, #f88124, #f9a04e)' : '#f0f2f5', color: viewMode === mode ? 'white' : '#666', boxShadow: viewMode === mode ? '0 3px 10px rgba(255,107,53,0.3)' : 'none' }}>
                {mode === 'all' ? '🌍 Everyone' : '👥 Friends'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} className="cat-btn"
                style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s',
                  background: category === c.key ? 'linear-gradient(135deg, #2c5a9e, #2c5a9e)' : '#f0f2f7',
                  color: category === c.key ? 'white' : '#666',
                  boxShadow: category === c.key ? '0 4px 12px rgba(0,48,135,0.25)' : 'none'
                }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <MapPin size={14} color="#aaa" />
            {CITIES.map(c => (
              <button key={c} onClick={() => setCity(c)} className="city-btn"
                style={{ padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s', border: 'none',
                  background: city === c ? '#f88124' : '#f0f2f7',
                  color: city === c ? 'white' : '#777',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '52px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,48,135,0.1)', borderTopColor: '#2c5a9e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ color: '#bbb', margin: 0, fontSize: '14px' }}>Loading rankings…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '52px', textAlign: 'center' }}>
              <Trophy size={36} color="#e0e3ed" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#bbb', margin: 0, fontSize: '15px' }}>No entries yet — be the first on the board!</p>
            </div>
          ) : (
            leaderboard
            .filter(entry => viewMode === 'all' || followingIds.includes(entry.owner_id) || entry.owner_id === ownerId)
            .map((entry, i) => {
              const isMe = currentDogIds.includes(entry.dog_id)
              const rank = getRankStyle(i)
              return (
                <div key={entry.dog_id} onClick={() => openModal(entry)} className="entry-row"
                  style={{ background: isMe ? 'linear-gradient(135deg, #eef2fb, #d4e0f5)' : rank.bg, border: isMe ? '2px solid #2c5a9e' : rank.border, borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: i < 3 ? '0 4px 16px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                  {/* Rank */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isMe ? 'rgba(0,48,135,0.1)' : rank.iconBg }}>
                    {getRankIcon(i)}
                  </div>

                  {/* Photo */}
                  {entry.photo_url && !entry.is_anonymous ? (
                    <img src={entry.photo_url} alt={entry.display_name} style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.8)' }} />
                  ) : (
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(0,48,135,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PawPrint size={20} color="#2c5a9e" />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '15px' }}>{entry.display_name}</span>
                      {isMe && (
                        <span style={{ background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.3px' }}>YOU</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {entry.city && (
                        <span style={{ fontSize: '12px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {entry.city}
                        </span>
                      )}
                      {entry.breed && (
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{entry.breed}</span>
                      )}
                      {entry.achievement_count > 0 && (
                        <span style={{ fontSize: '12px', color: '#f88124', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Star size={11} color="#f88124" fill="#f88124" /> {entry.achievement_count} badges
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1,
                      color: i === 0 ? '#B8860B' : i === 1 ? '#777' : i === 2 ? '#8B4513' : '#2c5a9e'
                    }}>
                      {getCategoryValue(entry)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#bbb', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {getCategoryUnit()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#c0c4d0', fontSize: '12px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Shield size={12} /> Anonymous dogs appear as Mystery Pup · Manage privacy in dog settings
        </p>
      </div>

      {/* Entry Modal */}
      {selectedEntry && (
        <div onClick={() => setSelectedEntry(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeUp 0.25s ease' }}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #001840, #2c5a9e)', padding: '28px 24px 24px', position: 'relative', textAlign: 'center' }}>
              <button onClick={() => setSelectedEntry(null)}
                style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                <X size={16} />
              </button>
              {selectedEntry.photo_url && !selectedEntry.is_anonymous ? (
                <img src={selectedEntry.photo_url} alt={selectedEntry.display_name}
                  onClick={() => setEnlargedPhoto(selectedEntry.photo_url)}
                  style={{ width: '80px', height: '80px', borderRadius: '18px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)', marginBottom: '14px', display: 'block', margin: '0 auto 14px', cursor: 'zoom-in', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <PawPrint size={36} color="rgba(255,255,255,0.6)" />
                </div>
              )}
              <h3 style={{ color: 'white', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>{selectedEntry.display_name}</h3>
              {selectedEntry.breed && <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontSize: '14px' }}>{selectedEntry.breed}</p>}
              {selectedEntry.city && (
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {selectedEntry.city}
                </p>
              )}
              {ownerId && selectedEntry.owner_id && selectedEntry.owner_id !== ownerId && (
                <button
                  onClick={e => { e.stopPropagation(); isFollowingEntry(selectedEntry.owner_id) ? handleUnfollowFromModal(selectedEntry.owner_id) : handleFollowFromModal(selectedEntry.owner_id) }}
                  style={{ marginTop: '14px', padding: '8px 24px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: isFollowingEntry(selectedEntry.owner_id) ? 'rgba(255,255,255,0.15)' : '#f88124', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {isFollowingEntry(selectedEntry.owner_id) ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>

            {/* Modal Stats */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Sessions', value: selectedEntry.session_count, icon: <Calendar size={16} color="#2c5a9e" />, bg: '#eef2fb' },
                  { label: 'Miles', value: selectedEntry.total_miles, icon: <Navigation size={16} color="#2c5a9e" />, bg: '#eef2fb' },
                  { label: 'Calories', value: selectedEntry.total_calories.toLocaleString(), icon: <Flame size={16} color="#f88124" />, bg: '#fff0ea' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#f0f2f7', borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '28px', height: '28px', background: '#fff5e6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={15} color="#f88124" />
                  </div>
                  <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Badges Earned</span>
                  <span style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>{selectedEntry.achievement_count}</span>
                </div>
                {modalLoading ? (
                  <p style={{ color: '#bbb', fontSize: '13px', margin: 0 }}>Loading badges…</p>
                ) : modalAchievements.length === 0 ? (
                  <p style={{ color: '#ccc', fontSize: '13px', margin: 0 }}>No badges earned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {modalAchievements.map((a, idx) => (
                      <div key={idx} style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Star size={11} color="white" fill="white" /> {formatAchievementLabel(a.achievement_key)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo */}
      {enlargedPhoto && (
        <div onClick={() => setEnlargedPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '24px', cursor: 'zoom-out', backdropFilter: 'blur(8px)' }}>
          <img src={enlargedPhoto} alt="Dog photo"
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setEnlargedPhoto(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}