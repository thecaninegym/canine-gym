'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Trophy, PawPrint, User, CreditCard, LogOut, Calendar, Flame, Share2, Lock, CheckCircle, ChevronRight, X, Activity, Navigation, Medal, Zap, Target, RefreshCw, Award, TrendingUp, Dumbbell, RotateCcw, Hash, Star, Users, MapPin, Clock, Receipt } from 'lucide-react'

export default function ClientDashboard() {
  const [dogs, setDogs] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDog, setSelectedDog] = useState<any>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null)
  const [hasAddress, setHasAddress] = useState(false)
  const [hasDogs, setHasDogs] = useState(false)
  const [hasWaiver, setHasWaiver] = useState(false)
  const [membershipsMap, setMembershipsMap] = useState<Record<string, any>>({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [friendsActivity, setFriendsActivity] = useState<any[]>([])
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: owner } = await supabase.from('owners').select('*').eq('email', user.email).single()
      if (!owner) { setLoading(false); return }
      setOwnerId(owner.id)
      setHasAddress(!!(owner.address && owner.city))
      setHasWaiver(!!(owner.waiver_signed))
      const { data: membershipRows } = await supabase
        .from('memberships').select('*').eq('owner_id', owner.id)
        .in('status', ['active', 'cancelled']).gte('current_period_end', new Date().toISOString())
      const map: Record<string, any> = {}
      for (const m of membershipRows || []) map[m.dog_id] = m
      setMembershipsMap(map)
      const { data: dogsData } = await supabase.from('dogs').select('*, leaderboard_settings(city, visibility)').eq('owner_id', owner.id).order('name')
      setDogs(dogsData || [])
      setHasDogs((dogsData || []).length > 0)
      if (dogsData && dogsData.length > 0) {
        setSelectedDog(dogsData[0])
        fetchSessions(dogsData[0].id)
        fetchAchievements(dogsData[0].id)
        fetchUpcomingBookings(dogsData[0].id)
      }
      await fetchFriendsActivity(owner.id)
      setLoading(false)
    }
    init()
  }, [])

  const fetchSessions = async (dogId: string) => {
    const { data } = await supabase.from('sessions').select('*').eq('dog_id', dogId).order('session_date', { ascending: false }).limit(20)
    setSessions(data || [])
  }
  const fetchAchievements = async (dogId: string) => {
    const { data } = await supabase.from('dog_achievements').select('*').eq('dog_id', dogId).order('earned_at', { ascending: false })
    setAchievements(data || [])
  }
  const fetchFriendsActivity = async (myOwnerId: string) => {
    const { data: followsData } = await supabase.from('follows').select('following_owner_id').eq('follower_owner_id', myOwnerId)
    if (!followsData || followsData.length === 0) return
    const followingOwnerIds = followsData.map((f: any) => f.following_owner_id)
    const { data: friendDogs } = await supabase.from('dogs').select('id, name, photo_url, owner_id, owners(name)').in('owner_id', followingOwnerIds)
    if (!friendDogs || friendDogs.length === 0) return
    const friendDogIds = friendDogs.map((d: any) => d.id)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: recentSessions } = await supabase.from('sessions').select('id, dog_id, session_date, distance_miles, calories_burned, duration_minutes').in('dog_id', friendDogIds).gte('session_date', sevenDaysAgo).order('session_date', { ascending: false }).limit(10)
    if (!recentSessions) return
    const dogMap: Record<string, any> = {}
    friendDogs.forEach((d: any) => { dogMap[d.id] = d })
    setFriendsActivity(recentSessions.map(s => ({ ...s, dog: dogMap[s.dog_id] })))
  }
  const fetchUpcomingBookings = async (dogId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('bookings').select('*').eq('dog_id', dogId).eq('status', 'confirmed').gte('booking_date', today).order('booking_date')
    setUpcomingBookings(data || [])
  }
  const handleDogSelect = (dog: any) => {
    setSelectedDog(dog)
    fetchSessions(dog.id)
    fetchAchievements(dog.id)
    fetchUpcomingBookings(dog.id)
  }
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const totalSessions = sessions.length
  const totalMiles = sessions.reduce((sum, s) => sum + (s.distance_miles || 0), 0).toFixed(2)
  const totalCalories = sessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0)

  // Last session date
  const lastSessionDate = sessions.length > 0
    ? new Date(sessions[0].session_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  // Current streak: count consecutive weeks with at least 1 session (most recent first)
  const sessionWeeks = new Set(sessions.map(s => {
    const d = new Date(s.session_date + 'T12:00:00')
    const startOfWeek = new Date(d)
    startOfWeek.setDate(d.getDate() - d.getDay())
    return startOfWeek.toISOString().split('T')[0]
  }))
  const sortedWeeks = Array.from(sessionWeeks).sort((a, b) => b.localeCompare(a))
  let streak = 0
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  for (let i = 0; i < sortedWeeks.length; i++) {
    const expected = new Date(thisWeekStart)
    expected.setDate(thisWeekStart.getDate() - i * 7)
    const expectedStr = expected.toISOString().split('T')[0]
    if (sortedWeeks[i] === expectedStr) { streak++ } else { break }
  }

  const allAchievements = [
    { key: 'first_stride', label: 'First Stride', icon: '🐾', description: 'Complete your first session' },
    { key: 'finding_their_pace', label: 'Finding Their Pace', icon: '⚡', description: 'Complete 5 sessions' },
    { key: 'ten_and_counting', label: 'Ten and Counting', icon: '#️⃣', description: 'Complete 10 sessions' },
    { key: 'century_club', label: 'Century Club', icon: '⭐', description: 'Complete 100 sessions' },
    { key: 'marathon_pup', label: 'Marathon Pup', icon: '🏅', description: 'Run 26.2 total miles' },
    { key: 'calorie_crusher', label: 'Calorie Crusher', icon: '🔥', description: 'Burn 1,000 total calories' },
    { key: 'speed_demon', label: 'Speed Demon', icon: '💨', description: 'Hit 90%+ peak intensity in a session' },
    { key: 'personal_best_miles', label: 'Personal Best', icon: '🎯', description: 'Beat your previous distance record' },
    { key: 'on_a_roll', label: 'On A Roll', icon: '🔄', description: 'Book sessions 2 weeks in a row' },
    { key: 'hat_trick', label: 'Hat Trick', icon: '🏆', description: 'Book sessions 3 weeks in a row' },
    { key: 'hot_streak', label: 'Hot Streak', icon: '📈', description: 'Book sessions 4 weeks in a row' },
    { key: 'unstoppable', label: 'Unstoppable', icon: '💪', description: 'Book sessions 12 weeks in a row' },
    { key: 'comeback_kid', label: 'Comeback Kid', icon: '↩️', description: 'Return after a 2+ week absence' },
  ]

  if (loading) return (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)' }}>
    <style>{`
      @keyframes run { 0%,100% { transform: translateY(0px) scaleX(1); } 25% { transform: translateY(-10px) scaleX(1); } 75% { transform: translateY(-4px) scaleX(1); } }
      @keyframes paw1 { 0%,60%,100% { opacity: 0; } 30%,50% { opacity: 1; } }
      @keyframes paw2 { 0%,20%,80%,100% { opacity: 0; } 50%,70% { opacity: 1; } }
      @keyframes paw3 { 0%,40%,100% { opacity: 0; } 70%,90% { opacity: 1; } }
    `}</style>
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '120px', height: '70px', margin: '0 auto 20px' }}>
        <span style={{ position: 'absolute', bottom: '0', left: '10px', fontSize: '18px', animation: 'paw1 0.9s ease infinite' }}>🐾</span>
        <span style={{ position: 'absolute', bottom: '0', left: '44px', fontSize: '18px', animation: 'paw2 0.9s ease infinite' }}>🐾</span>
        <span style={{ position: 'absolute', bottom: '0', left: '78px', fontSize: '18px', animation: 'paw3 0.9s ease infinite' }}>🐾</span>
        <span style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', fontSize: '42px', animation: 'run 0.9s ease infinite', display: 'block' }}>🐕</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', letterSpacing: '0.5px' }}>Loading your dashboard…</p>
    </div>
  </div>
)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dog-tab:hover { transform: translateY(-1px); }
        .stat-card:hover { transform: translateY(-2px); }
        .session-row:hover { background: #f8f9ff !important; }
        .nav-link:hover { opacity: 0.8; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
        * { box-sizing: border-box; }

        /* ── Mobile nav ── */
        .nav-links-desktop { display: flex; gap: 4px; align-items: center; }
        .nav-hamburger { display: none; }
        .mobile-menu { display: none; }

        @media (max-width: 700px) {
          .nav-links-desktop { display: none; }
          .nav-hamburger { display: flex; align-items: center; justify-content: center; background: #2c5a9e; border: none; color: white; cursor: pointer; border-radius: 8px; width: 40px; height: 40px; }
          .mobile-menu { display: flex; flex-direction: column; gap: 4px; position: fixed; top: 80px; left: 0; right: 0; background: white; padding: 16px 16px 16px; z-index: 99; border-top: 3px solid #f88124; box-shadow: 0 8px 24px rgba(0,24,64,0.12); }
          .mobile-menu a, .mobile-menu button { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; color: #001840 !important; font-size: 14px !important; font-weight: 600; text-decoration: none; background: rgba(0,24,64,0.04); border: none; cursor: pointer; width: 100%; }

          /* Hero card stacks on mobile */
          .hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .hero-photo { width: 80px !important; height: 80px !important; }
          .hero-photo-placeholder { width: 80px !important; height: 80px !important; }
          .hero-actions { flex-direction: row !important; width: 100%; }
          .hero-actions a, .hero-actions button { flex: 1; justify-content: center; }

          /* Stat cards: 1 col on small, 3 col still on medium */
          .stat-grid { grid-template-columns: 1fr !important; }

          /* Booking row stacks */
          .booking-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .booking-row .cancel-btn { align-self: flex-end; }

          /* Membership card stacks */
          .membership-inner { flex-direction: column !important; gap: 12px !important; }
          .membership-manage { align-self: center; }

          /* Page padding tighter on mobile */
          .page-inner { padding: 96px 14px 16px !important; }

          /* Hero name smaller */
          .hero-name { font-size: 24px !important; }

          /* Session rows */
          .session-row { padding: 14px 16px !important; }

          /* Card headers */
          .card-header { padding: 14px 16px !important; }
          .card-body { padding: 16px !important; }
        }

        @media (min-width: 480px) and (max-width: 700px) {
          .stat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
        </div>

        {/* Desktop nav */}
        <div className="nav-links-desktop">
          {[
            { href: '/friends', icon: <Users size={15} />, label: 'Friends' },
            { href: '/leaderboard', icon: <Trophy size={15} />, label: 'Leaderboard' },
            { href: '/dogs', icon: <PawPrint size={15} />, label: 'My Dogs' },
            { href: '/profile', icon: <User size={15} />, label: 'Profile' },
            { href: '/membership', icon: <CreditCard size={15} />, label: selectedDog && membershipsMap[selectedDog?.id] ? `Membership (${membershipsMap[selectedDog.id].sessions_remaining} left)` : 'Membership' },
            { href: '/payments', icon: <Receipt size={15} />, label: 'Payments' },
          ].map(item => (
            <a key={item.href} href={item.href} className="nav-link" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.15s', background: 'rgba(0,24,64,0.04)' }}>
              {item.icon} {item.label}
            </a>
          ))}
          <button onClick={handleLogout} style={{ backgroundColor: '#f88124', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', transition: 'all 0.15s' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen
            ? <X size={20} color="white" />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {[
            { href: '/friends', icon: <Users size={16} />, label: 'Friends' },
            { href: '/leaderboard', icon: <Trophy size={16} />, label: 'Leaderboard' },
            { href: '/dogs', icon: <PawPrint size={16} />, label: 'My Dogs' },
            { href: '/profile', icon: <User size={16} />, label: 'Profile' },
            { href: '/membership', icon: <CreditCard size={16} />, label: selectedDog && membershipsMap[selectedDog?.id] ? `Membership (${membershipsMap[selectedDog.id].sessions_remaining} left)` : 'Membership' },
            { href: '/payments', icon: <Receipt size={16} />, label: 'Payments' },
          ].map(item => (
            <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              {item.icon} {item.label}
            </a>
          ))}
          <button onClick={() => { setMobileMenuOpen(false); handleLogout() }} style={{ color: '#f88124 !important' as any }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}

      <div className="page-inner" style={{ padding: '108px 24px 28px', maxWidth: '1040px', margin: '0 auto' }}>

        {/* ONBOARDING STATE */}
        {!hasAddress || !hasDogs || !hasWaiver ? (
          <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '20px', padding: '40px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(255,107,53,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <PawPrint size={40} color="#f88124" />
              </div>
              <h2 style={{ color: 'white', margin: '0 0 8px', fontSize: '26px', fontWeight: '800' }}>Welcome to The Canine Gym!</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: '0 0 32px', lineHeight: '1.6' }}>The run comes to you. Complete these steps to book your first session.</p>
              <div style={{ display: 'grid', gap: '12px', textAlign: 'left' }}>
                {[
                  { done: hasAddress, href: '/profile', step: 1, title: 'Add Your Address', subtitle: 'We come to your home — we need your address!', doneTitle: 'Address Added', doneSubtitle: "We know where to find you on session day!", icon: <MapPin size={22} /> },
                  { done: hasDogs, href: '/dogs', step: 2, title: 'Add Your Dog', subtitle: "Add your dog's details to start tracking and booking.", doneTitle: 'Dog Added', doneSubtitle: 'Your dog is ready to run!', icon: <PawPrint size={22} /> },
                  { done: hasWaiver, href: '/waiver', step: 3, title: 'Sign Waiver', subtitle: 'Read and sign our liability waiver before your first session.', doneTitle: 'Waiver Signed', doneSubtitle: "You're legally all set!", icon: <Activity size={22} /> },
                ].map(item => (
                  item.done ? (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(40,167,69,0.15)', padding: '18px', borderRadius: '14px', border: '1.5px solid rgba(40,167,69,0.4)' }}>
                      <div style={{ width: '44px', height: '44px', background: '#28a745', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={22} color="white" />
                      </div>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: '700', color: 'white', fontSize: '15px' }}>Step {item.step} — {item.doneTitle}</p>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{item.doneSubtitle}</p>
                      </div>
                    </div>
                  ) : (
                    <a key={item.step} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.07)', padding: '18px', borderRadius: '14px', textDecoration: 'none', border: '1.5px solid rgba(255,107,53,0.5)', transition: 'all 0.2s' }}>
                      <div style={{ width: '44px', height: '44px', background: '#f88124', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white' }}>{item.icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 3px', fontWeight: '700', color: 'white', fontSize: '15px' }}>Step {item.step} — {item.title}</p>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{item.subtitle}</p>
                      </div>
                      <ChevronRight size={20} color="#f88124" />
                    </a>
                  )
                ))}
              </div>
              {hasAddress && hasDogs && hasWaiver && (
                <a href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '24px', backgroundColor: '#f88124', color: 'white', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '16px' }}>
                  <Calendar size={18} /> Book Your First Session
                </a>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* DOG SELECTOR TABS */}
            {dogs.length > 1 && (
  <div style={{ marginBottom: '24px' }}>
  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Select Dog</p>
  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 4px 10px' }}>
                {dogs.map(dog => (
                  <button key={dog.id} onClick={() => handleDogSelect(dog)} className="dog-tab"
                    style={{ padding: '10px 18px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', flexShrink: 0,
                      backgroundColor: selectedDog?.id === dog.id ? '#2c5a9e' : 'white',
                      color: selectedDog?.id === dog.id ? 'white' : '#2c5a9e',
                    }}>
                    {dog.photo_url ? (
                      <img src={dog.photo_url} alt={dog.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: selectedDog?.id === dog.id ? 'rgba(255,255,255,0.2)' : '#eef2fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PawPrint size={13} color={selectedDog?.id === dog.id ? 'white' : '#2c5a9e'} />
                      </div>
                    )}
                    {dog.name}
                  </button>
                ))}
              </div>
  </div>
)}

            {selectedDog && (
              <div style={{ animation: 'fadeUp 0.35s ease' }}>

                {/* DOG HERO CARD */}
                <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 32px rgba(0,48,135,0.18)', position: 'relative', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)' }}>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.04, pointerEvents: 'none' }}>
                    <PawPrint size={220} color="white" />
                  </div>
                  <div className="hero-inner" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative' }}>
                    {selectedDog.photo_url ? (
                      <img src={selectedDog.photo_url} alt={selectedDog.name} className="hero-photo"
                        style={{ width: '110px', height: '110px', borderRadius: '18px', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
                    ) : (
                      <div className="hero-photo-placeholder" style={{ width: '110px', height: '110px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid rgba(255,255,255,0.15)' }}>
                        <PawPrint size={48} color="rgba(255,255,255,0.5)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h2 className="hero-name" style={{ margin: 0, fontSize: '30px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>{selectedDog.name}</h2>
                        {selectedDog.breed && <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>{selectedDog.breed}</span>}
                      </div>
                      {selectedDog.leaderboard_settings?.city && (
                        <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.55)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={12} /> {selectedDog.leaderboard_settings.city}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {[
                          { val: totalSessions, label: 'Total Sessions' },
                          { val: totalMiles, label: 'Total Miles' },
                          { val: totalCalories.toLocaleString(), label: 'Total Calories' },
                        ].map(stat => (
                          <div key={stat.label}>
                            <div style={{ color: 'white', fontSize: '20px', fontWeight: '800', lineHeight: 1 }}>{stat.val}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="hero-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                      <a href="/book" className="action-btn" style={{ backgroundColor: '#f88124', color: 'white', padding: '11px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(255,107,53,0.4)', whiteSpace: 'nowrap' }}>
                        <Calendar size={15} /> Book Session
                      </a>
                      <button onClick={() => setShowShareModal(true)}
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', padding: '9px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <Share2 size={14} /> Share Stats
                      </button>
                    </div>
                  </div>
                </div>

                {/* SHARE MODAL */}
                {showShareModal && selectedDog && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowShareModal(false)}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 3px', fontWeight: '800', fontSize: '17px', color: '#1a1a2e' }}>Share {selectedDog.name}'s Stats</h3>
                          <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Show off those gains 🐾</p>
                        </div>
                        <button onClick={() => setShowShareModal(false)} style={{ background: '#f0f2f7', border: 'none', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={16} color="#666" />
                        </button>
                      </div>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1.5px solid #eef0f5' }}>
                        <img src={`/api/session-card?dog=${encodeURIComponent(selectedDog.name)}&sessions=${totalSessions}&miles=${totalMiles}&calories=${totalCalories}&city=${encodeURIComponent(selectedDog.leaderboard_settings?.city || '')}&photo=${encodeURIComponent(selectedDog.photo_url || '')}`} style={{ width: '100%', display: 'block' }} alt="Stats card" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <a href={`/api/session-card?dog=${encodeURIComponent(selectedDog.name)}&sessions=${totalSessions}&miles=${totalMiles}&calories=${totalCalories}&city=${encodeURIComponent(selectedDog.leaderboard_settings?.city || '')}&photo=${encodeURIComponent(selectedDog.photo_url || '')}`} download={`${selectedDog.name}-stats.png`}
                          style={{ background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', color: 'white', padding: '13px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Save Image
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://app.thecaninegym.com/api/session-card?dog=${encodeURIComponent(selectedDog.name)}&sessions=${totalSessions}&miles=${totalMiles}&calories=${totalCalories}&city=${encodeURIComponent(selectedDog.leaderboard_settings?.city || '')}&photo=${encodeURIComponent(selectedDog.photo_url || '')}`)}`} target="_blank" rel="noopener noreferrer"
                          style={{ background: '#1877F2', color: 'white', padding: '13px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                          Share on Facebook
                        </a>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '12px', textAlign: 'center' }}>For Instagram — download the image and share from your camera roll</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MEMBERSHIP CARD — per-dog */}
                {(() => {
                  const membership = membershipsMap[selectedDog.id]
                  if (!membership) {
                    return (
                      <div style={{ background: '#f8f9ff', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', border: '1.5px dashed #c8d4f0', flexWrap: 'wrap' }}>
                        <div style={{ width: '38px', height: '38px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CreditCard size={18} color="#8a9bc0" />
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <p style={{ margin: '0 0 2px', color: '#5a6a8a', fontWeight: '700', fontSize: '14px' }}>{selectedDog.name} doesn't have a membership</p>
                          <p style={{ margin: 0, color: '#9aaac8', fontSize: '13px' }}>Get a monthly plan to save on every session</p>
                        </div>
                        <a href="/membership" style={{ color: '#2c5a9e', fontWeight: '700', fontSize: '13px', textDecoration: 'none', background: 'white', padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #c8d4f0', flexShrink: 0 }}>
                          Get a Plan →
                        </a>
                      </div>
                    )
                  }

                  const isCancelled = membership.status === 'cancelled'
                  return (
                    <div style={{ background: isCancelled ? 'linear-gradient(135deg, #4a5568, #6c757d)' : 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,48,135,0.2)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.07, pointerEvents: 'none' }}><CreditCard size={120} color="white" /></div>
                      <div className="membership-inner" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CreditCard size={24} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '16px' }}>
                              {{ starter: 'Standard', active: 'Pro', athlete: 'Elite' }[membership.plan] || membership.plan} Membership
                            </p>
                            {isCancelled && (
                              <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancelled</span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                            <strong style={{ color: 'white', fontSize: '18px' }}>{membership.sessions_remaining}</strong>
                            <span> of {membership.sessions_per_month} sessions remaining</span>
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: '20px', width: 'fit-content' }}>
                            {selectedDog.photo_url ? <img src={selectedDog.photo_url} alt={selectedDog.name} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} /> : <PawPrint size={11} color="rgba(255,255,255,0.8)" />}
                            <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{selectedDog.name}</span>
                          </div>
                          {isCancelled && (
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                              Access until {new Date(membership.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <a href="/membership" className="membership-manage" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isCancelled ? 'Resubscribe' : 'Manage'} <ChevronRight size={14} />
                        </a>
                      </div>
                    </div>
                  )
                })()}

                {/* STAT CARDS */}
                <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Last Session', value: lastSessionDate || 'No sessions yet', icon: <Clock size={22} />, color: '#2c5a9e', bg: '#eef2fb' },
                    { label: 'Weekly Streak', value: streak > 0 ? `${streak} week${streak !== 1 ? 's' : ''}` : 'No streak yet', icon: <Flame size={22} />, color: '#f88124', bg: '#fff0ea' },
                    { label: 'Completed This Month', value: sessions.filter(s => { const d = new Date(s.session_date + 'T12:00:00'); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length, icon: <Calendar size={22} />, color: '#2c5a9e', bg: '#eef2fb' },
                  ].map(stat => (
                    <div key={stat.label} className="stat-card" style={{ backgroundColor: 'white', padding: '18px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                        {stat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: typeof stat.value === 'string' && stat.value.length > 8 ? '14px' : '22px', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* UPCOMING BOOKINGS */}
                {upcomingBookings.length > 0 && (
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
                    <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={17} color="#2c5a9e" />
                      </div>
                      <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px', fontWeight: '700' }}>Upcoming Sessions</h3>
                      <span style={{ marginLeft: 'auto', background: '#2c5a9e', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>{upcomingBookings.length}</span>
                    </div>
                    {upcomingBookings.map((booking, i) => {
                      const bookingDate = new Date(booking.booking_date + 'T12:00:00')
                      const hoursUntil = (new Date(booking.booking_date + 'T' + String(booking.slot_hour).padStart(2, '0') + ':00:00').getTime() - Date.now()) / (1000 * 60 * 60)
                      const canCancelFree = hoursUntil >= 48
                      const ampm = booking.slot_hour >= 12 ? 'PM' : 'AM'
                      const hour = booking.slot_hour > 12 ? booking.slot_hour - 12 : booking.slot_hour === 0 ? 12 : booking.slot_hour
                      return (
                        <div key={booking.id} className="booking-row" style={{ padding: '16px 20px', borderBottom: i < upcomingBookings.length - 1 ? '1px solid #f0f2f7' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{ width: '46px', height: '46px', background: '#f0f2f7', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#2c5a9e', lineHeight: 1 }}>{bookingDate.getDate()}</span>
                              <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{bookingDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 3px', fontWeight: '700', color: '#1a1a2e', fontSize: '15px' }}>
                                {bookingDate.toLocaleDateString('en-US', { weekday: 'long' })}
                              </p>
                              <p style={{ margin: 0, fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {hour}:00 {ampm} – {hour}:30 {ampm}
                              </p>
                              {!canCancelFree && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#f88124', fontWeight: '600' }}>⚠️ Less than 48hrs — cancellation fee may apply</p>}
                            </div>
                          </div>
                          <a href={`/cancel?booking=${booking.id}`} className="cancel-btn"
                            style={{ backgroundColor: '#fff0f0', color: '#dc3545', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', border: '1.5px solid #ffd0d0', flexShrink: 0 }}>
                            Cancel
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ACHIEVEMENTS */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
                  <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', background: '#fff5e6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={17} color="#f88124" />
                    </div>
                    <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px', fontWeight: '700' }}>Achievements</h3>
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#888' }}>{achievements.length}<span style={{ color: '#ccc' }}>/{allAchievements.length}</span></span>
                  </div>
                  <div className="card-body" style={{ padding: '20px 24px' }}>
                    {achievements.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Earned</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {allAchievements.filter(a => achievements.find(e => e.achievement_key === a.key)).map(a => {
                            const earned = achievements.find(e => e.achievement_key === a.key)
                            return (
                              <button key={a.key} onClick={() => setSelectedAchievement({ ...a, earned })}
                                style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', boxShadow: '0 3px 10px rgba(255,107,53,0.3)', transition: 'all 0.2s' }}>
                                <span style={{ fontSize: '15px' }}>{a.icon}</span> {a.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locked</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {allAchievements.filter(a => !achievements.find(e => e.achievement_key === a.key)).map(a => (
                          <button key={a.key} onClick={() => setSelectedAchievement({ ...a, earned: null })}
                            style={{ background: '#f0f2f7', color: '#999', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid #e5e8f0', transition: 'all 0.2s' }}>
                            <Lock size={11} /> {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACHIEVEMENT MODAL */}
                {selectedAchievement && (
                  <div onClick={() => setSelectedAchievement(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div onClick={e => e.stopPropagation()}
                      style={{ background: 'white', borderRadius: '20px', padding: '36px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeUp 0.25s ease' }}>
                      <div style={{ fontSize: '52px', marginBottom: '12px', lineHeight: 1 }}>{selectedAchievement.icon}</div>
                      <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>{selectedAchievement.label}</h3>
                      <p style={{ color: '#777', margin: '0 0 24px', fontSize: '15px', lineHeight: '1.5' }}>{selectedAchievement.description}</p>
                      {selectedAchievement.earned ? (
                        <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                          <CheckCircle size={16} /> Earned {new Date(selectedAchievement.earned.earned_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : (
                        <div style={{ background: '#f0f2f7', color: '#999', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                          <Lock size={15} /> Not yet earned
                        </div>
                      )}
                      <button onClick={() => setSelectedAchievement(null)}
                        style={{ padding: '11px 28px', background: '#2c5a9e', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* RECENT SESSIONS */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
                  <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', background: '#eef2fb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={17} color="#2c5a9e" />
                    </div>
                    <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px', fontWeight: '700' }}>Recent Sessions</h3>
                  </div>
                  {sessions.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                      <PawPrint size={40} color="#dde0ea" style={{ marginBottom: '12px' }} />
                      <p style={{ color: '#bbb', margin: 0, fontSize: '15px' }}>No sessions yet — book your first today!</p>
                    </div>
                  ) : (
                    sessions.map((session, i) => (
                      <div key={session.id} onClick={() => window.location.href = `/sessions/${session.id}`}
                        className="session-row"
                        style={{ padding: '16px 20px', borderBottom: i < sessions.length - 1 ? '1px solid #f0f2f7' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', background: '#f0f2f7', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#2c5a9e', lineHeight: 1 }}>{new Date(session.session_date).getDate()}</span>
                            <span style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>{new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 3px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                              {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                              {session.duration_minutes} min
                              {session.distance_miles ? ` · ${session.distance_miles} mi` : ''}
                              {session.calories_burned ? ` · ${session.calories_burned} cal` : ''}
                            </p>
                            {session.notes && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>{session.notes}</p>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          {session.activity_score && (
                            <div style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 8px rgba(255,107,53,0.3)' }}>
                              {session.activity_score}
                            </div>
                          )}
                          <ChevronRight size={16} color="#ccc" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* FRIENDS ACTIVITY */}
                {friendsActivity.length > 0 && (
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '20px' }}>
                    <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', background: '#fff0ea', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={17} color="#f88124" />
                      </div>
                      <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px', fontWeight: '700' }}>Friends Activity</h3>
                      <span style={{ marginLeft: 'auto', background: '#f88124', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>Last 7 days</span>
                    </div>
                    {friendsActivity.map((item, i) => {
                      const daysDiff = Math.floor((Date.now() - new Date(item.session_date).getTime()) / (1000 * 60 * 60 * 24))
                      const timeLabel = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`
                      return (
                        <div key={item.id} style={{ padding: '14px 20px', borderBottom: i < friendsActivity.length - 1 ? '1px solid #f0f2f7' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {item.dog?.photo_url ? (
                            <img src={item.dog.photo_url} alt={item.dog.name} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '2px solid #eef0f5' }} />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <PawPrint size={18} color="#ccc" />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                              {item.dog?.name} <span style={{ color: '#aaa', fontWeight: '400' }}>completed a session</span>
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>
                              {item.duration_minutes && `${item.duration_minutes} min`}
                              {item.distance_miles ? ` · ${item.distance_miles} mi` : ''}
                              {item.calories_burned ? ` · ${item.calories_burned} cal` : ''}
                            </p>
                          </div>
                          <span style={{ fontSize: '12px', color: '#bbb', flexShrink: 0 }}>{timeLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}