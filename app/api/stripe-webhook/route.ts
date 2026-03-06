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

      // Send membership receipt
      const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', ownerId).single()
      const { data: dogsData } = await supabase.from('dogs').select('name').in('id', metadata.dog_ids ? metadata.dog_ids.split(',').filter(Boolean) : [])
      if (ownerData?.email) {
        const planNames: Record<string, string> = { starter: 'Starter (4 sessions)', standard: 'Standard (8 sessions)', unlimited: 'Unlimited' }
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'receipt_membership',
            to: ownerData.email,
            data: {
              ownerName: ownerData.name,
              planName: planNames[metadata.plan] || metadata.plan,
              dogNames: dogsData?.map((d: any) => d.name).join(', ') || 'your dog',
              sessionsPerMonth: metadata.sessions_per_month,
              amount: `$${((session.amount_total || 0) / 100).toFixed(2)}`
            }
          })
        })
      }

    }

    if (type === 'alacarte') {
      await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'alacarte',
        status: 'succeeded'
      })

      // Confirm the pending booking
      const pendingBookingId = metadata.pending_booking_id
      if (pendingBookingId) {
        const { data: pending } = await supabase
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingBookingId)
          .single()

        if (pending) {
          // Create bookings for each dog
          const dogIds = pending.dog_ids || []
          for (const dogId of dogIds) {
            await supabase.from('bookings').insert({
              dog_id: dogId,
              booking_date: pending.booking_date,
              slot_hour: pending.slot_hour,
              status: 'confirmed',
              payment_intent_id: session.payment_intent as string,
              amount_paid: session.amount_total
            })
          }
// Delete pending booking
          await supabase.from('pending_bookings').delete().eq('id', pendingBookingId)

          // Send a la carte receipt
          const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', ownerId).single()
          if (ownerData?.email) {
            const h = pending.slot_hour
            const ampm = h >= 12 ? 'PM' : 'AM'
            const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
            const bookingDate = new Date(pending.booking_date + 'T12:00:00')
            const dogNames = await Promise.all((pending.dog_ids || []).map(async (id: string) => {
              const { data } = await supabase.from('dogs').select('name').eq('id', id).single()
              return data?.name || ''
            }))
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'receipt_alacarte',
                to: ownerData.email,
                data: {
                  ownerName: ownerData.name,
                  dogName: dogNames.filter(Boolean).join(' & '),
                  date: bookingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                  time: `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`,
                  amount: `$${((session.amount_total || 0) / 100).toFixed(2)}`
                }
              })
            })
          }
        }
      }
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

    // Fetch membership + owner for emails
    const { data: cancelledMembership } = await supabase
      .from('memberships')
      .select('*, owners(name, email)')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (cancelledMembership) {
      const periodEnd = new Date(cancelledMembership.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const planName = cancelledMembership.plan.charAt(0).toUpperCase() + cancelledMembership.plan.slice(1)

      // Email client
      if (cancelledMembership.owners?.email) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'membership_cancelled_client',
            to: cancelledMembership.owners.email,
            data: {
              ownerName: cancelledMembership.owners.name,
              planName,
              periodEnd,
              sessionsRemaining: cancelledMembership.sessions_remaining
            }
          })
        })
      }

      // Email admin
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'membership_cancelled_admin',
          to: 'dev@thecaninegym.com',
          data: {
            ownerName: cancelledMembership.owners?.name,
            ownerEmail: cancelledMembership.owners?.email,
            planName,
            periodEnd,
            sessionsRemaining: cancelledMembership.sessions_remaining
          }
        })
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await supabase.from('memberships').update({ status: 'past_due' })
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
  }

  return NextResponse.json({ received: true })
}