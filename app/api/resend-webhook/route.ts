import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('svix-signature')
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const secret = process.env.RESEND_WEBHOOK_SECRET

  if (secret && signature && svixId && svixTimestamp) {
    try {
      const signedPayload = `${svixId}.${svixTimestamp}.${body}`
      const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
      const secretBytes = Buffer.from(cleanSecret, 'base64')
      const expectedSig = crypto
        .createHmac('sha256', secretBytes)
        .update(signedPayload)
        .digest('base64')
      const sigs = signature.split(' ').map(s => s.split(',')[1])
      const isValid = sigs.some(s => s === expectedSig)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } catch (err) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.type !== 'email.bounced') {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  const bouncedEmail = event.data?.to?.[0] || event.data?.email?.to?.[0] || 'Unknown'
  const emailSubject = event.data?.subject || event.data?.email?.subject || 'Unknown'
  const bounceType = event.data?.bounce?.type || event.data?.bounce_type || 'Unknown'
  const bounceReason = event.data?.bounce?.message || event.data?.bounce?.subType || 'Not specified'

  const { data: owner } = await supabase
    .from('owners')
    .select('id, name, phone')
    .eq('email', bouncedEmail)
    .maybeSingle()

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_bounce_alert',
        to: 'dev@thecaninegym.com',
        data: {
          bouncedEmail,
          ownerName: owner?.name,
          ownerPhone: owner?.phone,
          ownerId: owner?.id,
          bounceType,
          bounceReason,
          emailSubject,
        }
      })
    })
  } catch (err) {
    console.error('Failed to send bounce alert:', err)
  }

  return NextResponse.json({ success: true })
}