import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://www.thecaninegym.com/logo.png'
const BLUE = '#2c5a9e'
const ORANGE = '#f88124'
const DARK_BLUE = '#001840'

export async function POST(request: Request) {
  const { ownerEmail, ownerName, dogName, sessionDate, duration, miles, calories, notes, achievementsUnlocked } = await request.json()

  const statCard = (emoji: string, value: string, label: string) =>
    `<div style="background:#f0f2f7;padding:16px;border-radius:12px;text-align:center;flex:1;">
      <div style="font-size:22px;margin-bottom:4px;">${emoji}</div>
      <div style="font-size:20px;font-weight:800;color:${BLUE};font-family:'Montserrat',Arial,sans-serif;">${value}</div>
      <div style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:'Montserrat',Arial,sans-serif;">${label}</div>
    </div>`

  const achievementSection = achievementsUnlocked && achievementsUnlocked.length > 0
    ? `<div style="background:#fff4e6;border:1.5px solid ${ORANGE};border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 10px;font-weight:800;color:${ORANGE};font-size:14px;font-family:'Montserrat',Arial,sans-serif;">🏆 Achievement${achievementsUnlocked.length > 1 ? 's' : ''} Unlocked!</p>
        ${achievementsUnlocked.map((a: string) => `<p style="margin:4px 0;color:#333;font-size:13px;font-family:'Montserrat',Arial,sans-serif;">⭐ ${a}</p>`).join('')}
      </div>`
    : ''

  const notesSection = notes
    ? `<div style="background:#f0f2f7;border-left:4px solid ${ORANGE};padding:14px 18px;border-radius:0 10px 10px 0;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-family:'Montserrat',Arial,sans-serif;">Trainer Notes</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6;font-family:'Montserrat',Arial,sans-serif;">"${notes}"</p>
      </div>`
    : ''

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head>
<body style="margin:0;padding:0;background:#f0f2f7;font-family:'Montserrat',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <div style="background:white;padding:28px 32px;text-align:center;border-bottom:3px solid ${ORANGE};">
      <img src="${LOGO_URL}" alt="The Canine Gym" style="height:70px;width:auto;display:block;margin:0 auto 12px;"/>
      <div style="display:inline-block;background:${DARK_BLUE};border-radius:20px;padding:4px 16px;">
        <span style="color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Session Report</span>
      </div>
    </div>

    <div style="background:white;padding:36px 32px;">
      <h2 style="color:${BLUE};font-size:22px;font-weight:800;margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;">${dogName} crushed it today! 💪</h2>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;font-family:'Montserrat',Arial,sans-serif;">Hi ${ownerName}, here's a full summary from today's session on <strong>${sessionDate}</strong>.</p>

      <div style="display:flex;gap:12px;margin-bottom:20px;">
        ${statCard('⏱️', `${duration} min`, 'Duration')}
        ${statCard('📍', miles || '—', 'Miles')}
        ${statCard('🔥', calories || '—', 'Calories')}
      </div>

      ${achievementSection}
      ${notesSection}

      <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:${ORANGE};color:white;text-align:center;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Montserrat',Arial,sans-serif;margin-top:24px;">View Full Dashboard →</a>
    </div>

    <div style="background:${DARK_BLUE};padding:20px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Montserrat',Arial,sans-serif;">© ${new Date().getFullYear()} The Canine Gym &nbsp;·&nbsp; Hamilton County, IN &nbsp;·&nbsp; <a href="https://www.thecaninegym.com" style="color:rgba(255,255,255,0.5);text-decoration:none;">thecaninegym.com</a></p>
    </div>

  </div>
</body></html>`

  try {
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: ownerEmail,
      subject: `${dogName}'s Session Report — ${sessionDate}`,
      html
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
