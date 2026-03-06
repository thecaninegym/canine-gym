import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { ownerId, ownerEmail, type, plan, dogCount, dogIds } = await request.json()

  const getPriceId = () => {
    if (type === 'alacarte') {
      return dogCount === 2
        ? process.env.STRIPE_PRICE_ALACARTE_2DOGS!
        : process.env.STRIPE_PRICE_ALACARTE_1DOG!
    }
    const key = `STRIPE_PRICE_${plan.toUpperCase()}_${dogCount === 2 ? '2DOGS' : '1DOG'}`
    return process.env[key]!
  }

  const sessionsPerMonth = plan === 'starter' ? 4 : plan === 'active' ? 8 : plan === 'athlete' ? 12 : 0

  try {
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
        dog_ids: (dogIds || []).join(',')
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}