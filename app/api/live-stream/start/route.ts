import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID as string
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET as string
const muxAuth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')

export async function POST(request: Request) {
  const { bookingId, dogId, ownerId } = await request.json()

  try {
    // Create Mux live stream
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
console.log('Mux response:', JSON.stringify(muxData))

    // Save to DB
    const { data: liveStream, error: dbError } = await supabase
      .from('live_streams')
      .insert({
        booking_id: bookingId,
        dog_id: dogId,
        owner_id: ownerId,
        mux_stream_id: stream.id,
        mux_stream_key: stream.stream_key,
        mux_playback_id: stream.playback_ids[0].id,
        status: 'active'
      })
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Send SMS to owner with watch link
    const { data: ownerData } = await supabase
      .from('owners')
      .select('name, phone, sms_consent')
      .eq('id', ownerId)
      .single()

    const { data: dogData } = await supabase
      .from('dogs')
      .select('name')
      .eq('id', dogId)
      .single()

    if (ownerData?.phone && ownerData?.sms_consent) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'live_stream_started',
          to: ownerData.phone,
          data: {
            ownerName: ownerData.name,
            dogName: dogData?.name || 'your dog',
            watchUrl: `${process.env.NEXT_PUBLIC_APP_URL}/watch/${liveStream.id}`
          }
        })
      })
    }

    // Admin notification email
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        to: 'dev@thecaninegym.com',
        data: {
          action: 'Live Stream Started',
          dogName: dogData?.name,
          ownerName: ownerData?.name,
          date: new Date().toLocaleString(),
          time: ''
        }
      })
    })

    return NextResponse.json({
      streamId: liveStream.id,
      streamKey: stream.stream_key,
      playbackId: stream.playback_ids[0].id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
