import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const LOGO_URL = 'https://www.thecaninegym.com/logo.png'
const BLUE = '#2c5a9e'
const ORANGE = '#f88124'
const DARK_BLUE = '#001840'

function emailWrapper(headerLabel: string, bodyContent: string, unsubscribeUrl?: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style="margin:0;padding:0;background:#f0f2f7;font-family:'Montserrat',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:white;padding:28px 32px;text-align:center;border-bottom:3px solid ${ORANGE};">
      <img src="${LOGO_URL}" alt="The Canine Gym" style="height:70px;width:auto;display:block;margin:0 auto 12px;"/>
      ${headerLabel ? `<div style="display:inline-block;background:${DARK_BLUE};border-radius:20px;padding:4px 16px;"><span style="color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${headerLabel}</span></div>` : ''}
    </div>
    <div style="background:white;padding:36px 32px;">${bodyContent}</div>
    <div style="background:${DARK_BLUE};padding:20px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;font-family:'Montserrat',Arial,sans-serif;">© ${new Date().getFullYear()} The Canine Gym &nbsp;·&nbsp; Hamilton County, IN &nbsp;·&nbsp; <a href="https://www.thecaninegym.com" style="color:rgba(255,255,255,0.5);text-decoration:none;">thecaninegym.com</a></p>
      ${unsubscribeUrl ? `<p style="margin:8px 0 0;font-family:'Montserrat',Arial,sans-serif;"><a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.25);font-size:11px;text-decoration:underline;">Unsubscribe from marketing emails</a></p>` : ''}
    </div>
  </div>
</body></html>`
}

function unsubscribeLink(ownerId: string) {
  const token = Buffer.from(ownerId).toString('base64url')
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?token=${token}`
}

function btn(text: string, href: string, color = ORANGE) {
  return `<a href="${href}" style="display:block;background:${color};color:white;text-align:center;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Montserrat',Arial,sans-serif;margin-top:8px;">${text} →</a>`
}

function infoBox(rows: string[], bg = '#f0f2f7', border = '') {
  return `<div style="background:${bg};${border ? `border:1.5px solid ${border};` : ''}border-radius:12px;padding:20px 24px;margin:20px 0;">${rows.join('')}</div>`
}

function row(label: string, value: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(0,0,0,0.06);"><tr><td style="padding:8px 0;color:#888;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;width:40%;">${label}</td><td style="padding:8px 0;color:#1a1a2e;font-size:14px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;text-align:right;">${value}</td></tr></table>`
}

function h1(text: string, color = BLUE) {
  return `<h2 style="color:${color};font-size:22px;font-weight:800;margin:0 0 10px;font-family:'Montserrat',Arial,sans-serif;">${text}</h2>`
}

function p(text: string) {
  return `<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;font-family:'Montserrat',Arial,sans-serif;">${text}</p>`
}

function alert(text: string, bg: string, border: string, color: string) {
  return `<div style="background:${bg};border:1.5px solid ${border};border-radius:10px;padding:16px 20px;margin:20px 0;"><p style="margin:0;color:${color};font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">${text}</p></div>`
}

