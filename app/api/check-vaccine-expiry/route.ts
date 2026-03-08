import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MILESTONES = [30, 14, 7, 1]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const { data: vaccines } = await supabase
    .from('dog_vaccines')
    .select('*, dogs(id, name, owners(name, email))')
    .eq('status', 'approved')

  if (!vaccines) return NextResponse.json({ sent: 0 })

  const vaccineFields = [
    { key: 'rabies_exp', label: 'Rabies' },
    { key: 'dhpp_exp', label: 'DHPP' },
    { key: 'bordetella_exp', label: 'Bordetella' },
    { key: 'leptospira_exp', label: 'Leptospira' },
    { key: 'influenza_exp', label: 'Influenza' },
  ]

  let emailsSent = 0

  for (const vaccine of vaccines) {
    const ownerEmail = vaccine.dogs?.owners?.email
    const ownerName = vaccine.dogs?.owners?.name?.split(' ')[0] || 'there'
    const fullOwnerName = vaccine.dogs?.owners?.name
    const dogName = vaccine.dogs?.name
    if (!ownerEmail) continue

    // Check for expired fields
    const expiredFields: { label: string, date: string }[] = []
    const expiringFields: { label: string, date: string, daysLeft: number }[] = []

    for (const f of vaccineFields) {
      const exp = vaccine[f.key as keyof typeof vaccine]
      if (!exp) continue
      const expDate = new Date(exp as string)
      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const formattedDate = expDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      if (daysLeft < 0) {
        expiredFields.push({ label: f.label, date: formattedDate })
      } else if (MILESTONES.includes(daysLeft)) {
        expiringFields.push({ label: f.label, date: formattedDate, daysLeft })
      }
    }

    // Handle expired — flip status to pending and notify
    if (expiredFields.length > 0) {
      await supabase
        .from('dog_vaccines')
        .update({ status: 'pending', admin_notes: 'Automatically reset — one or more vaccines expired.' })
        .eq('id', vaccine.id)

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vaccine_expired', to: ownerEmail, data: { ownerName, dogName, expiredFields } })
      })
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vaccine_expired_admin', to: 'dev@thecaninegym.com', data: { ownerName: fullOwnerName, ownerEmail, dogName, expiredFields } })
      })
      emailsSent++
      continue // skip expiry warning if already expired
    }

    // Handle milestone warnings — only email on exact milestone days
    if (expiringFields.length > 0) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vaccine_expiring', to: ownerEmail, data: { ownerName, dogName, expiringFields } })
      })
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vaccine_expiring_admin', to: 'dev@thecaninegym.com', data: { ownerName: fullOwnerName, ownerEmail, dogName, expiringFields } })
      })
      emailsSent++
    }
  }

  return NextResponse.json({ sent: emailsSent, checked: vaccines.length })
}