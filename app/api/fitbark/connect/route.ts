import { NextResponse } from 'next/server'
import { getFitBarkAuthUrl } from '../../../../lib/fitbark'

export async function GET() {
  const clientId = process.env.FITBARK_CLIENT_ID!
  const redirectUri = process.env.FITBARK_REDIRECT_URI!
  const url = getFitBarkAuthUrl(clientId, redirectUri)
  return NextResponse.redirect(url)
}