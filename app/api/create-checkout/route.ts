import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const { ownerId, ownerEmail, type, plan, dogCount, dogIds, bookingDate, slotHour, isAddon, introBookings } = await request.json()

  // Check if this owner already has another active membership (for 2nd dog pricing)
  let isSecondDog = false
  if (type === 'membership' && dogIds?.[0]) {
    // Gate: dog must have purchased intro before buying a membership
    const { data: dogCheck } = await supabase
      .from('dogs')
      .select('intro_purchased')
      .eq('id', dogIds[0])
      .single()
    if (!dogCheck?.intro_purchased) {
      return NextResponse.json({ error: 'This dog must complete the Intro Package before purchasing a membership.' }, { status: 400 })
    }

    const { data: existingMemberships } = await supabase
      .from('memberships')
      .select('id, dog_id')
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .neq('dog_id', dogIds[0])
    isSecondDog = (existingMemberships?.length || 0) > 0
  }

  const getPriceId = () => {
    if (type === 'intro') return process.env.STRIPE_PRICE_INTRO!
    if (type === 'alacarte') {
      return dogCount >= 2
        ? process.env.STRIPE_PRICE_ALACARTE_2DOGS!
        : process.env.STRIPE_PRICE_ALACARTE_1DOG!
    }
    if (isSecondDog) {
      return process.env[`STRIPE_PRICE_${plan.toUpperCase()}_ADDON`]!
    }
    return process.env[`STRIPE_PRICE_${plan.toUpperCase()}_1DOG`]!
  }

  const sessionsPerMonth = plan === 'starter' ? 4 : plan === 'active' ? 8 : plan === 'athlete' ? 12 : 0

  try {
    let pendingBookingId = ''
    let pendingBookingId2 = ''

    if (type === 'intro' && introBookings) {
      // Store both intro sessions as pending bookings
      const { data: pending1 } = await supabase
        .from('pending_bookings')
        .insert({
          owner_id: ownerId,
          dog_ids: dogIds || [],
          booking_date: introBookings[0].date,
          slot_hour: introBookings[0].slotHour,
        })
        .select()
        .single()
      if (pending1) pendingBookingId = pending1.id

      const { data: pending2 } = await supabase
        .from('pending_bookings')
        .insert({
          owner_id: ownerId,
          dog_ids: dogIds || [],
          booking_date: introBookings[1].date,
          slot_hour: introBookings[1].slotHour,
        })
        .select()
        .single()
      if (pending2) pendingBookingId2 = pending2.id
    }

    if (type === 'alacarte' && bookingDate && slotHour !== undefined) {
      const { data: pending } = await supabase
        .from('pending_bookings')
        .insert({
          owner_id: ownerId,
          dog_ids: dogIds || [],
          booking_date: bookingDate,
          slot_hour: slotHour,
        })
        .select()
        .single()
      if (pending) pendingBookingId = pending.id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: type === 'membership' ? 'subscription' : 'payment',
      line_items: [{ price: getPriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      customer_email: ownerEmail,
      metadata: {
        owner_id: ownerId,
        type,
        plan: plan || '',
        sessions_per_month: String(sessionsPerMonth),
        dog_id: type === 'membership' ? (dogIds?.[0] || '') : '',
        dog_ids: type !== 'membership' ? (dogIds || []).join(',') : '',
        pending_booking_id: pendingBookingId,
        pending_booking_id_2: pendingBookingId2,
      },
      success_url: type === 'intro'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?intro=true`
        : type === 'alacarte'
          ? `${process.env.NEXT_PUBLIC_APP_URL}/booking-confirmed?pending=${pendingBookingId}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/membership?success=true`,
      cancel_url: type === 'intro'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/book?cancelled=true`
        : type === 'alacarte'
          ? `${process.env.NEXT_PUBLIC_APP_URL}/book?cancelled=true`
          : `${process.env.NEXT_PUBLIC_APP_URL}/membership?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}