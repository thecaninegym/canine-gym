'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PawPrint, ArrowLeft, Search, UserPlus, UserCheck, Users, MapPin } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' as const, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }

export default function Friends() {
  const [ownerId, setOwnerId] = useState('')
  const [ownerCity, setOwnerCity] = useState('')
  const [following, setFollowing] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'suggestions'>('suggestions')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: ownerData } = await supabase.from('owners').select('id, city').eq('email', user.email).single()
      if (!ownerData) { setLoading(false); return }
      setOwnerId(ownerData.id)
      setOwnerCity(ownerData.city || '')
      await fetchAll(ownerData.id, ownerData.city)
      setLoading(false)
    }
    init()
  }, [])

  const fetchAll = async (myId: string, myCity: string) => {
    // Following
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_owner_id, owners!follows_following_owner_id_fkey(id, name, gym_tag, city, dogs(name, photo_url))')
      .eq('follower_owner_id', myId)
    setFollowing(followingData || [])

    // Followers
    const { data: followersData } = await supabase
      .from('follows')
      .select('follower_owner_id, owners!follows_follower_owner_id_fkey(id, name, gym_tag, city, dogs(name, photo_url))')
      .eq('following_owner_id', myId)
    setFollowers(followersData || [])

    // Suggestions — same city, not already following
    const followingIds = (followingData || []).map((f: any) => f.following_owner_id)
    let suggestQuery = supabase.from('owners').select('id, name, gym_tag, city, dogs(name, photo_url)').neq('id', myId)
    if (myCity) suggestQuery = suggestQuery.eq('city', myCity)
    const { data: suggestData } = await suggestQuery
    setSuggestions((suggestData || []).filter((o: any) => !followingIds.includes(o.id)))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const q = searchQuery.trim().toLowerCase().replace('@', '')
    const { data } = await supabase
      .from('owners')
      .select('id, name, gym_tag, city, dogs(name, photo_url)')
      .neq('id', ownerId)
      .or(`gym_tag.ilike.%${q}%,name.ilike.%${q}%`)
    setSearchResults(data || [])
    setSearching(false)
  }

  const isFollowing = (targetId: string) => following.some((f: any) => f.following_owner_id === targetId)

  const handleFollow = async (targetId: string) => {
    await supabase.from('follows').insert([{ follower_owner_id: ownerId, following_owner_id: targetId }])
    await fetchAll(ownerId, ownerCity)
    setSearchResults(prev => [...prev])
  }

  const handleUnfollow = async (targetId: string) => {
    await supabase.from('follows').delete().eq('follower_owner_id', ownerId).eq('following_owner_id', targetId)
    await fetchAll(ownerId, ownerCity)
    setSearchResults(prev => [...prev])
  }

  const OwnerCard = ({ owner, showFollowBtn = true }: { owner: any, showFollowBtn?: boolean }) => {
    const dogs = owner.dogs || []
    const following_ = isFollowing(owner.id)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1.5px solid #f0f2f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', position: 'relative', width: dogs.length > 1 ? `${28 + (dogs.length - 1) * 20}px` : '48px', height: '48px', flexShrink: 0 }}>
            {dogs.length === 0 ? (
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PawPrint size={22} color="#ccc" />
              </div>
            ) : dogs.length === 1 ? (
              dogs[0].photo_url
                ? <img src={dogs[0].photo_url} alt={dogs[0].name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #eef0f5' }} />
                : <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PawPrint size={22} color="#ccc" /></div>
            ) : (
              dogs.slice(0, 3).map((d: any, i: number) => (
                d.photo_url
                  ? <img key={d.name} src={d.photo_url} alt={d.name} style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover', border: '2px solid white', position: 'absolute', left: `${i * 20}px`, top: '50%', transform: 'translateY(-50%)', zIndex: dogs.length - i }} />
                  : <div key={d.name} style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', position: 'absolute', left: `${i * 20}px`, top: '50%', transform: 'translateY(-50%)', zIndex: dogs.length - i }}><PawPrint size={14} color="#ccc" /></div>
              ))
            )}
          </div>
          <div>
            <div style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '14px' }}>{owner.name}</div>
            {owner.gym_tag && <div style={{ color: '#f88124', fontSize: '12px', fontWeight: '700' }}>@{owner.gym_tag}</div>}
            {owner.city && <div style={{ color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} /> {owner.city}</div>}
            {dogs.length > 0 && <div style={{ color: '#aaa', fontSize: '12px' }}>🐾 {dogs.map((d: any) => d.name).join(', ')}</div>}
          </div>
        </div>
        {showFollowBtn && owner.id !== ownerId && (
          <button onClick={() => following_ ? handleUnfollow(owner.id) : handleFollow(owner.id)}
            style={{ padding: '7px 16px', borderRadius: '10px', border: '1.5px solid', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', background: following_ ? '#f0f2f7' : 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: following_ ? '#555' : 'white', borderColor: following_ ? '#e5e8f0' : 'transparent', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {following_ ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
          </button>
        )}
      </div>
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; }`}</style>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-white.png" alt="The Canine Gym" style={{ height: '40px', width: 'auto' }} />
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: '640px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>Friends</h2>
          <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>{following.length} following · {followers.length} followers</p>
        </div>

        {/* Search */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: searchResults.length > 0 ? '16px' : '0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} color="#aaa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or @gymtag…"
                style={{ ...inputStyle, paddingLeft: '36px' }}
              />
            </div>
            <button onClick={handleSearch} disabled={searching}
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {searching ? '…' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div>
              {searchResults.map((owner: any) => <OwnerCard key={owner.id} owner={owner} />)}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !searching && (
            <p style={{ color: '#aaa', fontSize: '13px', margin: '12px 0 0', textAlign: 'center' }}>No results found for "{searchQuery}"</p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1.5px solid #f0f2f7' }}>
            {[
              { key: 'suggestions', label: `Suggestions (${suggestions.length})` },
              { key: 'following', label: `Following (${following.length})` },
              { key: 'followers', label: `Followers (${followers.length})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                style={{ flex: 1, padding: '14px 8px', border: 'none', background: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', color: activeTab === tab.key ? '#2c5a9e' : '#888', borderBottom: activeTab === tab.key ? '2.5px solid #2c5a9e' : '2.5px solid transparent', transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '4px 20px 8px' }}>
            {activeTab === 'suggestions' && (
              suggestions.length === 0
                ? <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No suggestions yet — try searching by name or @gymtag!</p>
                : suggestions.map((owner: any) => <OwnerCard key={owner.id} owner={owner} />)
            )}
            {activeTab === 'following' && (
              following.length === 0
                ? <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>You're not following anyone yet.</p>
                : following.map((f: any) => <OwnerCard key={f.following_owner_id} owner={f.owners} />)
            )}
            {activeTab === 'followers' && (
              followers.length === 0
                ? <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No followers yet.</p>
                : followers.map((f: any) => <OwnerCard key={f.follower_owner_id} owner={f.owners} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}