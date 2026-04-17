import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function GET() {
  const { data: activeStream } = await supabase
    .from('live_streams')
    .select('id, mux_stream_key')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (activeStream) {
    return NextResponse.json({ active: true, streamKey: activeStream.mux_stream_key })
  }

  return NextResponse.json({ active: false })
}
