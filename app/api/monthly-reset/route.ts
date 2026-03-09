import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  const firstOfLastMonth = lastMonth.toISOString().split('T')[0]
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // Get all dogs with leaderboard settings
  const { data: settings } = await supabase
    .from('leaderboard_settings')
    .select('*, dogs(id, name)')

  if (!settings) return NextResponse.json({ error: 'No settings found' })

  const dogIds = settings.map(s => s.dog_id)

  // Get last month's sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('dog_id, distance_miles, calories_burned')
    .in('dog_id', dogIds)
    .gte('session_date', firstOfLastMonth)
    .lt('session_date', firstOfThisMonth)

  // Aggregate stats
  const statsMap: Record<string, any> = {}
  dogIds.forEach(id => {
    statsMap[id] = { session_count: 0, total_miles: 0, total_calories: 0 }
  })
  sessions?.forEach(s => {
    if (statsMap[s.dog_id]) {
      statsMap[s.dog_id].session_count++
      statsMap[s.dog_id].total_miles += s.distance_miles || 0
      statsMap[s.dog_id].total_calories += s.calories_burned || 0
    }
  })

  // Save snapshots
  const categories = [
    { key: 'sessions', field: 'session_count' },
    { key: 'miles', field: 'total_miles' },
    { key: 'calories', field: 'total_calories' },
  ]

  for (const category of categories) {
    const sorted = [...settings]
      .map(s => ({ ...s, value: statsMap[s.dog_id]?.[category.field] || 0 }))
      .sort((a, b) => b.value - a.value)

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i]
      const cityEntries = sorted.filter(e => e.city === entry.city)
      const cityRank = cityEntries.findIndex(e => e.dog_id === entry.dog_id) + 1

      await supabase.from('leaderboard_snapshots').insert([{
        dog_id: entry.dog_id,
        month: monthKey,
        category: category.key,
        value: entry.value,
        rank_overall: i + 1,
        rank_local: cityRank,
        city: entry.city
      }])
    }
  }

  // Get all owners for the new month email
  const { data: owners } = await supabase
    .from('owners')
    .select('name, email')

  // Send new month email to all owners
  for (const owner of owners || []) {
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: owner.email,
      subject: `🏆 New month, new leaderboard — who's taking #1?`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #eee;">
            <h2 style="color:#2c5a9e;">Hi ${owner.name}! A new month has started. 🎉</h2>
            <p style="color:#555;">The leaderboard has reset and it's anyone's game. Book a session this week and get your dog on the board early!</p>
            <a href="https://app.thecaninegym.com/leaderboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin:24px 0;">
              View the New Leaderboard →
            </a>
            <p style="color:#999;font-size:13px;">Book a session at thecaninegym.com</p>
          </div>
          <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN</p>
          </div>
        </div>
      `
    })
  }

  return NextResponse.json({ success: true, month: monthKey, ownersNotified: owners?.length })
}