import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://www.thecaninegym.com/logo.png'
const BLUE = '#2c5a9e'
const ORANGE = '#f88124'
const DARK_BLUE = '#001840'

function emailShell(headerLabel: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head>
<body style="margin:0;padding:0;background:#f0f2f7;font-family:'Montserrat',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,${DARK_BLUE} 0%,${BLUE} 100%);padding:28px 32px;text-align:center;">
      <img src="${LOGO_URL}" alt="The Canine Gym" style="height:52px;width:auto;display:block;margin:0 auto 12px;"/>
      <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:20px;padding:4px 16px;">
        <span style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${headerLabel}</span>
      </div>
    </div>
    <div style="background:white;padding:36px 32px;">${body}</div>
    <div style="background:${DARK_BLUE};padding:20px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Montserrat',Arial,sans-serif;">© ${new Date().getFullYear()} The Canine Gym &nbsp;·&nbsp; Hamilton County, IN &nbsp;·&nbsp; <a href="https://www.thecaninegym.com" style="color:rgba(255,255,255,0.5);text-decoration:none;">thecaninegym.com</a></p>
    </div>
  </div>
</body></html>`
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

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
      html: emailShell('Happy Birthday!', `
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:56px;line-height:1;margin-bottom:12px;">🎂</div>
          <h2 style="color:${BLUE};font-size:24px;font-weight:800;margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;">Happy Birthday, ${dog.name}!</h2>
          <p style="color:#888;font-size:14px;margin:0;font-family:'Montserrat',Arial,sans-serif;">Turning ${age} year${age !== 1 ? 's' : ''} old today 🐾</p>
        </div>
        <div style="background:#f0f2f7;border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center;">
          <p style="color:#555;font-size:14px;line-height:1.7;margin:0;font-family:'Montserrat',Arial,sans-serif;">Every dog deserves a great workout on their birthday. Treat ${dog.name} to a session on the slatmill — the best birthday gift a pup could ask for!</p>
        </div>
        <a href="https://app.thecaninegym.com/book" style="display:block;background:${ORANGE};color:white;text-align:center;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Montserrat',Arial,sans-serif;margin-top:8px;">🎉 Book a Birthday Session →</a>
        <p style="color:#999;font-size:12px;text-align:center;margin:20px 0 0;font-family:'Montserrat',Arial,sans-serif;">With love from everyone at The Canine Gym 🐾</p>
      `)
    })

    // Email to admin
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: 'dev@thecaninegym.com',
      subject: `🎂 Birthday Today: ${dog.name} (${owner.name})`,
      html: emailShell('Birthday Alert', `
        <h2 style="color:${BLUE};font-size:20px;font-weight:800;margin:0 0 10px;font-family:'Montserrat',Arial,sans-serif;">🎂 Birthday Alert</h2>
        <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:'Montserrat',Arial,sans-serif;">A dog in your community is celebrating their birthday today!</p>
        <div style="background:#f0f2f7;border-radius:12px;padding:20px 24px;margin:20px 0;">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><span style="color:#888;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">Dog</span><span style="color:#1a1a2e;font-size:14px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;">${dog.name}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><span style="color:#888;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">Age</span><span style="color:#1a1a2e;font-size:14px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;">${age} year${age !== 1 ? 's' : ''} old</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><span style="color:#888;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">Owner</span><span style="color:#1a1a2e;font-size:14px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;">${owner.name}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#888;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">Email</span><span style="color:#1a1a2e;font-size:14px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;">${owner.email}</span></div>
        </div>
        <p style="color:#888;font-size:13px;margin:0;font-family:'Montserrat',Arial,sans-serif;">A birthday email has been automatically sent to the owner.</p>
      `)
    })
  }

  return NextResponse.json({ success: true, sent: birthdayDogs.length })
}
