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

  const now = new Date()

  // Calculate dates for day 2 and day 5 owners
  const day2Start = new Date(now); day2Start.setDate(now.getDate() - 2); day2Start.setHours(0, 0, 0, 0)
  const day2End = new Date(now); day2End.setDate(now.getDate() - 2); day2End.setHours(23, 59, 59, 999)
  const day5Start = new Date(now); day5Start.setDate(now.getDate() - 5); day5Start.setHours(0, 0, 0, 0)
  const day5End = new Date(now); day5End.setDate(now.getDate() - 5); day5End.setHours(23, 59, 59, 999)

  // Get owners who signed up exactly 2 days ago
  const { data: day2Owners } = await supabase
    .from('owners')
    .select('id, name, email, dogs(name)')
    .gte('created_at', day2Start.toISOString())
    .lte('created_at', day2End.toISOString())

  // Get owners who signed up exactly 5 days ago
  const { data: day5Owners } = await supabase
    .from('owners')
    .select('id, name, email, dogs(name)')
    .gte('created_at', day5Start.toISOString())
    .lte('created_at', day5End.toISOString())

  // Get all owners who have at least one booking (any status)
  const { data: bookedOwners } = await supabase
    .from('bookings')
    .select('dogs(owner_id)')

  const bookedOwnerIds = new Set(
    (bookedOwners || []).map((b: any) => b.dogs?.owner_id).filter(Boolean)
  )

  let sent = 0

  // Send day 2 emails to owners who haven't booked
  for (const owner of day2Owners || []) {
    if (bookedOwnerIds.has(owner.id)) continue
    if (!owner.email) continue
    const dogName = (owner.dogs as any)?.[0]?.name || 'your dog'

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'onboarding_day2',
        to: owner.email,
        data: { ownerName: owner.name, dogName }
      })
    })
    sent++
  }

  // Send day 5 emails to owners who still haven't booked
  for (const owner of day5Owners || []) {
    if (bookedOwnerIds.has(owner.id)) continue
    if (!owner.email) continue
    const dogName = (owner.dogs as any)?.[0]?.name || 'your dog'

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'onboarding_day5',
        to: owner.email,
        data: { ownerName: owner.name, dogName }
      })
    })
    sent++
  }

  return NextResponse.json({
    success: true,
    sent,
    day2Checked: day2Owners?.length || 0,
    day5Checked: day5Owners?.length || 0,
  })
}