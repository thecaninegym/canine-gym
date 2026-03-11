import { createClient } from '@supabase/supabase-js'

const FITBARK_API = 'https://app.fitbark.com/api/v2'
const FITBARK_AUTH_URL = 'https://app.fitbark.com/oauth'

const serviceSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export function getFitBarkAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  })
  return `${FITBARK_AUTH_URL}/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const res = await fetch(`${FITBARK_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshFitBarkToken(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await fetch(`${FITBARK_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

export async function getValidAccessToken(): Promise<string> {
  const db = serviceSupabase()
  const { data } = await db.from('fitbark_auth').select('*').single()
  if (!data) throw new Error('FitBark not connected')

  const expiresAt = new Date(data.expires_at)
  const now = new Date()

  // Refresh if expiring within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const tokens = await refreshFitBarkToken(
      data.refresh_token,
      process.env.FITBARK_CLIENT_ID!,
      process.env.FITBARK_CLIENT_SECRET!
    )
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await db.from('fitbark_auth').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || data.refresh_token,
      expires_at: newExpiry,
    }).eq('id', data.id)
    return tokens.access_token
  }

  return data.access_token
}

export async function getActivitySeries(accessToken: string, slug: string, from: string, to: string) {
  const res = await fetch(`${FITBARK_API}/activity_series`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activity_series: { slug, from, to, resolution: 'HOURLY' },
    }),
  })
  if (!res.ok) throw new Error(`Failed to fetch activity: ${await res.text()}`)
  return res.json()
}