import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const { dogId } = await request.json()
  const { data: membership } = await supabase
    .from('memberships')
    .select('id, sessions_remaining')
    .eq('dog_id', dogId)
    .eq('status', 'active')
    .single()

  if (membership && membership.sessions_remaining > 0) {
    await supabase.from('memberships')
      .update({ sessions_remaining: membership.sessions_remaining - 1 })
      .eq('id', membership.id)
  }
  return NextResponse.json({ success: true })
}