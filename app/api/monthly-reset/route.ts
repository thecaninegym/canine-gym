import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://www.thecaninegym.com/logo.png'
const BLUE = '#2c5a9e'
const ORANGE = '#f88124'
const DARK_BLUE = '#001840'

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
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style="margin:0;padding:0;background:#f0f2f7;font-family:'Montserrat',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:white;padding:28px 32px;text-align:center;border-bottom:3px solid ${ORANGE};">
      <img src="${LOGO_URL}" alt="The Canine Gym" style="height:70px;width:auto;display:block;margin:0 auto 12px;"/>
      <div style="display:inline-block;background:${DARK_BLUE};border-radius:20px;padding:4px 16px;"><span style="color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">New Month</span></div>
    </div>
    <div style="background:white;padding:36px 32px;">
      <h2 style="color:${BLUE};font-size:22px;font-weight:800;margin:0 0 10px;font-family:'Montserrat',Arial,sans-serif;">Hi ${owner.name}! A new month has started. 🎉</h2>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:'Montserrat',Arial,sans-serif;">The leaderboard has reset and it's anyone's game. Book a session this week and get your dog on the board early!</p>
      <a href="https://app.thecaninegym.com/leaderboard" style="display:block;background:${ORANGE};color:white;text-align:center;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Montserrat',Arial,sans-serif;margin-top:8px;">View the New Leaderboard →</a>
    </div>
    <div style="background:${DARK_BLUE};padding:20px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Montserrat',Arial,sans-serif;">© ${new Date().getFullYear()} The Canine Gym &nbsp;·&nbsp; Hamilton County, IN &nbsp;·&nbsp; <a href="https://www.thecaninegym.com" style="color:rgba(255,255,255,0.5);text-decoration:none;">thecaninegym.com</a></p>
    </div>
  </div>
</body></html>`
    })
  }

  return NextResponse.json({ success: true, month: monthKey, ownersNotified: owners?.length })
}