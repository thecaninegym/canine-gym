import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service key client — bypasses RLS to update sessions_remaining
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

// Anon key client — for verifying the user's session token
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export async function POST(request: Request) {
  // 1. Verify the caller is a logged-in admin
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. All checks passed — decrement sessions (existing logic unchanged)
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
