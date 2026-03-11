import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCodeForToken } from '../../../../lib/fitbark'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/fitbark?error=access_denied`)
  }

  try {
    const tokens = await exchangeCodeForToken(
      code,
      process.env.FITBARK_CLIENT_ID!,
      process.env.FITBARK_CLIENT_SECRET!,
      process.env.FITBARK_REDIRECT_URI!
    )

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Only one row ever exists — upsert it
    const { data: existing } = await db.from('fitbark_auth').select('id').single()
    if (existing) {
      await db.from('fitbark_auth').update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await db.from('fitbark_auth').insert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/fitbark?success=connected`)
  } catch (err: any) {
    console.error('FitBark OAuth error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/fitbark?error=token_failed`)
  }
}