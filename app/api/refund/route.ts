import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// Service key client — for all database operations
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
  // 1. Verify the caller is a logged-in user
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingId, reason, dogIsSick } = await request.json()

  // Get the booking (same query as before — needed for refund logic below)
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, dogs(id, owner_id, owners(id, name, email))')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // 2. Verify this booking belongs to the authenticated user.
  //    Without this check, any logged-in user could cancel (and refund) anyone else's booking.
  const bookingOwnerEmail = (booking.dogs as any)?.owners?.email
  if (bookingOwnerEmail !== user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // --- All existing refund logic unchanged below this line ---

  // Find this dog's own active membership (per-dog model)
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('dog_id', booking.dog_id)
    .eq('status', 'active')
    .single()

  const dogIsCovered = !!membership

  const bookingDateTime = new Date(booking.booking_date + 'T' + String(booking.slot_hour).padStart(2, '0') + ':00:00')
  const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const isLate = hoursUntil < 48

  let refundStatus = 'none'
  let refundAmount = 0

  if (dogIsSick) {
    if (!dogIsCovered && booking.payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: booking.amount_paid
      })
      refundAmount = booking.amount_paid
      refundStatus = refund.status === 'succeeded' ? 'full_refund' : 'refund_failed'
    } else if (dogIsCovered) {
      await supabase.from('memberships')
        .update({ sessions_remaining: membership.sessions_remaining + 1 })
        .eq('id', membership.id)
      refundStatus = 'session_restored'
    }
  } else if (isLate) {
    if (!dogIsCovered && booking.payment_intent_id) {
      const halfAmount = Math.floor(booking.amount_paid / 2)
      const refund = await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: halfAmount
      })
      refundAmount = halfAmount
      refundStatus = refund.status === 'succeeded' ? 'partial_refund' : 'refund_failed'
    } else if (dogIsCovered) {
      refundStatus = 'session_forfeited'
    }
  } else {
    if (!dogIsCovered && booking.payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: booking.amount_paid
      })
      refundAmount = booking.amount_paid
      refundStatus = refund.status === 'succeeded' ? 'full_refund' : 'refund_failed'
    } else if (dogIsCovered) {
      await supabase.from('memberships')
        .update({ sessions_remaining: membership.sessions_remaining + 1 })
        .eq('id', membership.id)
      refundStatus = 'session_restored'
    }
  }

  await supabase.from('bookings').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
    dog_is_sick: dogIsSick,
    cancellation_fee: refundStatus === 'partial_refund'
  }).eq('id', bookingId)

  return NextResponse.json({ refundStatus, refundAmount })
}
