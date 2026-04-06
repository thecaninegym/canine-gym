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
      const dogId = metadata.dog_id
      const sessionsPerMonth = parseInt(metadata.sessions_per_month || '0')
      const planLabels: Record<string, string> = { starter: 'Standard Plan', active: 'Pro Plan', athlete: 'Elite Plan' }

      let receiptUrl = null
      if (session.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(session.invoice as string)
          receiptUrl = invoice.hosted_invoice_url || null
        } catch {}
      }

      await supabase.from('memberships').upsert({
        owner_id: ownerId,
        dog_id: dogId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        plan,
        sessions_per_month: sessionsPerMonth,
        sessions_remaining: sessionsPerMonth,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'dog_id' })

      await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'membership',
        description: planLabels[plan] || plan,
        receipt_url: receiptUrl,
        status: 'succeeded'
      })

      const { data: ownerData } = await supabase.from('owners').select('name, email').eq('id', ownerId).single()
      const { data: dogData } = await supabase.from('dogs').select('name').eq('id', dogId).single()
      if (ownerData?.email) {
        const planNames: Record<string, string> = { starter: 'Standard (4 sessions)', active: 'Pro (8 sessions)', athlete: 'Elite (12 sessions)' }
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'receipt_membership',
            to: ownerData.email,
            data: {
              ownerName: ownerData.name,
              planName: planNames[plan] || plan,
              dogNames: dogData?.name || 'your dog',
              sessionsPerMonth: metadata.sessions_per_month,
              amount: `$${((session.amount_total || 0) / 100).toFixed(2)}`
            }
          })
        })
      }
    }

    if (type === 'intro') {
      let receiptUrl = null
      if (session.payment_intent) {
        try {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, { expand: ['latest_charge'] })
          receiptUrl = (pi.latest_charge as any)?.receipt_url || null
        } catch {}
      }

      const dogIds = (metadata.dog_ids || '').split(',').filter(Boolean)
      const dogId = dogIds[0]

      // Mark intro as purchased on the dog
      if (dogId) {
        await supabase.from('dogs').update({ intro_purchased: true }).eq('id', dogId)
      }

      // Log payment
      const { error: paymentError } = await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'intro',
        description: 'Intro Package (2 Sessions)',
        receipt_url: receiptUrl,
        status: 'succeeded'
      })
      if (paymentError) console.error('Intro payment insert error:', paymentError)

      // Confirm both pending bookings
      const pendingIds = [metadata.pending_booking_id, metadata.pending_booking_id_2].filter(Boolean)
      const confirmedDates: { date: string, slotHour: number }[] = []

      for (const pendingId of pendingIds) {
        const { data: pending } = await supabase
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingId)
          .single()

        if (pending) {
          confirmedDates.push({ date: pending.booking_date, slotHour: pending.slot_hour })
          for (const dId of (pending.dog_ids || [])) {
            await supabase.from('bookings').insert({
              dog_id: dId,
              booking_date: pending.booking_date,
              slot_hour: pending.slot_hour,
              status: 'confirmed',
              payment_intent_id: session.payment_intent as string,
              amount_paid: session.amount_total
            })
          }
          await supabase.from('pending_bookings').delete().eq('id', pendingId)
        }
      }

      // Send confirmation email
      const { data: ownerData } = await supabase.from('owners').select('name, email, phone, sms_consent').eq('id', ownerId).single()
      const { data: dogData } = await supabase.from('dogs').select('name').eq('id', dogId).single()

      if (ownerData?.email && confirmedDates.length === 2) {
        const formatDate = (dateStr: string, slotHour: number) => {
          const ampm = slotHour >= 12 ? 'PM' : 'AM'
          const hour = slotHour > 12 ? slotHour - 12 : slotHour === 0 ? 12 : slotHour
          const date = new Date(dateStr + 'T12:00:00')
          return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
            time: `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
          }
        }
        const session1 = formatDate(confirmedDates[0].date, confirmedDates[0].slotHour)
        const session2 = formatDate(confirmedDates[1].date, confirmedDates[1].slotHour)

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'receipt_intro',
            to: ownerData.email,
            data: {
              ownerName: ownerData.name,
              dogName: dogData?.name || 'your dog',
              session1Date: session1.date,
              session1Time: session1.time,
              session2Date: session2.date,
              session2Time: session2.time,
              amount: `$${((session.amount_total || 0) / 100).toFixed(2)}`
            }
          })
        })

        // Admin notification
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'admin_notification',
            to: 'dev@thecaninegym.com',
            data: {
              action: 'New Intro Package Purchase',
              dogName: dogData?.name,
              ownerName: ownerData.name,
              date: `${session1.date} at ${session1.time} & ${session2.date} at ${session2.time}`,
              time: ''
            }
          })
        })
      }
    }

    if (type === 'alacarte') {
      let aReceiptUrl = null
      if (session.payment_intent) {
        try {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, { expand: ['latest_charge'] })
          aReceiptUrl = (pi.latest_charge as any)?.receipt_url || null
        } catch {}
      }

      await supabase.from('payments').insert({
        owner_id: ownerId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total,
        type: 'alacarte',
        description: 'A La Carte Session',
        receipt_url: aReceiptUrl,
        status: 'succeeded'
      })

      const pendingBookingId = metadata.pending_booking_id
      if (pendingBookingId) {
        const { data: pending } = await supabase
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingBookingId)
          .single()

        if (pending) {
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
          await supabase.from('pending_bookings').delete().eq('id', pendingBookingId)

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

      if ((invoice.amount_paid || 0) > 0 && invoice.billing_reason === 'subscription_cycle') {
        const planLabels: Record<string, string> = { starter: 'Standard Plan', active: 'Pro Plan', athlete: 'Elite Plan' }
        const inv = invoice as any
        await supabase.from('payments').insert({
          owner_id: membership.owner_id,
          stripe_payment_intent_id: inv.payment_intent ?? null,
          amount: invoice.amount_paid,
          type: 'membership_renewal',
          description: `${planLabels[membership.plan] || membership.plan} — Renewal`,
          receipt_url: invoice.hosted_invoice_url || null,
          status: 'succeeded'
        })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase.from('memberships').update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id)

    const { data: cancelledMembership } = await supabase
      .from('memberships')
      .select('*, owners(name, email)')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (cancelledMembership) {
      const periodEnd = new Date(cancelledMembership.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const planDisplayNames: Record<string, string> = { starter: 'Standard', active: 'Pro', athlete: 'Elite' }
      const planName = planDisplayNames[cancelledMembership.plan] || cancelledMembership.plan

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