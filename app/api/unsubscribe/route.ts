import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const LOGO_URL = 'https://www.thecaninegym.com/logo.png'

function page(title: string, message: string, subMessage: string, color: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title} — The Canine Gym</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet"/></head>
  <body style="margin:0;padding:0;background:#f0f2f7;font-family:'Montserrat',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <div style="max-width:480px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);text-align:center;">
      <div style="background:white;padding:28px 32px;border-bottom:3px solid #f88124;">
        <img src="${LOGO_URL}" alt="The Canine Gym" style="height:60px;width:auto;display:block;margin:0 auto;"/>
      </div>
      <div style="padding:40px 32px;">
        <div style="font-size:48px;margin-bottom:16px;">${color === 'green' ? '✅' : '⚠️'}</div>
        <h1 style="color:#001840;font-size:22px;font-weight:800;margin:0 0 12px;">${message}</h1>
        <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 28px;">${subMessage}</p>
        <a href="https://app.thecaninegym.com/dashboard" style="display:inline-block;background:#f88124;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Go to My Dashboard</a>
      </div>
      <div style="background:#001840;padding:16px;text-align:center;">
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">© ${new Date().getFullYear()} The Canine Gym &nbsp;·&nbsp; Hamilton County, IN</p>
      </div>
    </div>
  </body></html>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(page('Error', 'Invalid link', 'This unsubscribe link is invalid or has expired. Please contact us at info@thecaninegym.com if you need help.', 'orange'), {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  let ownerId: string
  try {
    ownerId = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return new NextResponse(page('Error', 'Invalid link', 'This unsubscribe link is invalid. Please contact us at info@thecaninegym.com if you need help.', 'orange'), {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  const { error } = await supabase
    .from('owners')
    .update({ email_unsubscribed: true })
    .eq('id', ownerId)

  if (error) {
    return new NextResponse(page('Error', 'Something went wrong', 'We were unable to process your request. Please contact us at info@thecaninegym.com and we will remove you manually.', 'orange'), {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  return new NextResponse(page('Unsubscribed', "You've been unsubscribed.", "You won't receive any more marketing emails from us. You'll still receive transactional emails like booking confirmations and reminders since those are part of your service.", 'green'), {
    headers: { 'Content-Type': 'text/html' }
  })
}