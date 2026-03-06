import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const dateStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Get all confirmed bookings for tomorrow
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, dogs(name, owners(name, email))')
    .eq('booking_date', tomorrowStr)
    .eq('status', 'confirmed')

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No bookings tomorrow' })
  }

  let sent = 0

  for (const booking of bookings) {
    const h = booking.slot_hour
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`

    const ownerEmail = booking.dogs?.owners?.email
    const ownerName = booking.dogs?.owners?.name
    const dogName = booking.dogs?.name

    if (!ownerEmail) continue

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reminder',
        to: ownerEmail,
        data: { ownerName, dogName, date: dateStr, time: timeStr }
      })
    })

    sent++
  }

  return NextResponse.json({ success: true, sent, date: tomorrowStr })
}