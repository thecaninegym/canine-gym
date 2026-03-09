import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  // Fetch all dogs with a birthday and their owner
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, photo_url, birthday, owners(name, email)')
    .not('birthday', 'is', null)

  if (!dogs) return NextResponse.json({ success: true, sent: 0 })

  const birthdayDogs = dogs.filter(dog => {
    const bday = new Date(dog.birthday)
    return bday.getMonth() + 1 === month && bday.getDate() === day
  })

  for (const dog of birthdayDogs) {
    const owner = (dog.owners as any)
    if (!owner?.email) continue

    const age = today.getFullYear() - new Date(dog.birthday).getFullYear()

    // Email to owner
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: owner.email,
      subject: `🎂 Happy Birthday ${dog.name}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#001840,#2c5a9e);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="font-size:48px;margin:0;">🎂</p>
            <h1 style="color:white;margin:8px 0 0;font-size:26px;">Happy Birthday, ${dog.name}!</h1>
          </div>
          <div style="background:white;padding:28px;border:1px solid #eee;text-align:center;">
            <p style="color:#555;font-size:16px;line-height:1.7;">Today ${dog.name} turns <strong>${age} year${age !== 1 ? 's' : ''} old</strong> 🐾<br/>Celebrate with a session on the slatmill — the best birthday gift for a pup!</p>
            <a href="https://app.thecaninegym.com/book" style="display:inline-block;background:linear-gradient(135deg,#f88124,#f9a04e);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;margin:20px 0;">
              🎉 Book a Birthday Session
            </a>
            <p style="color:#999;font-size:13px;">From all of us at The Canine Gym 🐾</p>
          </div>
          <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN</p>
          </div>
        </div>
      `
    })

    // Email to admin
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: 'dev@thecaninegym.com',
      subject: `🎂 Birthday Today: ${dog.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#001840,#2c5a9e);padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">🎂 Birthday Alert</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #eee;">
            <p style="color:#333;font-size:15px;"><strong>${dog.name}</strong> turns <strong>${age}</strong> today!</p>
            <p style="color:#555;font-size:14px;">Owner: <strong>${owner.name}</strong> (${owner.email})</p>
            <p style="color:#555;font-size:14px;">A birthday email has been sent to the owner automatically.</p>
          </div>
          <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN</p>
          </div>
        </div>
      `
    })
  }

  return NextResponse.json({ success: true, sent: birthdayDogs.length })
}