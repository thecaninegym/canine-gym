import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export async function POST(request: Request) {
  // Verify the caller is a logged-in user
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

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, dogs(id, owner_id, owners(id, name, email))')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Verify this booking belongs to the authenticated user
  const bookingOwnerEmail = (booking.dogs as any)?.owners?.email
  if (bookingOwnerEmail !== user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bookingDateTime = new Date(booking.booking_date + 'T' + String(booking.slot_hour).padStart(2, '0') + ':00:00')
  const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const isLate = hoursUntil < 48

  // ── INTRO PACKAGE CANCELLATION ─────────────────────────────
  if (booking.is_intro) {
    const PER_SESSION = 4250 // $42.50 in cents
    const INTRO_TOTAL = 8500 // $85.00 in cents

    // Find out how much has already been refunded on this payment intent
    // so we never over-refund across two cancellations
    let alreadyRefunded = 0
    if (booking.payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(
          booking.payment_intent_id,
          { expand: ['latest_charge.refunds'] }
        )
        const charge = (pi.latest_charge as any)
        if (charge?.refunds?.data) {
          alreadyRefunded = charge.refunds.data
            .filter((r: any) => r.status === 'succeeded')
            .reduce((sum: number, r: any) => sum + r.amount, 0)
        }
      } catch {}
    }

    const available = Math.max(INTRO_TOTAL - alreadyRefunded, 0)

    // Calculate refund amount based on policy
    let targetRefund = 0
    if (dogIsSick || !isLate) {
      // Full per-session refund
      targetRefund = PER_SESSION
    } else {
      // Late cancel: 50% of one session
      targetRefund = Math.floor(PER_SESSION / 2)
    }

    // Clamp to what is actually available to refund
    const refundAmount = Math.min(targetRefund, available)

    let refundStatus = 'none'
    if (refundAmount > 0 && booking.payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: refundAmount
        })
        if (refund.status === 'succeeded') {
          refundStatus = refundAmount === PER_SESSION ? 'full_refund' : 'partial_refund'
        } else {
          refundStatus = 'refund_failed'
        }
      } catch {
        refundStatus = 'refund_failed'
      }
    }

    // Mark this booking as cancelled
    await supabase.from('bookings').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      dog_is_sick: dogIsSick,
      cancellation_fee: refundStatus === 'partial_refund'
    }).eq('id', bookingId)

    // Check if the other intro booking for this payment is also cancelled
    // If both are cancelled and the dog has no completed sessions,
    // reset intro_purchased so they can rebuy the package
    if (booking.payment_intent_id) {
      const { data: otherBooking } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('payment_intent_id', booking.payment_intent_id)
        .neq('id', bookingId)
        .single()

      if (otherBooking?.status === 'cancelled') {
        const { count } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('dog_id', booking.dog_id)

        if ((count || 0) === 0) {
          await supabase.from('dogs')
            .update({ intro_purchased: false })
            .eq('id', booking.dog_id)
        }
      }
    }

    return NextResponse.json({ refundStatus, refundAmount })
  }

  // ── STANDARD CANCELLATION (membership or alacarte) ─────────
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('dog_id', booking.dog_id)
    .eq('status', 'active')
    .single()

  const dogIsCovered = !!membership

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