export async function POST(request: Request) {
  const { type, to, data } = await request.json()
  let subject = ''
  let html = ''

  if (type === 'welcome') {
    subject = `Welcome to The Canine Gym, ${data.ownerName}!`
    html = emailWrapper('Welcome to the Pack', `
      ${h1(`Hi ${data.ownerName}, you're in! 🎉`)}
      ${p(`We're thrilled to have you join The Canine Gym. Your dog deserves the best workout, and now they've got it, delivered right to your home.`)}
      ${infoBox([
        `<p style="color:#1a1a2e;font-size:14px;font-weight:700;margin:0 0 12px;font-family:'Montserrat',Arial,sans-serif;">Here's how to get started:</p>`,
        `<p style="color:#555;font-size:13px;margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;">📋 <strong>Upload vaccine records</strong> for your dog to get cleared to run</p>`,
        `<p style="color:#555;font-size:13px;margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;">📅 <strong>Book your first session</strong> and pick a time that works for you</p>`,
        `<p style="color:#555;font-size:13px;margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;">🏆 <strong>Track progress</strong>: sessions, milestones, and leaderboard rankings</p>`,
        `<p style="color:#555;font-size:13px;margin:0;font-family:'Montserrat',Arial,sans-serif;">📸 <strong>Share your dog's stats</strong> with friends and family</p>`,
      ])}
      ${btn('Go to My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

  if (type === 'booking_confirmation') {
    subject = `Session confirmed for ${data.dogName} — ${data.date}`
    html = emailWrapper('Booking Confirmed', `
      ${h1(`You're all set, ${data.ownerName}! ✅`)}
      ${p(`${data.dogName}'s session is locked in. We'll come to you! Just be ready to hand over one very excited dog.`)}
      ${infoBox([row('Dog', data.dogName), row('Date', data.date), row('Time', data.time)])}
      ${alert(`Cancellation Policy: Please cancel at least 48 hours in advance to avoid a fee.`, '#fff4e6', ORANGE, '#b85c00')}
      ${btn('View My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

  if (type === 'reminder') {
    const checklistItems = [
      ['🚫', 'No food or large amounts of water 2 hours before', `Please hold off on feeding ${data.dogName} and avoid large amounts of water at least 2 hours before the session. Exercising on a full stomach or with heavy water intake can cause serious discomfort and increases the risk of bloat.`],
      ['🐕‍🦺', 'Have your dog in their harness and ready', `When we pull up, please have ${data.dogName} fitted in their Y-front or back-clip body harness and ready to go. We are not able to use neck collars for sessions, so please make sure the harness is on before we arrive.`],
      ['🐾', 'Let your dog potty before we arrive', 'A quick bathroom break before we get there means more time on the treadmill!'],
      ['💧', "We'll have fresh water on board", `No need to worry about hydration after the session, we have fresh water on board for ${data.dogName}.`],
      ['👀', 'You are welcome to watch', "Feel free to stick around and watch the session, you're not required to, but you're always welcome!"],
      ['🏠', "We'll bring your dog back up", `When the session is done, we'll walk ${data.dogName} right back up to your door. No need to come to us!`],
    ]
    const checklistHtml = checklistItems.map(([icon, title, desc]) => `
      <div style="display:flex;gap:14px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
        <span style="font-size:20px;flex-shrink:0;line-height:1.4;">${icon}</span>
        <div>
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#001840;font-family:'Montserrat',Arial,sans-serif;">${title}</p>
          <p style="margin:0;font-size:13px;color:#888;font-family:'Montserrat',Arial,sans-serif;line-height:1.5;">${desc}</p>
        </div>
      </div>
    `).join('')
    const vaccineAlert = data.vaccineStatus && data.vaccineStatus !== 'approved'
      ? alert(
          data.vaccineStatus === 'rejected'
            ? `Action required: ${data.dogName}'s vaccine records were rejected. Please re-upload updated records before your session so we can confirm everything is in order.`
            : `Heads up: ${data.dogName}'s vaccine records are still under review. Records must be approved before your session can take place. If you haven't uploaded them yet, please do so now from your dog's profile.`,
          data.vaccineStatus === 'rejected' ? '#ffeaea' : '#fff8e6',
          data.vaccineStatus === 'rejected' ? '#dc3545' : '#856404',
          data.vaccineStatus === 'rejected' ? '#721c24' : '#533f00'
        )
      : ''
    subject = `Reminder: ${data.dogName}'s session is tomorrow at ${data.time}`
    html = emailWrapper('Session Reminder', `
      ${h1(`See you tomorrow, ${data.ownerName}! 👋`)}
      ${p(`Just a heads up, ${data.dogName} is on the schedule for tomorrow. We'll be pulling up to your place ready to go.`)}
      ${infoBox([row('Dog', data.dogName), row('Date', data.date), row('Time', data.time)])}
      ${vaccineAlert}
      <div style="margin:24px 0;">
        <h3 style="color:#001840;font-size:16px;font-weight:800;margin:0 0 14px;font-family:'Montserrat',Arial,sans-serif;">📋 How to Prepare for Tomorrow's Session</h3>
        <div style="background:#f8f9ff;border-radius:12px;padding:20px 24px;">${checklistHtml}</div>
      </div>
      ${p(`Need to cancel or reschedule? Please do it as soon as possible through your dashboard so we can open the slot for another pup.`)}
      ${btn('View My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

  if (type === 'booking_cancelled') {
    subject = `Your booking for ${data.dogName} has been cancelled`
    html = emailWrapper('Booking Cancelled', `
      ${h1(`Booking cancelled, ${data.ownerName}.`)}
      ${p(`Your session for ${data.dogName} has been successfully cancelled.`)}
      ${infoBox([row('Dog', data.dogName), row('Date', data.date), row('Time', data.time)])}
      ${data.refundNote ? alert(data.refundNote, '#fff4e6', ORANGE, '#b85c00') : ''}
      ${p(`Want to rebook? You can schedule a new session any time from your dashboard.`)}
      ${btn('Book a New Session', 'https://app.thecaninegym.com/book')}
    `)
  }

  if (type === 'admin_notification') {
    subject = `${data.action}: ${data.dogName} — ${data.date}`
    html = emailWrapper('Admin Notification', `
      ${h1(data.action)}
      ${infoBox([
        row('Dog', data.dogName),
        row('Owner', data.ownerName),
        row('Date', data.date),
        row('Time', data.time),
        data.reason ? `<div style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><span style="color:#dc3545;font-size:13px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;">Reason: ${data.reason}</span></div>` : '',
        data.fee ? `<div style="padding:8px 0;"><span style="color:#dc3545;font-size:13px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;">⚠️ Cancellation fee applies</span></div>` : '',
      ])}
      ${btn('View Schedule', 'https://app.thecaninegym.com/admin/schedule', BLUE)}
    `)
  }

  if (type === 'receipt_alacarte') {
    subject = `Payment confirmed — ${data.dogName}'s session on ${data.date}`
    html = emailWrapper('Payment Receipt', `
      ${h1(`Payment confirmed, ${data.ownerName}!`)}
      ${p(`Thanks for booking with The Canine Gym. Here's your receipt, keep it for your records.`)}
      ${infoBox([
        row('Dog', data.dogName),
        row('Date', data.date),
        row('Time', data.time),
        row('Session Type', 'À La Carte'),
        `<div style="padding:12px 0 4px;"><span style="color:${BLUE};font-size:18px;font-weight:800;font-family:'Montserrat',Arial,sans-serif;">Total Paid: ${data.amount}</span></div>`,
      ])}
      ${alert(`Cancellation Policy: Cancel at least 48 hours in advance for a full refund. Late cancellations receive a 50% refund.`, '#fff4e6', ORANGE, '#b85c00')}
      ${btn('View My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

 if (type === 'receipt_intro') {
    subject = `Intro Package confirmed — ${data.dogName}'s sessions are booked!`
    html = emailWrapper('Intro Package', `
      ${h1(`You're all set, ${data.ownerName}!`)}
      ${p(`We've confirmed both intro sessions for <strong>${data.dogName}</strong>. We recommend spacing them at least one week apart so ${data.dogName} has time to settle in between runs, or book both in the same week since we're in your area twice.`)}
      ${infoBox([
        row('Dog', data.dogName),
        row('Session 1', `${data.session1Date}`),
        row('', data.session1Time),
        row('Session 2', `${data.session2Date}`),
        row('', data.session2Time),
        row('Package', 'Intro (2 Sessions)'),
        `<div style="padding:12px 0 4px;"><span style="color:${BLUE};font-size:18px;font-weight:800;font-family:'Montserrat',Arial,sans-serif;">Total Paid: ${data.amount}</span></div>`,
      ])}
      ${alert(`Some dogs take a session or two to get comfortable on the slatmill — that's completely normal. By session two, most dogs are hitting their stride.`, '#fff4e6', ORANGE, '#b85c00')}
      ${alert(`Cancellation Policy: Cancel at least 48 hours in advance for a full refund. Late cancellations receive a 50% refund.`, '#f0f2f7', '#c8d0e0', '#555')}
      ${btn('View My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

  if (type === 'receipt_membership') {
    subject = `Membership confirmed, welcome to the pack, ${data.ownerName}!`
    html = emailWrapper('Membership Receipt', `
      ${h1(`You're a member, ${data.ownerName}! 🎉`)}
      ${p(`Your membership is live. Sessions are at your fingertips, book whenever works for you and we'll come to you.`)}
      ${infoBox([
        row('Plan', data.planName),
        row('Dogs Covered', data.dogNames),
        row('Sessions Per Month', data.sessionsPerMonth),
        row('Billing', 'Renews monthly'),
        `<div style="padding:12px 0 4px;"><span style="color:${BLUE};font-size:18px;font-weight:800;font-family:'Montserrat',Arial,sans-serif;">Total Paid: ${data.amount}</span></div>`,
      ])}
      ${btn('Book Your First Session', 'https://app.thecaninegym.com/book')}
      <div style="margin-top:8px;">${btn('Manage Membership', 'https://app.thecaninegym.com/membership', BLUE)}</div>
    `)
  }

  if (type === 'waiver_signed') {
    subject = `Your Canine Gym waiver has been signed`
    html = emailWrapper('Waiver Confirmation', `
      ${h1(`Waiver signed, ${data.ownerName}!`)}
      ${p(`This email confirms that your liability waiver for The Canine Gym has been electronically signed and recorded. Keep this for your records.`)}
      ${infoBox([
        row('Name on File', data.waiverName),
        row('Date Signed', data.signedAt),
        row('Record', 'Electronically signed via The Canine Gym app'),
      ])}
      ${alert(`If you did not sign this waiver or believe this was done in error, please contact us immediately at info@thecaninegym.com.`, '#fff4e6', ORANGE, '#b85c00')}
      ${btn('View My Account', 'https://app.thecaninegym.com/dashboard')}
    `)
  }
  
  if (type === 'membership_cancelled_client') {
    subject = `Your Canine Gym membership has been cancelled`
    html = emailWrapper('Membership Cancelled', `
      ${h1(`Hi ${data.ownerName}, your membership has been cancelled.`)}
      ${p(`We're sorry to see you go! Your access doesn't end right away, here's what you need to know.`)}
      ${infoBox([
        row('Plan', `${data.planName} — Cancelled`),
        row('Access Until', data.periodEnd),
        row('Sessions Remaining', `${data.sessionsRemaining} this month`),
      ])}
      ${alert(`You can still book and use your remaining sessions until <strong>${data.periodEnd}</strong>. After that your membership will fully expire.`, '#fff4e6', ORANGE, '#b85c00')}
      ${btn('Book Remaining Sessions', 'https://app.thecaninegym.com/book')}
      <div style="margin-top:8px;">${btn('Reactivate Membership', 'https://app.thecaninegym.com/membership', BLUE)}</div>
      ${p(`Changed your mind? We'd love to have you back. You can reactivate any time from your membership page.`)}
    `)
  }

  if (type === 'membership_cancelled_admin') {
    subject = `Membership cancelled: ${data.ownerName} — ${data.planName}`
    html = emailWrapper('Membership Cancelled', `
      ${h1('Membership Cancelled', '#dc3545')}
      ${infoBox([
        row('Owner', data.ownerName),
        row('Email', data.ownerEmail),
        row('Plan', data.planName),
        row('Access Until', data.periodEnd),
        row('Sessions Remaining', `${data.sessionsRemaining}`),
      ])}
      ${btn('View Memberships', 'https://app.thecaninegym.com/admin/memberships', BLUE)}
    `)
  }

  if (type === 'vaccine_uploaded') {
    subject = `Vaccine record submitted: ${data.dogName} (${data.ownerName})`
    html = emailWrapper('Vaccine Record Submitted', `
      ${h1('New Vaccine Record Needs Review', '#856404')}
      ${p('A client has submitted vaccine records for their dog. Please review and approve or reject from the admin panel.')}
      ${infoBox([row('Dog', data.dogName), row('Owner', data.ownerName), row('Email', data.ownerEmail)], '#fffbea', '#ffc107')}
      ${btn('Review Vaccine Records', 'https://app.thecaninegym.com/admin/dogs/vaccines', BLUE)}
    `)
  }

  if (type === 'vaccine_approved') {
    subject = `${data.dogName}'s vaccine records are approved, you're cleared to run!`
    html = emailWrapper('Vaccines Approved', `
      ${h1(`Great news, ${data.ownerName}! ✅`)}
      ${p(`We've reviewed and approved <strong>${data.dogName}</strong>'s vaccine records. Everything checks out, you're officially cleared to book sessions.`)}
      ${infoBox([`<p style="color:#155724;font-size:14px;font-weight:700;margin:0;font-family:'Montserrat',Arial,sans-serif;">🐾 ${data.dogName} is cleared to run!</p>`], '#d4edda', '#c3e6cb')}
      ${btn('Book a Session Now', 'https://app.thecaninegym.com/book')}
    `)
  }

  if (type === 'vaccine_rejected') {
    subject = `Action needed: ${data.dogName}'s vaccine records`
    html = emailWrapper('Vaccine Records: Action Needed', `
      ${h1(`Hi ${data.ownerName}, we need a little help.`, '#dc3545')}
      ${p(`We weren't able to approve the vaccine records submitted for <strong>${data.dogName}</strong>. No worries, it's an easy fix.`)}
      ${infoBox([
        `<p style="color:#721c24;font-size:13px;font-weight:700;margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;">Reason:</p>`,
        `<p style="color:#721c24;font-size:14px;margin:0;font-family:'Montserrat',Arial,sans-serif;">${data.reason}</p>`,
      ], '#f8d7da', '#f5c6cb')}
      ${p(`Please take a clear, well-lit photo of the full vaccine certificate and re-upload from your dog's profile page.`)}
      ${btn('Re-upload Vaccine Records', 'https://app.thecaninegym.com/dogs')}
    `)
  }

  if (type === 'vaccine_expiring') {
    const listItems = data.expiringFields.map((f: any) => row(`💉 ${f.label}`, `Expires ${f.date} (${f.daysLeft} days)`)).join('')
    subject = `Heads up: ${data.dogName}'s vaccines are expiring soon`
    html = emailWrapper('Vaccine Expiry Notice', `
      ${h1(`${data.dogName}'s vaccines need attention, ${data.ownerName}.`, '#856404')}
      ${p(`The following vaccine(s) are expiring within the next 30 days. To keep ${data.dogName} cleared to run, please visit your vet and upload updated records before they expire.`)}
      ${infoBox([listItems], '#fffbea', '#ffc107')}
      ${p(`Uploading is quick, just snap a clear photo of the updated certificate from your dog's profile.`)}
      ${btn('Update Vaccine Records', 'https://app.thecaninegym.com/dogs')}
    `)
  }

  if (type === 'vaccine_expiring_admin') {
    const listItems = data.expiringFields.map((f: any) => row(`💉 ${f.label}`, `Expires ${f.date} (${f.daysLeft} days)`)).join('')
    subject = `Vaccine expiry alert: ${data.dogName} (${data.ownerName})`
    html = emailWrapper('Vaccine Expiry Alert', `
      ${h1('Vaccine Expiry Alert', '#856404')}
      ${infoBox([row('Dog', data.dogName), row('Owner', data.ownerName), row('Email', data.ownerEmail)])}
      ${infoBox([listItems], '#fffbea', '#ffc107')}
      ${p('The client has been automatically notified and asked to upload updated records.')}
      ${btn('View Vaccine Records', 'https://app.thecaninegym.com/admin/dogs/vaccines', BLUE)}
    `)
  }

  if (type === 'vaccine_expired') {
    const listItems = data.expiredFields.map((f: any) => row(`💉 ${f.label}`, `Expired ${f.date}`)).join('')
    subject = `Action required: ${data.dogName}'s vaccines have expired`
    html = emailWrapper('Vaccines Expired', `
      ${h1(`${data.dogName}'s vaccines have expired, ${data.ownerName}.`, '#dc3545')}
      ${p(`We've temporarily paused ${data.dogName}'s ability to book sessions until updated records are uploaded and approved. This is to keep all dogs in our community safe.`)}
      ${infoBox([listItems], '#f8d7da', '#f5c6cb')}
      ${p(`Please visit your vet, get updated records, and upload a clear photo from your dog's profile. Once approved, booking will resume immediately.`)}
      ${btn('Upload Updated Records', 'https://app.thecaninegym.com/dogs')}
    `)
  }

  if (type === 'vaccine_expired_admin') {
    const listItems = data.expiredFields.map((f: any) => row(`💉 ${f.label}`, `Expired ${f.date}`)).join('')
    subject = `Vaccines expired: ${data.dogName} (${data.ownerName}) — booking blocked`
    html = emailWrapper('Vaccines Expired: Booking Blocked', `
      ${h1('Vaccines Expired: Booking Blocked', '#dc3545')}
      ${infoBox([row('Dog', data.dogName), row('Owner', data.ownerName), row('Email', data.ownerEmail)])}
      ${infoBox([listItems], '#f8d7da', '#f5c6cb')}
      ${p('Vaccine status has been automatically reset to pending. The client has been notified and must re-upload and get approved before they can book again.')}
      ${btn('View Vaccine Records', 'https://app.thecaninegym.com/admin/dogs/vaccines', BLUE)}
    `)
  }

  if (type === 'booking_rescheduled_client') {
    subject = `Your booking for ${data.dogName} has been rescheduled`
    html = emailWrapper('Booking Rescheduled', `
      ${h1(`Your booking has been rescheduled, ${data.ownerName}.`)}
      ${p(`We've made a change to your upcoming session for <strong>${data.dogName}</strong>. Here are the updated details:`)}
      ${infoBox([
        row('Dog', data.dogName),
        row('Previous Date', data.oldDate),
        row('Previous Time', data.oldTime),
        row('New Date', data.newDate),
        row('New Time', data.newTime),
      ])}
      ${p(`Questions? Just reply to this email and we'll get back to you.`)}
      ${btn('View My Dashboard', 'https://app.thecaninegym.com/dashboard')}
    `)
  }

  if (type === 'booking_rescheduled_admin') {
    subject = `Booking rescheduled: ${data.dogName} (${data.ownerName})`
    html = emailWrapper('Booking Rescheduled', `
      ${h1(`Booking rescheduled`)}
      ${infoBox([
        row('Dog', data.dogName),
        row('Owner', data.ownerName),
        row('Previous Date', data.oldDate),
        row('Previous Time', data.oldTime),
        row('New Date', data.newDate),
        row('New Time', data.newTime),
      ])}
      ${btn('View Schedule', 'https://app.thecaninegym.com/admin/schedule', BLUE)}
    `)
  }

  if (type === 'onboarding_day2') {
    subject = `How to book your first session, ${data.ownerName} 🐾`
    const unsub2 = data.ownerId ? unsubscribeLink(data.ownerId) : undefined
    html = emailWrapper('Getting Started', `
      ${h1(`Here's how it works, ${data.ownerName}!`)}
      ${p(`We're so glad you joined The Canine Gym. Here's everything you need to know to get <strong>${data.dogName}</strong> started:`)}
      ${infoBox([
        row('📍 Step 1', 'We come to you. Just give us your address when booking'),
        row('📅 Step 2', 'Pick a date and time slot that works for your neighborhood'),
        row('🐕 Step 3', `We handle the rest, ${data.dogName} hops on the slatmill and gets to work!`),
      ])}
      ${p(`Sessions are 30 minutes and designed specifically for your dog's fitness level. No experience needed, we guide every dog through their first session.`)}
      ${p(`Ready to get started? Book your first session right from your dashboard:`)}
      ${btn('Book Your First Session', 'https://app.thecaninegym.com/book')}
    `, unsub2)
  }

  if (type === 'onboarding_day5') {
    subject = `${data.dogName} is waiting for their workout!`
    const unsub5 = data.ownerId ? unsubscribeLink(data.ownerId) : undefined
    html = emailWrapper('Your Dog Deserves This', `
      ${h1(`Don't let ${data.dogName} miss out!`)}
      ${p(`Hi ${data.ownerName}, we noticed ${data.dogName} hasn't had their first session yet. We totally get it, life gets busy!`)}
      ${p(`Here's what ${data.dogName} has to look forward to:`)}
      ${infoBox([
        row('💪 Real fitness', 'Slatmill running burns energy and builds muscle like nothing else'),
        row('🏆 Achievements', 'Dogs earn badges and climb the leaderboard as they hit milestones'),
        row('📊 Progress tracking', 'Watch your dog improve session over session with real data'),
        row('🚐 Zero hassle', 'We come right to your home. No driving, no drop-off'),
      ])}
      ${p(`Your first session is the hardest to schedule, after that it becomes part of the routine. ${data.dogName} will thank you for it.`)}
      ${btn('Book Your First Session', 'https://app.thecaninegym.com/book')}
    `, unsub5)
  }

  if (type === 'reengagement_14') {
    subject = `We miss ${data.dogName}! Come back and run 🐾`
    const unsubRe14 = data.ownerId ? unsubscribeLink(data.ownerId) : undefined
    html = emailWrapper('We Miss You', `
      ${h1(`It's been a while, ${data.ownerName}!`)}
      ${p(`We haven't seen <strong>${data.dogName}</strong> in ${data.daysSince} days and we're missing that pup! Life gets busy, we get it.`)}
      ${p(`But here's the thing about dog fitness: consistency is everything. Even one session every couple of weeks keeps ${data.dogName}'s energy levels balanced and their routine on track.`)}
      ${infoBox([
        row('⏱️ Just 30 minutes', 'We come to you, no driving required'),
        row('🔄 Pick up where you left off', `${data.dogName} remembers the slatmill`),
        row('📈 Track the comeback', 'Every session adds to the progress chart'),
      ])}
      ${p(`Ready to get ${data.dogName} back on the treadmill?`)}
      ${btn('Book a Session', 'https://app.thecaninegym.com/book')}
    `, unsubRe14)
  }

  if (type === 'reengagement_30') {
    subject = `Don't let ${data.dogName}'s progress slip away 📉`
    const unsubRe30 = data.ownerId ? unsubscribeLink(data.ownerId) : undefined
    html = emailWrapper('Come Back', `
      ${h1(`${data.dogName} needs you, ${data.ownerName}.`)}
      ${p(`It's been about a month since ${data.dogName}'s last session. We're not here to guilt trip you, but we do want to be straight with you:`)}
      ${infoBox([
        `<p style="color:#dc3545;font-size:14px;font-weight:700;margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;">After 4+ weeks without activity, dogs can lose:</p>`,
        row('💪 Muscle tone', 'Built up over weeks of consistent training'),
        row('⚡ Energy regulation', 'Regular runs keep behavior balanced'),
        row('🏆 Leaderboard ranking', `${data.dogName}'s spot is slipping`),
      ], '#fff4e6', '#f88124')}
      ${p(`The good news? It all comes back quickly. One session and ${data.dogName} will be right back in the groove.`)}
      ${p(`We'd love to see you both again. Book anytime, we'll come to you.`)}
      ${btn('Get Back on Track', 'https://app.thecaninegym.com/book')}
    `, unsubRe30)
  }

  if (type === 'new_client_admin') {
    subject = `New Client: ${data.ownerName}`
    html = emailWrapper('New Client Signed Up', `
      ${h1('New Client Signed Up 🎉')}
      ${infoBox([
        row('Name', data.ownerName),
        row('Email', data.email),
        row('Date', data.date),
        row('Time', data.time),
      ])}
      ${btn('View in Admin', 'https://app.thecaninegym.com/admin/owners', BLUE)}
    `)
  }

  if (type === 'new_follower') {
    subject = `${data.followerName} started following you on The Canine Gym!`
    html = emailWrapper('New Follower', `
      ${h1(`You have a new follower! 🐾`)}
      ${p(`Hi ${data.ownerName}, <strong>${data.followerName}</strong> just started following you on The Canine Gym.`)}
      ${p(`They'll be able to see your dog's activity and cheer them on. Head over to the app to check out who's following you!`)}
      ${btn('View My Friends', 'https://app.thecaninegym.com/friends')}
    `)
  }

  if (type === 'broadcast') {
    subject = data.subject
    const bodyLines = (data.message as string)
      .split('\n')
      .filter((l: string) => l.trim())
      .map((line: string) => p(line))
      .join('')
    html = emailWrapper('Message from The Canine Gym', `
      ${h1(`Hi ${data.ownerName}!`)}
      ${bodyLines}
      ${p('<em style="color:#aaa;font-size:12px;">You received this message because you have an account with The Canine Gym. Questions? Reply to this email or visit <a href="https://app.thecaninegym.com" style="color:#2c5a9e;">app.thecaninegym.com</a>.</em>')}
    `)
  }

  if (type === 'admin_bounce_alert') {
    subject = `⚠️ Email bounced: ${data.bouncedEmail}`
    html = emailWrapper('Email Bounce Alert', `
      ${h1(`An email bounced`, '#dc3545')}
      ${p(`An email failed to deliver. The recipient likely typed their address wrong during signup. You should reach out to them to get the correct email.`)}
      ${infoBox([
        row('Bounced Address', data.bouncedEmail),
        row('Owner Name', data.ownerName || 'Unknown'),
        row('Phone', data.ownerPhone || 'Not on file'),
        row('Bounce Type', data.bounceType || 'Unknown'),
        row('Reason', data.bounceReason || 'Not specified'),
        row('Email That Bounced', data.emailSubject || 'Unknown'),
      ], '#ffeaea', '#dc3545')}
      ${data.ownerId ? btn('View Owner in Admin', `https://app.thecaninegym.com/admin/owners/${data.ownerId}`, BLUE) : ''}
    `)
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