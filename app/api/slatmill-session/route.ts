import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const body = await request.json()

  // Verify the secret so only our ESP32 can post data
  if (body.secret !== process.env.SLATMILL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { duration_minutes, distance_miles, avg_speed_mph, peak_speed_mph, pulses, slatmill_id } = body

  // Basic validation
  if (!duration_minutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase.from('slatmill_sessions').insert({
    duration_minutes,
    distance_miles,
    avg_speed_mph,
    peak_speed_mph,
    pulses,
    slatmill_id: slatmill_id || 'slatmill_1',
    used: false
  })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}