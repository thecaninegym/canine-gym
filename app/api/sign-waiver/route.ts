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

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') ?? 'unknown')
    const userAgent = request.headers.get('user-agent') ?? 'unknown'
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

    // Send confirmation email
    const { data: ownerData } = await supabase
      .from('owners')
      .select('name, email')
      .eq('id', ownerId)
      .single()

    if (ownerData?.email) {
      const formattedDate = new Date(signedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waiver_signed',
          to: ownerData.email,
          data: {
            ownerName: ownerData.name,
            waiverName: waiverName.trim(),
            signedAt: formattedDate,
          },
        }),
      })
    }

    return NextResponse.json({ success: true, signedAt })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}