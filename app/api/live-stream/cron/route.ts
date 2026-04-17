import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID as string
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET as string
const muxAuth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron (not a random visitor)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const today = now.toISOString().split('T')[0]

  // AUTO-START: Find bookings starting now (at the top of their slot hour)
  // Only trigger in the first 2 minutes of the slot to avoid duplicate starts
  if (currentMinute <= 1) {
    const { data: bookingsToStart } = await supabase
      .from('bookings')
      .select('id, dog_id, dogs(id, name, owner_id, owners(name, phone, sms_consent))')
      .eq('booking_date', today)
      .eq('slot_hour', currentHour)
      .eq('status', 'confirmed')

    for (const booking of bookingsToStart || []) {
      // Check if stream already exists for this booking
      const { data: existingStream } = await supabase
        .from('live_streams')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('status', 'active')
        .single()

      if (existingStream) continue // Already streaming

      // Create Mux live stream
      try {
        const muxRes = await fetch('https://api.mux.com/video/v1/live-streams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${muxAuth}`
          },
          body: JSON.stringify({
            playback_policy: ['public'],
            new_asset_settings: { playback_policy: ['public'] },
            reduced_latency: true
          })
        })

        const muxData = await muxRes.json()
        const stream = muxData.data
        const owner = (booking.dogs as any)?.owners as any
        const dogName = (booking.dogs as any)?.name || 'your dog'
        const ownerId = (booking.dogs as any)?.owner_id

        const { data: liveStream } = await supabase
          .from('live_streams')
          .insert({
            booking_id: booking.id,
            dog_id: booking.dog_id,
            owner_id: ownerId,
            mux_stream_id: stream.id,
            mux_stream_key: stream.stream_key,
            mux_playback_id: stream.playback_ids[0].id,
            status: 'active'
          })
          .select()
          .single()

        // Send SMS
        if (owner?.phone && owner?.sms_consent && liveStream) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'live_stream_started',
              to: owner.phone,
              data: {
                ownerName: owner.name,
                dogName,
                watchUrl: `${process.env.NEXT_PUBLIC_APP_URL}/watch/${liveStream.id}`
              }
            })
          })
        }
      } catch (err) {
        console.error('Auto-start stream failed:', err)
      }
    }
  }

  // AUTO-STOP: Find active streams whose booking window has ended (30 min after slot hour)
  const { data: activeStreams } = await supabase
    .from('live_streams')
    .select('*, bookings(slot_hour, booking_date)')
    .eq('status', 'active')

  for (const stream of activeStreams || []) {
    const booking = stream.bookings as any
    if (!booking) continue

    const slotEnd = booking.slot_hour
    const endMinute = 30
    const bookingDate = booking.booking_date

    // Stop if: same day and current time is past slot_hour:30, OR different day
    if (bookingDate < today || (bookingDate === today && (currentHour > slotEnd || (currentHour === slotEnd && currentMinute >= endMinute)))) {
      try {
        await fetch(`https://api.mux.com/video/v1/live-streams/${stream.mux_stream_id}/complete`, {
          method: 'PUT',
          headers: { 'Authorization': `Basic ${muxAuth}` }
        })

        await supabase
          .from('live_streams')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', stream.id)
      } catch (err) {
        console.error('Auto-stop stream failed:', err)
      }
    }
  }

  return NextResponse.json({ success: true, timestamp: now.toISOString() })
}
