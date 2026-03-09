import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { ownerEmail, ownerName, dogName, sessionDate, duration, miles, calories, notes, achievementsUnlocked } = await request.json()

  const achievementSection = achievementsUnlocked && achievementsUnlocked.length > 0
    ? `<div style="background:#fff3e0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px 0;font-weight:bold;color:#f88124;">🏆 New Achievement${achievementsUnlocked.length > 1 ? 's' : ''} Unlocked!</p>
        ${achievementsUnlocked.map((a: string) => `<p style="margin:4px 0;color:#333;">• ${a}</p>`).join('')}
      </div>`
    : ''

  try {
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to: ownerEmail,
      subject: `${dogName}'s Session Summary — ${sessionDate}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Session Report</p>
          </div>
          <div style="background:white;padding:24px;border:1px solid #eee;">
            <h2 style="color:#2c5a9e;margin:0 0 4px 0;">${dogName} crushed it today! 💪</h2>
            <p style="color:#666;margin:0 0 24px 0;">Hi ${ownerName}, here's the summary from today's session.</p>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
              <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;">
                <div style="font-size:24px;">⏱️</div>
                <div style="font-size:20px;font-weight:bold;color:#2c5a9e;">${duration} min</div>
                <div style="font-size:12px;color:#666;">Duration</div>
              </div>
              <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;">
                <div style="font-size:24px;">📍</div>
                <div style="font-size:20px;font-weight:bold;color:#2c5a9e;">${miles || '—'}</div>
                <div style="font-size:12px;color:#666;">Miles</div>
              </div>
              <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;">
                <div style="font-size:24px;">🔥</div>
                <div style="font-size:20px;font-weight:bold;color:#2c5a9e;">${calories || '—'}</div>
                <div style="font-size:12px;color:#666;">Calories</div>
              </div>
            </div>

            ${achievementSection}

            ${notes ? `<div style="background:#f9f9f9;border-left:4px solid #f88124;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <p style="margin:0;font-style:italic;color:#555;">"${notes}"</p>
            </div>` : ''}

            <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              View Full Dashboard →
            </a>
          </div>
          <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}