import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { type, to, data } = await request.json()

  let subject = ''
  let html = ''

  if (type === 'welcome') {
    subject = `Welcome to The Canine Gym, ${data.ownerName}! 🐾`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#003087;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Welcome to the pack!</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#003087;">Hi ${data.ownerName}, welcome to The Canine Gym! 🎉</h2>
          <p style="color:#555;line-height:1.6;">We're so excited to have you and ${data.dogName} join our community. The run comes to you — we'll be at your door ready to give ${data.dogName} an amazing workout.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;font-weight:bold;color:#333;">Getting started:</p>
            <p style="margin:0 0 6px 0;color:#555;">✅ Log in to your dashboard to track ${data.dogName}'s progress</p>
            <p style="margin:0 0 6px 0;color:#555;">📅 Book your first session at a time that works for you</p>
            <p style="margin:0 0 6px 0;color:#555;">🏆 Earn achievements and compete on the leaderboard</p>
            <p style="margin:0;color:#555;">📸 Share ${data.dogName}'s stats with friends and family</p>
          </div>
          <a href="https://app.thecaninegym.com" style="display:block;background:#FF6B35;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Go to My Dashboard →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'booking_confirmation') {
    subject = `Session booked for ${data.dogName} — ${data.date} 📅`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#003087;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Booking Confirmed</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#003087;">You're booked, ${data.ownerName}! ✅</h2>
          <p style="color:#555;">Here's your session details:</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0;color:#333;font-size:16px;">⏰ <strong>${data.time}</strong></p>
          </div>
          <div style="background:#fff3e0;border:1px solid #FF6B35;padding:16px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0;color:#FF6B35;font-size:14px;"><strong>Cancellation Policy:</strong> Please cancel at least 48 hours in advance to avoid a cancellation fee. If your dog is sick, no fee applies.</p>
          </div>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#FF6B35;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            View My Dashboard →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'reminder') {
    subject = `Reminder: ${data.dogName}'s session is tomorrow at ${data.time} 🐾`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#003087;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Session Reminder</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#003087;">See you tomorrow, ${data.ownerName}! 👋</h2>
          <p style="color:#555;">Just a friendly reminder that ${data.dogName} has a session scheduled for tomorrow.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0;color:#333;font-size:16px;">⏰ <strong>${data.time}</strong></p>
          </div>
          <p style="color:#555;font-size:14px;">Need to cancel? Please do so as soon as possible to avoid a cancellation fee.</p>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#FF6B35;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            View My Dashboard →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'admin_notification') {
    subject = `${data.action}: ${data.dogName} — ${data.date}`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#003087;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#003087;">${data.action}</h2>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
            <p style="margin:0 0 8px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">👤 Owner: <strong>${data.ownerName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">⏰ <strong>${data.time}</strong></p>
            ${data.reason ? `<p style="margin:0;color:#dc3545;">Reason: ${data.reason}</p>` : ''}
            ${data.fee ? `<p style="margin:8px 0 0 0;color:#dc3545;font-weight:bold;">💰 Cancellation fee applies</p>` : ''}
          </div>
          <a href="https://app.thecaninegym.com/admin/schedule" style="display:block;background:#003087;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:24px;">
            View Schedule →
          </a>
        </div>
      </div>
    `
  }

  try {
    await resend.emails.send({
      from: 'The Canine Gym <info@thecaninegym.com>',
      to,
      subject,
      html
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}