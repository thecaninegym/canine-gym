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

  // === RESET PASS ===
  // If an owner has a completed session AFTER their last reengagement email was sent,
  // their cycle resets so they can receive future nudges if they lapse again.
  const { data: toReset } = await supabase
    .from('owners')
    .select('id, last_reengagement_sent_at, dogs(sessions(session_date, status))')
    .not('reengagement_stage', 'is', null)

  for (const owner of toReset || []) {
    if (!owner.last_reengagement_sent_at) continue
    const sentAt = new Date(owner.last_reengagement_sent_at)
    const dogs = (owner.dogs as any) || []
    const hasNewerSession = dogs.some((dog: any) =>
      (dog.sessions || []).some((s: any) =>
        new Date(s.session_date) > sentAt
      )
    )
    if (hasNewerSession) {
      await supabase
        .from('owners')
        .update({ reengagement_stage: null, last_reengagement_sent_at: null })
        .eq('id', owner.id)
    }
  }

  // === FIND OWNERS ELIGIBLE FOR NUDGE ===
  // Get all owners who have not unsubscribed, and have completed at least one session
  const { data: owners } = await supabase
    .from('owners')
    .select('id, name, email, reengagement_stage, last_reengagement_sent_at, dogs(name, sessions(session_date, status), bookings(booking_date, status))')
    .eq('email_unsubscribed', false)

  const today = now.toISOString().split('T')[0]
  let sent14 = 0
  let sent30 = 0

  for (const owner of owners || []) {
    if (!owner.email) continue

    const dogs = (owner.dogs as any) || []

    // Find last completed session across all dogs
    let lastSessionDate: Date | null = null
    let dogName = 'your dog'
    for (const dog of dogs) {
      for (const session of dog.sessions || []) {
        if (session.session_date) {
          const d = new Date(session.session_date)
          if (!lastSessionDate || d > lastSessionDate) {
            lastSessionDate = d
            dogName = dog.name
          }
        }
      }
    }

    // Skip if no completed sessions (never been a client)
    if (!lastSessionDate) continue

    const daysSince = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check for any confirmed future bookings
    const hasFutureBooking = dogs.some((dog: any) =>
      (dog.bookings || []).some((b: any) =>
        b.status === 'confirmed' && b.booking_date >= today
      )
    )

    if (hasFutureBooking) continue

    const stage = owner.reengagement_stage

    // === 14-DAY NUDGE ===
    // Eligible if: 14+ days since last session, no future booking, stage is null (fresh cycle)
    if (daysSince >= 14 && stage === null) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reengagement_14',
          to: owner.email,
          data: { ownerName: owner.name, dogName, daysSince, ownerId: owner.id }
        })
      })

      await supabase
        .from('owners')
        .update({ reengagement_stage: 1, last_reengagement_sent_at: now.toISOString() })
        .eq('id', owner.id)

      sent14++
      continue
    }

    // === 30-DAY NUDGE ===
    // Eligible if: 28+ days since last session, no future booking, stage = 1 (already got 14-day email)
    if (daysSince >= 28 && stage === 1) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reengagement_30',
          to: owner.email,
          data: { ownerName: owner.name, dogName, daysSince, ownerId: owner.id }
        })
      })

      await supabase
        .from('owners')
        .update({ reengagement_stage: 2, last_reengagement_sent_at: now.toISOString() })
        .eq('id', owner.id)

      sent30++
    }
  }

  return NextResponse.json({ success: true, sent14, sent30 })
}