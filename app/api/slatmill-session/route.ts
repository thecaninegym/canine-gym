import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

const nullIfUndefined = (val: any) => val === undefined ? null : val

export async function POST(request: Request) {
  const body = await request.json()

  // Verify the secret so only our ESP32 can post data
  if (body.secret !== process.env.SLATMILL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    duration_minutes, distance_miles, avg_speed_mph, peak_speed_mph,
    pulses, slatmill_id, pace_consistency, active_seconds,
    avg_acceleration, top_speed_duration,
    low_zone_seconds, moderate_zone_seconds, high_zone_seconds
  } = body

  // Basic validation
  if (!duration_minutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Sanity cap — reject obviously bad sensor readings (dog slatmill max ~15 mph)
  const MAX_SPEED = 15
  const safePeakSpeed = peak_speed_mph && peak_speed_mph <= MAX_SPEED ? peak_speed_mph : null
  const safeAvgSpeed = avg_speed_mph && avg_speed_mph <= MAX_SPEED ? avg_speed_mph : null

  const { error } = await supabase.from('slatmill_sessions').insert({
    duration_minutes,
    distance_miles,
    avg_speed_mph: safeAvgSpeed,
    peak_speed_mph: safePeakSpeed,
    pulses,
    slatmill_id: slatmill_id || 'slatmill_1',
    // Use nullIfUndefined so 0 is stored as 0, not converted to null
    pace_consistency: nullIfUndefined(pace_consistency),
    active_seconds: nullIfUndefined(active_seconds),
    avg_acceleration: nullIfUndefined(avg_acceleration),
    top_speed_duration: nullIfUndefined(top_speed_duration),
    low_zone_seconds: nullIfUndefined(low_zone_seconds),
    moderate_zone_seconds: nullIfUndefined(moderate_zone_seconds),
    high_zone_seconds: nullIfUndefined(high_zone_seconds),
    used: false
  })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
