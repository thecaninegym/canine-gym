import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}
    const ownerId = metadata.owner_id
    const type = metadata.type

    if (type === 'membership') {
      const plan = metadata.plan
      const dogCount = parseInt(metadata.dog_count || '1')
      const sessionsPerMonth = parseInt(metadata.sessions_per_month || '0')

      const dogIds = metadata.dog_ids ? metadata.dog_ids.split(',').filter(Boolean) : []

      await supabase.from('memberships').upsert({
        owner_id: ownerId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        plan,
        dog_count: dogCount,
        dog_ids: dogIds,
        sessions_per_month: sessionsPerMonth,
        sessions_remaining: sessionsPerMonth,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'owner_id' })

      await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'membership',
        status: 'succeeded'
      })
    }

    if (type === 'alacarte') {
      await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'alacarte',
        status: 'succeeded'
      })
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = (invoice as any).subscription as string

    const { data: membership } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (membership) {
      await supabase.from('memberships').update({
        sessions_remaining: membership.sessions_per_month,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }).eq('stripe_subscription_id', subscriptionId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase.from('memberships').update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await supabase.from('memberships').update({ status: 'past_due' })
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
  }

  return NextResponse.json({ received: true })
}