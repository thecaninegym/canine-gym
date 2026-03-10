import { NextResponse } from 'next/server'

const QUO_API_KEY = process.env.QUO_API_KEY!
const QUO_FROM = process.env.QUO_PHONE_NUMBER!
const SMS_ENABLED = process.env.SMS_ENABLED === 'true'

// Convert any common US phone format to E.164 (+1XXXXXXXXXX)
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function POST(request: Request) {
  if (!SMS_ENABLED) {
    return NextResponse.json({ success: false, reason: 'SMS_DISABLED' })
  }

  const { to, type, data } = await request.json()

  if (!to) return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })

  const phone = toE164(to)
  if (!phone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })

  let content = ''

  if (type === 'booking_confirmation') {
    content = `Hi ${data.ownerName}! 🐾 ${data.dogName}'s session is confirmed.\n\n📅 ${data.date}\n⏰ ${data.time}\n\nWe'll come to you — just have ${data.dogName} leashed and ready! Questions? Reply here.\n\n- The Canine Gym`
  }

  if (type === 'reminder') {
    content = `Hey ${data.ownerName}! 👋 Reminder: ${data.dogName}'s session is TOMORROW.\n\n📅 ${data.date}\n⏰ ${data.time}\n\nQuick checklist:\n🚫 No food 2 hrs before\n🐾 Have ${data.dogName} leashed & ready\n🐕 Let them potty first\n\nNeed to cancel? Visit app.thecaninegym.com\n\n- The Canine Gym`
  }

  if (type === 'booking_cancelled') {
    content = `Hi ${data.ownerName}, your booking for ${data.dogName} on ${data.date} at ${data.time} has been cancelled.${data.refundNote ? `\n\n${data.refundNote}` : ''}\n\nRebook anytime at app.thecaninegym.com\n\n- The Canine Gym`
  }

  if (!content) {
    return NextResponse.json({ error: 'Unknown SMS type' }, { status: 400 })
  }

  const response = await fetch('https://api.openphone.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': QUO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      from: QUO_FROM,
      to: [phone],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Quo SMS error:', err)
    return NextResponse.json({ error: 'SMS send failed', detail: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}