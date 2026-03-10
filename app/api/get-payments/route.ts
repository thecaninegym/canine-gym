import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('owner_id')
  if (!ownerId) return NextResponse.json([])

  const { data } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}