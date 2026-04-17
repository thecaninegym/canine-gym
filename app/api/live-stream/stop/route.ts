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
  const { streamId } = await request.json()

  try {
    // Get the live stream from DB
    const { data: liveStream } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .single()

    if (!liveStream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

    // Signal Mux to complete the stream
    await fetch(`https://api.mux.com/video/v1/live-streams/${liveStream.mux_stream_id}/complete`, {
      method: 'PUT',
      headers: { 'Authorization': `Basic ${muxAuth}` }
    })

    // Update DB
    await supabase
      .from('live_streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', streamId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
