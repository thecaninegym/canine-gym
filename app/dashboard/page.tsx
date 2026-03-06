'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      const { data: ownerData } = await supabase
        .from('owners')
        .select('*')
        .eq('email', user.email)
        .single()

      if (!ownerData) { setLoading(false); return }
      setHasAddress(!!(ownerData.address && ownerData.city))
      setHasWaiver(!!(ownerData.waiver_signed))

      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*, leaderboard_settings(city, visibility)')
        .eq('owner_id', ownerData.id)
        .order('name')

      setDogs(dogsData || [])
      setHasDogs((dogsData || []).length > 0)
      if (dogsData && dogsData.length > 0) {
        setSelectedDog(dogsData[0])
        fetchSessions(dogsData[0].id)
        fetchAchievements(dogsData[0].id)
        fetchUpcomingBookings(dogsData[0].id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const fetchSessions = async (dogId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('dog_id', dogId)
      .order('session_date', { ascending: false })
      .limit(20)
    setSessions(data || [])
  }

  const fetchAchievements = async (dogId: string) => {
    const { data } = await supabase
      .from('dog_achievements')
      .select('*')
      .eq('dog_id', dogId)
      .order('earned_at', { ascending: false })
    setAchievements(data || [])
  }

  const fetchUpcomingBookings = async (dogId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('dog_id', dogId)
      .eq('status', 'confirmed')
      .gte('booking_date', today)
      .order('booking_date')
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

  const allAchievements = [
    { key: 'first_stride', label: '🐾 First Stride', description: 'Complete your first session' },
    { key: 'finding_their_pace', label: '🏃 Finding Their Pace', description: 'Complete 5 sessions' },
    { key: 'ten_and_counting', label: '🔟 Ten and Counting', description: 'Complete 10 sessions' },
    { key: 'century_club', label: '💯 Century Club', description: 'Complete 100 sessions' },
    { key: 'marathon_pup', label: '🏅 Marathon Pup', description: 'Run 26.2 total miles' },
    { key: 'calorie_crusher', label: '🔥 Calorie Crusher', description: 'Burn 1,000 total calories' },
    { key: 'speed_demon', label: '⚡ Speed Demon', description: 'Hit 90%+ peak intensity in a session' },
    { key: 'personal_best_miles', label: '🎯 Personal Best', description: 'Beat your previous distance record' },
    { key: 'on_a_roll', label: '🔄 On A Roll', description: 'Book sessions 2 weeks in a row' },
    { key: 'hat_trick', label: '🎩 Hat Trick', description: 'Book sessions 3 weeks in a row' },
    { key: 'hot_streak', label: '🌶️ Hot Streak', description: 'Book sessions 4 weeks in a row' },
    { key: 'unstoppable', label: '💪 Unstoppable', description: 'Book sessions 12 weeks in a row' },
    { key: 'comeback_kid', label: '🔙 Comeback Kid', description: 'Return after a 2+ week absence' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🐾 The Canine Gym</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/leaderboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🏆 Leaderboard</a>
          <a href="/dogs" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🐾 My Dogs</a>
          <a href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>👤 Profile</a>
          <a href="/membership" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>💳 Membership</a>
          <button onClick={handleLogout} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        {!hasAddress || !hasDogs || !hasWaiver ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', padding: '48px 40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐾</div>
              <h2 style={{ color: '#003087', margin: '0 0 12px 0' }}>Welcome to The Canine Gym!</h2>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>The run comes to you. Complete these steps to book your first session.</p>
              <div style={{ display: 'grid', gap: '16px', textAlign: 'left', marginBottom: '32px' }}>

                {/* Step 1 - Address */}
                {hasAddress ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#d4edda', padding: '20px', borderRadius: '12px', border: '2px solid #28a745' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>✅</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#155724', fontSize: '16px' }}>Step 1 — Address Added</p>
                      <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>We know where to find you on session day!</p>
                    </div>
                  </div>
                ) : (
                  <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '12px', textDecoration: 'none', border: '2px solid #FF6B35' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>👤</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>Step 1 — Add Your Address</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>We come to your home — we need your address to find you on session day!</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#FF6B35', fontWeight: 'bold', fontSize: '20px', flexShrink: 0 }}>→</div>
                  </a>
                )}

                {/* Step 2 - Dog */}
                {hasDogs ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#d4edda', padding: '20px', borderRadius: '12px', border: '2px solid #28a745' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>✅</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#155724', fontSize: '16px' }}>Step 2 — Dog Added</p>
                      <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>Your dog is ready to run!</p>
                    </div>
                  </div>
                ) : (
                  <a href="/dogs" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '12px', textDecoration: 'none', border: '2px solid #003087' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>🐾</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>Step 2 — Add Your Dog</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Add your dog's details to start tracking sessions and booking.</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#003087', fontWeight: 'bold', fontSize: '20px', flexShrink: 0 }}>→</div>
                  </a>
                )}

                {/* Step 3 - Waiver */}
                {hasWaiver ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#d4edda', padding: '20px', borderRadius: '12px', border: '2px solid #28a745' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>✅</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#155724', fontSize: '16px' }}>Step 3 — Waiver Signed</p>
                      <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>You're legally all set!</p>
                    </div>
                  </div>
                ) : (
                  <a href="/waiver" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '12px', textDecoration: 'none', border: '2px solid #003087' }}>
                    <div style={{ fontSize: '36px', flexShrink: 0 }}>✍️</div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>Step 3 — Sign Waiver</p>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Read and sign our liability waiver before your first session.</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#003087', fontWeight: 'bold', fontSize: '20px', flexShrink: 0 }}>→</div>
                  </a>
                )}

              </div>
              {hasAddress && hasDogs && hasWaiver ? (
                <a href="/book" style={{ display: 'inline-block', backgroundColor: '#FF6B35', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
                  📅 Book Your First Session →
                </a>
              ) : (
                <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>Complete all steps above to book your first session!</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {dogs.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {dogs.map(dog => (
                  <button key={dog.id} onClick={() => handleDogSelect(dog)}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', backgroundColor: selectedDog?.id === dog.id ? '#003087' : 'white', color: selectedDog?.id === dog.id ? 'white' : '#003087' }}>
                    🐾 {dog.name}
                  </button>
                ))}
              </div>
            )}

            {selectedDog && (
              <>
                <div style={{ backgroundColor: '#003087', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {selectedDog.photo_url ? (
                      <img src={selectedDog.photo_url} alt={selectedDog.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>🐾</div>
                    )}
                    <div>
                      <h2 style={{ margin: '0 0 4px 0', fontSize: '28px' }}>{selectedDog.name}</h2>
                      <p style={{ margin: 0, opacity: 0.8 }}>{selectedDog.leaderboard_settings?.city} · The Canine Gym</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href="/book" style={{ backgroundColor: 'white', color: '#003087', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>📅 Book</a>
                    <a href={`/api/session-card?dog=${encodeURIComponent(selectedDog.name)}&sessions=${totalSessions}&miles=${totalMiles}&calories=${totalCalories}&city=${encodeURIComponent(selectedDog.leaderboard_settings?.city || '')}`} target="_blank" style={{ backgroundColor: '#FF6B35', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>📸 Share</a>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Sessions', value: totalSessions, icon: '🏃' },
                    { label: 'Total Miles', value: totalMiles, icon: '📍' },
                    { label: 'Calories Burned', value: totalCalories.toLocaleString(), icon: '🔥' },
                  ].map(stat => (
                    <div key={stat.label} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#003087' }}>{stat.value}</div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

{upcomingBookings.length > 0 && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                      <h3 style={{ margin: 0, color: '#003087' }}>📅 Upcoming Sessions</h3>
                    </div>
                    {upcomingBookings.map((booking, i) => {
                      const bookingDate = new Date(booking.booking_date + 'T12:00:00')
                      const hoursUntil = (new Date(booking.booking_date + 'T' + String(booking.slot_hour).padStart(2, '0') + ':00:00').getTime() - Date.now()) / (1000 * 60 * 60)
                      const canCancelFree = hoursUntil >= 48
                      const ampm = booking.slot_hour >= 12 ? 'PM' : 'AM'
                      const hour = booking.slot_hour > 12 ? booking.slot_hour - 12 : booking.slot_hour === 0 ? 12 : booking.slot_hour
                      return (
                        <div key={booking.id} style={{ padding: '16px 24px', borderBottom: i < upcomingBookings.length - 1 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>
                              {bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{hour}:00 {ampm} – {hour}:30 {ampm}</p>
                            {!canCancelFree && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#FF6B35' }}>⚠️ Less than 48hrs — cancellation fee may apply</p>}
                          </div>
                          <a href={`/cancel?booking=${booking.id}`}
                            style={{ backgroundColor: '#f5f5f5', color: '#dc3545', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', border: '1px solid #dc3545' }}>
                            Cancel
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, color: '#003087' }}>🏆 Achievements ({achievements.length}/{allAchievements.length})</h3>
                  </div>
                  <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {allAchievements.map(a => {
                      const earned = achievements.find(e => e.achievement_key === a.key)
                      return (
                        <div key={a.key} onClick={() => setSelectedAchievement({ ...a, earned })}
                          style={{ backgroundColor: earned ? '#FF6B35' : '#e0e0e0', color: earned ? 'white' : '#999', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}>
                          {a.label}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Achievement modal */}
                {selectedAchievement && (
                  <div onClick={() => setSelectedAchievement(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()}
                      style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{selectedAchievement.label.split(' ')[0]}</div>
                      <h3 style={{ color: '#003087', margin: '0 0 8px 0', fontSize: '20px' }}>{selectedAchievement.label.split(' ').slice(1).join(' ')}</h3>
                      <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: '15px' }}>{selectedAchievement.description}</p>
                      {selectedAchievement.earned ? (
                        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                          ✅ Earned on {new Date(selectedAchievement.earned.earned_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#f0f0f0', color: '#999', padding: '10px 16px', borderRadius: '8px', fontSize: '14px' }}>
                          🔒 Not yet earned
                        </div>
                      )}
                      <button onClick={() => setSelectedAchievement(null)}
                        style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#003087', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                        Close
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, color: '#003087' }}>Recent Sessions</h3>
                  </div>
                  {sessions.length === 0 ? (
                    <p style={{ padding: '24px', color: '#666', margin: 0 }}>No sessions yet — book your first session today!</p>
                  ) : (
                    sessions.map((session, i) => (
                      <div key={session.id} onClick={() => window.location.href = `/sessions/${session.id}`} style={{ padding: '16px 24px', borderBottom: i < sessions.length - 1 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>
                            {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                            {session.duration_minutes} min
                            {session.distance_miles ? ` · ${session.distance_miles} miles` : ''}
                            {session.calories_burned ? ` · ${session.calories_burned} cal` : ''}
                          </p>
                          {session.notes && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#999', fontStyle: 'italic' }}>{session.notes}</p>}
                            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#FF6B35', fontWeight: 'bold' }}>View Details →</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {session.activity_score && (
                            <div style={{ backgroundColor: '#FF6B35', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                              Score: {session.activity_score}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}