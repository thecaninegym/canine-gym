import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
    { key: 'rabies_exp', label: 'Rabies' }, { key: 'dhpp_exp', label: 'DHPP' },
    { key: 'bordetella_exp', label: 'Bordetella' }, { key: 'leptospira_exp', label: 'Leptospira' },
    { key: 'influenza_exp', label: 'Influenza' },
  ]

  let emailsSent = 0
  for (const vaccine of vaccines) {
    const expiringFields: { label: string, date: string, daysLeft: number }[] = []
    for (const f of vaccineFields) {
      const exp = vaccine[f.key as keyof typeof vaccine]
      if (!exp) continue
      const expDate = new Date(exp as string)
      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 30 && daysLeft >= 0) {
        expiringFields.push({ label: f.label, date: expDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), daysLeft })
      }
    }
    if (expiringFields.length === 0) continue

    const ownerEmail = vaccine.dogs?.owners?.email
    const ownerName = vaccine.dogs?.owners?.name?.split(' ')[0] || 'there'
    const dogName = vaccine.dogs?.name
    if (!ownerEmail) continue

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_expiring', to: ownerEmail, data: { ownerName, dogName, expiringFields } })
    })
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccine_expiring_admin', to: 'dev@thecaninegym.com', data: { ownerName: vaccine.dogs?.owners?.name, ownerEmail, dogName, expiringFields } })
    })
    emailsSent++
  }

  return NextResponse.json({ sent: emailsSent, checked: vaccines.length })
}