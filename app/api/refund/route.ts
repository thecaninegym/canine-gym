import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const { bookingId, reason, dogIsSick } = await request.json()

  // Get the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, dogs(id, owner_id, owners(id, name, email))')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Check if THIS specific dog is covered by an active membership
  const ownerId = booking.dogs?.owners?.id
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .single()

  const dogIsCovered = !!(membership && membership.dog_ids && membership.dog_ids.includes(booking.dog_id))

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