import { supabase } from './supabase'

const ACHIEVEMENTS = [
  {
    key: 'first_stride',
    label: 'First Stride 🐾',
    check: (sessions) => sessions.length >= 1
  },
  {
    key: 'finding_their_pace',
    label: 'Finding Their Pace',
    check: (sessions) => sessions.length >= 5
  },
  {
    key: 'ten_and_counting',
    label: 'Ten and Counting',
    check: (sessions) => sessions.length >= 10
  },
  {
    key: 'century_club',
    label: 'Century Club 💯',
    check: (sessions) => sessions.length >= 100
  },
  {
    key: 'marathon_pup',
    label: 'Marathon Pup 🏅',
    check: (sessions) => sessions.reduce((sum, s) => sum + (s.distance_miles || 0), 0) >= 26.2
  },
  {
    key: 'calorie_crusher',
    label: 'Calorie Crusher 🔥',
    check: (sessions) => sessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0) >= 1000
  },
  {
    key: 'speed_demon',
    label: 'Speed Demon ⚡',
    check: (sessions) => sessions.some(s => (s.peak_intensity || 0) >= 90)
  },
  {
    key: 'personal_best_miles',
    label: 'Personal Best 🎯',
    check: (sessions) => {
      if (sessions.length < 2) return false
      const latest = sessions[0].distance_miles || 0
      const previous = sessions.slice(1).map(s => s.distance_miles || 0)
      return latest > 0 && latest > Math.max(...previous)
    }
  },
  {
    key: 'on_a_roll',
    label: 'On A Roll',
    check: (sessions) => hasWeeklyStreak(sessions, 2)
  },
  {
    key: 'hat_trick',
    label: 'Hat Trick',
    check: (sessions) => hasWeeklyStreak(sessions, 3)
  },
  {
    key: 'hot_streak',
    label: 'Hot Streak',
    check: (sessions) => hasWeeklyStreak(sessions, 4)
  },
  {
    key: 'unstoppable',
    label: 'Unstoppable',
    check: (sessions) => hasWeeklyStreak(sessions, 12)
  },
  {
    key: 'comeback_kid',
    label: 'Comeback Kid',
    check: (sessions) => {
      if (sessions.length < 2) return false
      const sorted = [...sessions].sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
      const latest = new Date(sorted[0].session_date)
      const previous = new Date(sorted[1].session_date)
      const daysDiff = (latest - previous) / (1000 * 60 * 60 * 24)
      return daysDiff >= 14
    }
  }
]

function hasWeeklyStreak(sessions, weeks) {
  if (sessions.length < weeks) return false
  const sorted = [...sessions].sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
  const weekNumbers = sorted.map(s => {
    const date = new Date(s.session_date)
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    return Math.floor((date - startOfYear) / (7 * 24 * 60 * 60 * 1000))
  })
  const uniqueWeeks = [...new Set(weekNumbers)]
  let streak = 1
  for (let i = 1; i < uniqueWeeks.length; i++) {
    if (uniqueWeeks[i - 1] - uniqueWeeks[i] === 1) {
      streak++
      if (streak >= weeks) return true
    } else {
      streak = 1
    }
  }
  return streak >= weeks
}

export async function checkAchievements(dogId) {
  // Get all sessions for this dog
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('dog_id', dogId)
    .order('session_date', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  // Get already earned achievements
  const { data: earned } = await supabase
    .from('dog_achievements')
    .select('achievement_key')
    .eq('dog_id', dogId)

  const earnedKeys = new Set((earned || []).map(a => a.achievement_key))
  const newAchievements = []

  for (const achievement of ACHIEVEMENTS) {
    if (!earnedKeys.has(achievement.key) && achievement.check(sessions)) {
      const { error } = await supabase
        .from('dog_achievements')
        .insert([{
          dog_id: dogId,
          achievement_key: achievement.key,
          displayed: false
        }])

      if (!error) {
        newAchievements.push(achievement)
      }
    }
  }

  return newAchievements
}