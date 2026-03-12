import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const { ownerId, ownerEmail, type, plan, dogCount, dogIds, bookingDate, slotHour, isAddon } = await request.json()

  const getPriceId = () => {
    if (type === 'alacarte') {
      return dogCount >= 2
        ? process.env.STRIPE_PRICE_ALACARTE_2DOGS!
        : process.env.STRIPE_PRICE_ALACARTE_1DOG!
    }
    if (isAddon) {
      return process.env[`STRIPE_PRICE_${plan.toUpperCase()}_ADDON`]!
    }
    const key = `STRIPE_PRICE_${plan.toUpperCase()}_${dogCount === 2 ? '2DOGS' : '1DOG'}`
    return process.env[key]!
  }

  const sessionsPerMonth = plan === 'starter' ? 4 : plan === 'active' ? 8 : plan === 'athlete' ? 12 : 0

  try {
    // For alacarte bookings, save pending booking first
    let pendingBookingId = ''
    if (type === 'alacarte' && bookingDate && slotHour !== undefined) {
      const { data: pending } = await supabase
        .from('pending_bookings')
        .insert({
          owner_id: ownerId,
          dog_ids: dogIds || [],
          booking_date: bookingDate,
          slot_hour: slotHour
        })
        .select()
        .single()
      if (pending) pendingBookingId = pending.id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: type === 'membership' ? 'subscription' : 'payment',
      line_items: [{ price: getPriceId(), quantity: 1 }],
      customer_email: ownerEmail,
      metadata: {
        owner_id: ownerId,
        type,
        plan: plan || '',
        dog_count: String(dogCount || 1),
        sessions_per_month: String(sessionsPerMonth),
        dog_ids: (dogIds || []).join(','),
        pending_booking_id: pendingBookingId,
        is_addon: isAddon ? 'true' : 'false'
      },
      success_url: type === 'alacarte'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?pending=${pendingBookingId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/membership?success=true`,
      cancel_url: type === 'alacarte'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/book?cancelled=true`
        : `${process.env.NEXT_PUBLIC_APP_URL}/membership?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}