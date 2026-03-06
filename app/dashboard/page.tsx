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

      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*, leaderboard_settings(city, visibility)')
        .eq('owner_id', ownerData.id)
        .order('name')

      setDogs(dogsData || [])
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

  const achievementLabels: Record<string, string> = {
    first_stride: '🐾 First Stride',
    finding_their_pace: '🏃 Finding Their Pace',
    ten_and_counting: '🔟 Ten and Counting',
    century_club: '💯 Century Club',
    marathon_pup: '🏅 Marathon Pup',
    calorie_crusher: '🔥 Calorie Crusher',
    speed_demon: '⚡ Speed Demon',
    personal_best_miles: '🎯 Personal Best',
    on_a_roll: '🔄 On A Roll',
    hat_trick: '🎩 Hat Trick',
    hot_streak: '🌶️ Hot Streak',
    unstoppable: '💪 Unstoppable',
    comeback_kid: '🔙 Comeback Kid'
  }

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
          <button onClick={handleLogout} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
        {dogs.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '18px' }}>No dogs found for your account. Contact The Canine Gym to get set up!</p>
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
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '28px' }}>🐾 {selectedDog.name}</h2>
                    <p style={{ margin: 0, opacity: 0.8 }}>{selectedDog.leaderboard_settings?.city} · The Canine Gym</p>
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

                {achievements.length > 0 && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                      <h3 style={{ margin: 0, color: '#003087' }}>🏆 Achievements ({achievements.length})</h3>
                    </div>
                    <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {achievements.map(achievement => (
                        <div key={achievement.id} style={{ backgroundColor: '#FF6B35', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                          {achievementLabels[achievement.achievement_key] || achievement.achievement_key}
                        </div>
                      ))}
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
                      <div key={session.id} style={{ padding: '16px 24px', borderBottom: i < sessions.length - 1 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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