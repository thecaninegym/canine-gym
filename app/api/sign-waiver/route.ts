import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ownerId, waiverName, optOutMedia, spendingLimit } = body

    if (!ownerId || !waiverName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Capture IP — check forwarded headers first (Vercel sets x-forwarded-for)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') ?? 'unknown')

    // Capture user agent
    const userAgent = request.headers.get('user-agent') ?? 'unknown'

    // Server-side timestamp — not from the client
    const signedAt = new Date().toISOString()

    const { error } = await supabase.from('owners').update({
      waiver_signed: true,
      waiver_signed_at: signedAt,
      waiver_name: waiverName,
      waiver_media_opt_out: optOutMedia ?? false,
      waiver_spending_limit: spendingLimit ? parseFloat(spendingLimit) : null,
      waiver_ip_address: ip,
      waiver_user_agent: userAgent,
    }).eq('id', ownerId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, signedAt })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}