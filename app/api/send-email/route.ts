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
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Welcome to the pack!</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">Hi ${data.ownerName}, welcome to The Canine Gym! 🎉</h2>
          <p style="color:#555;line-height:1.6;">We're so excited to have you and ${data.dogName} join our community. The run comes to you — we'll be at your door ready to give ${data.dogName} an amazing workout.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;font-weight:bold;color:#333;">Getting started:</p>
            <p style="margin:0 0 6px 0;color:#555;">✅ Log in to your dashboard to track ${data.dogName}'s progress</p>
            <p style="margin:0 0 6px 0;color:#555;">📅 Book your first session at a time that works for you</p>
            <p style="margin:0 0 6px 0;color:#555;">🏆 Earn achievements and compete on the leaderboard</p>
            <p style="margin:0;color:#555;">📸 Share ${data.dogName}'s stats with friends and family</p>
          </div>
          <a href="https://app.thecaninegym.com" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
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
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Booking Confirmed</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">You're booked, ${data.ownerName}! ✅</h2>
          <p style="color:#555;">Here's your session details:</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0;color:#333;font-size:16px;">⏰ <strong>${data.time}</strong></p>
          </div>
          <div style="background:#fff3e0;border:1px solid #f88124;padding:16px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0;color:#f88124;font-size:14px;"><strong>Cancellation Policy:</strong> Please cancel at least 48 hours in advance to avoid a cancellation fee. If your dog is sick, no fee applies.</p>
          </div>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
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
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Session Reminder</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">See you tomorrow, ${data.ownerName}! 👋</h2>
          <p style="color:#555;">Just a friendly reminder that ${data.dogName} has a session scheduled for tomorrow.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;font-size:16px;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0;color:#333;font-size:16px;">⏰ <strong>${data.time}</strong></p>
          </div>
          <p style="color:#555;font-size:14px;">Need to cancel? Please do so as soon as possible to avoid a cancellation fee.</p>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
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
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">${data.action}</h2>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
            <p style="margin:0 0 8px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">👤 Owner: <strong>${data.ownerName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">⏰ <strong>${data.time}</strong></p>
            ${data.reason ? `<p style="margin:0;color:#dc3545;">Reason: ${data.reason}</p>` : ''}
            ${data.fee ? `<p style="margin:8px 0 0 0;color:#dc3545;font-weight:bold;">💰 Cancellation fee applies</p>` : ''}
          </div>
          <a href="https://app.thecaninegym.com/admin/schedule" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:24px;">
            View Schedule →
          </a>
        </div>
      </div>
    `
  }

  if (type === 'receipt_alacarte') {
    subject = `Your receipt from The Canine Gym — ${data.date}`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Payment Receipt</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">Payment Confirmed, ${data.ownerName}!</h2>
          <p style="color:#555;">Thanks for booking — here's your receipt.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 12px 0;color:#333;font-size:15px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:12px;">Receipt Summary</p>
            <p style="margin:0 0 8px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📅 <strong>${data.date}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">⏰ <strong>${data.time}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📋 <strong>A la Carte Session</strong></p>
            <div style="border-top:1px solid #ddd;margin-top:12px;padding-top:12px;">
              <p style="margin:0;color:#2c5a9e;font-size:18px;font-weight:bold;">Total Paid: ${data.amount}</p>
            </div>
          </div>
          <div style="background:#fff3e0;border:1px solid #f88124;padding:16px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0;color:#f88124;font-size:14px;"><strong>Cancellation Policy:</strong> Cancel at least 48 hours in advance for a full refund. Late cancellations receive a 50% refund. No fee if your dog is sick.</p>
          </div>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            View My Dashboard →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'receipt_membership') {
    subject = `Membership confirmed — The Canine Gym`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Membership Receipt</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">You're a member, ${data.ownerName}!</h2>
          <p style="color:#555;">Your membership is now active. Here's your receipt.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 12px 0;color:#333;font-size:15px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:12px;">Membership Summary</p>
            <p style="margin:0 0 8px 0;color:#333;">📋 <strong>${data.planName} Plan</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">🐾 <strong>Covers: ${data.dogNames}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📅 <strong>${data.sessionsPerMonth} sessions per month</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">🔄 <strong>Renews monthly</strong></p>
            <div style="border-top:1px solid #ddd;margin-top:12px;padding-top:12px;">
              <p style="margin:0;color:#2c5a9e;font-size:18px;font-weight:bold;">Total Paid: ${data.amount}</p>
            </div>
          </div>
          <a href="https://app.thecaninegym.com/membership" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:12px;">
            Manage Membership →
          </a>
          <a href="https://app.thecaninegym.com/book" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Book Your First Session →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'membership_cancelled_client') {
    subject = `Your Canine Gym membership has been cancelled`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0 0;">Membership Cancellation</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#2c5a9e;">Hi ${data.ownerName}, your membership has been cancelled.</h2>
          <p style="color:#555;line-height:1.6;">We're sorry to see you go! Here's a summary of your cancellation:</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#333;">📋 <strong>${data.planName} Plan</strong> — Cancelled</p>
            <p style="margin:0 0 8px 0;color:#333;">📅 Access continues until <strong>${data.periodEnd}</strong></p>
            <p style="margin:0;color:#333;">🐾 <strong>${data.sessionsRemaining}</strong> sessions remaining this month</p>
          </div>
          <div style="background:#fff3e0;border:1px solid #f88124;padding:16px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0;color:#f88124;font-size:14px;">You can still book and use your remaining sessions until <strong>${data.periodEnd}</strong>. After that date your membership will fully expire.</p>
          </div>
          <a href="https://app.thecaninegym.com/dashboard" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:12px;">
            View My Dashboard →
          </a>
          <a href="https://app.thecaninegym.com/membership" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Resubscribe →
          </a>
        </div>
        <div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p>
        </div>
      </div>
    `
  }

  if (type === 'membership_cancelled_admin') {
    subject = `Membership cancelled: ${data.ownerName} — ${data.planName}`
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;">
          <h2 style="color:#dc3545;">Membership Cancelled</h2>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
            <p style="margin:0 0 8px 0;color:#333;">👤 <strong>${data.ownerName}</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">✉️ ${data.ownerEmail}</p>
            <p style="margin:0 0 8px 0;color:#333;">📋 <strong>${data.planName} Plan</strong></p>
            <p style="margin:0 0 8px 0;color:#333;">📅 Access until <strong>${data.periodEnd}</strong></p>
            <p style="margin:0;color:#333;">🐾 <strong>${data.sessionsRemaining}</strong> sessions remaining</p>
          </div>
          <a href="https://app.thecaninegym.com/admin/memberships" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:24px;">
            View Memberships →
          </a>
        </div>
      </div>
    `
  }
  
  if (type === 'vaccine_uploaded') {
    subject = `🔬 Vaccine record submitted: ${data.dogName} (${data.ownerName})`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#856404;">New Vaccine Record Submitted</h2><div style="background:#fff3cd;border:1px solid #ffc107;padding:20px;border-radius:8px;margin-bottom:24px;"><p style="margin:0 0 8px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p><p style="margin:0 0 8px 0;color:#333;">👤 Owner: <strong>${data.ownerName}</strong></p><p style="margin:0;color:#333;">✉️ ${data.ownerEmail}</p></div><a href="https://app.thecaninegym.com/admin/dogs/vaccines" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Review Vaccine Records →</a></div></div>`
  }

  if (type === 'vaccine_approved') {
    subject = `✅ ${data.dogName}'s vaccine records have been approved!`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#28a745;">Great news, ${data.ownerName}! ✅</h2><p style="color:#555;line-height:1.6;">We've reviewed and approved <strong>${data.dogName}</strong>'s vaccine records. You're all set to book sessions!</p><div style="background:#d4edda;border:1px solid #c3e6cb;padding:20px;border-radius:8px;margin:24px 0;"><p style="margin:0;color:#155724;font-weight:bold;">🐾 ${data.dogName} is cleared to run!</p></div><a href="https://app.thecaninegym.com/book" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Book a Session Now →</a></div><div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p></div></div>`
  }

  if (type === 'vaccine_rejected') {
    subject = `Action needed: ${data.dogName}'s vaccine records`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#dc3545;">Hi ${data.ownerName}, we need a better photo.</h2><p style="color:#555;line-height:1.6;">We weren't able to approve the vaccine records submitted for <strong>${data.dogName}</strong>.</p><div style="background:#f8d7da;border:1px solid #f5c6cb;padding:20px;border-radius:8px;margin:24px 0;"><p style="margin:0 0 4px 0;color:#721c24;font-weight:bold;">Reason:</p><p style="margin:0;color:#721c24;">${data.reason}</p></div><a href="https://app.thecaninegym.com/dogs" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Re-upload Vaccine Records →</a></div><div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p></div></div>`
  }

  if (type === 'vaccine_expiring') {
    const listItems = data.expiringFields.map((f: any) => `<p style="margin:0 0 8px 0;color:#333;">💉 <strong>${f.label}</strong> — expires ${f.date} (${f.daysLeft} days)</p>`).join('')
    subject = `⚠️ ${data.dogName}'s vaccines are expiring soon`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#856404;">Hi ${data.ownerName}, ${data.dogName}'s vaccines need attention.</h2><p style="color:#555;line-height:1.6;">The following vaccine(s) are expiring within 30 days. Please visit your vet and upload updated records.</p><div style="background:#fff3cd;border:1px solid #ffc107;padding:20px;border-radius:8px;margin:24px 0;">${listItems}</div><a href="https://app.thecaninegym.com/dogs" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-bottom:12px;">Update Vaccine Records →</a></div><div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p></div></div>`
  }

  if (type === 'vaccine_expiring_admin') {
    const listItems = data.expiringFields.map((f: any) => `<p style="margin:0 0 8px 0;color:#333;">💉 <strong>${f.label}</strong> — expires ${f.date} (${f.daysLeft} days)</p>`).join('')
    subject = `⚠️ Vaccine expiry alert: ${data.dogName} (${data.ownerName})`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#856404;">Vaccine Expiry Alert</h2><div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:16px;"><p style="margin:0 0 6px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p><p style="margin:0 0 6px 0;color:#333;">👤 ${data.ownerName}</p><p style="margin:0;color:#333;">✉️ ${data.ownerEmail}</p></div><div style="background:#fff3cd;border:1px solid #ffc107;padding:20px;border-radius:8px;">${listItems}</div><p style="color:#555;margin-top:16px;font-size:14px;">The client has been notified automatically.</p><a href="https://app.thecaninegym.com/admin/dogs/vaccines" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:16px;">View Vaccine Records →</a></div></div>`
  }

  if (type === 'vaccine_expired') {
    const listItems = data.expiredFields.map((f: any) => `<p style="margin:0 0 8px 0;color:#333;">💉 <strong>${f.label}</strong> — expired ${f.date}</p>`).join('')
    subject = `❌ ${data.dogName}'s vaccines have expired — booking paused`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#dc3545;">Hi ${data.ownerName}, ${data.dogName}'s vaccines have expired.</h2><p style="color:#555;line-height:1.6;">The following vaccines are now expired. We've temporarily paused ${data.dogName}'s ability to book until updated records are uploaded and approved.</p><div style="background:#f8d7da;border:1px solid #f5c6cb;padding:20px;border-radius:8px;margin:24px 0;">${listItems}</div><a href="https://app.thecaninegym.com/dogs" style="display:block;background:#f88124;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Upload Updated Records →</a></div><div style="background:#f5f5f5;padding:16px;border-radius:0 0 12px 12px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Canine Gym · Hamilton County, IN · thecaninegym.com</p></div></div>`
  }

  if (type === 'vaccine_expired_admin') {
    const listItems = data.expiredFields.map((f: any) => `<p style="margin:0 0 8px 0;color:#333;">💉 <strong>${f.label}</strong> — expired ${f.date}</p>`).join('')
    subject = `❌ Vaccines expired: ${data.dogName} (${data.ownerName}) — status reset to pending`
    html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#2c5a9e;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:white;margin:0;font-size:24px;">🐾 The Canine Gym — Admin</h1></div><div style="background:white;padding:32px;border:1px solid #eee;"><h2 style="color:#dc3545;">Vaccines Expired — Booking Blocked</h2><div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:16px;"><p style="margin:0 0 6px 0;color:#333;">🐾 <strong>${data.dogName}</strong></p><p style="margin:0 0 6px 0;color:#333;">👤 ${data.ownerName}</p><p style="margin:0;color:#333;">✉️ ${data.ownerEmail}</p></div><div style="background:#f8d7da;border:1px solid #f5c6cb;padding:20px;border-radius:8px;">${listItems}</div><p style="color:#555;margin-top:16px;font-size:14px;">Vaccine status has been automatically reset to pending. The client has been notified and must re-upload before booking.</p><a href="https://app.thecaninegym.com/admin/dogs/vaccines" style="display:block;background:#2c5a9e;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:16px;">View Vaccine Records →</a></div></div>`
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