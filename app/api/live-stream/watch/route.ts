import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing stream ID' }, { status: 400 })

  const { data: stream } = await supabase
    .from('live_streams')
    .select('*, dogs(name)')
    .eq('id', id)
    .single()

  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

  return NextResponse.json({
    playbackId: stream.mux_playback_id,
    status: stream.status,
    dogName: stream.dogs?.name || ''
  })
}
