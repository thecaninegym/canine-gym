import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidAccessToken, getActivitySeries } from '../../../../lib/fitbark'

export async function POST(request: Request) {
  const { sessionId, deviceSlug, startTime, endTime } = await request.json()

  try {
    const accessToken = await getValidAccessToken()

    const start = new Date(startTime)
    const end = new Date(endTime)
    const date = start.toISOString().split('T')[0]

    const data = await getActivitySeries(accessToken, deviceSlug, date, date)

    // Filter hourly buckets to session window and sum stats
    const series = data?.activity_series?.activity_series || []
    const sessionPoints = series.filter((point: any) => {
      const pointTime = new Date(point.date_time || point.datetime || point.time)
      return pointTime >= start && pointTime <= end
    })

    const totalActivity = sessionPoints.reduce((sum: number, p: any) => sum + (p.total || p.activity || p.steps || 0), 0)
    const activeMinutes = sessionPoints.reduce((sum: number, p: any) => sum + (p.active || p.active_time || 0), 0)
    const restMinutes = sessionPoints.reduce((sum: number, p: any) => sum + (p.rest || p.rest_time || 0), 0)
    const playMinutes = sessionPoints.reduce((sum: number, p: any) => sum + (p.play || p.play_time || 0), 0)

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    await db.from('sessions').update({
      fitbark_activity_total: totalActivity || null,
      fitbark_active_minutes: activeMinutes || null,
      fitbark_rest_minutes: restMinutes || null,
      fitbark_play_minutes: playMinutes || null,
      fitbark_raw: data,
    }).eq('id', sessionId)

    return NextResponse.json({ success: true, totalActivity, activeMinutes, restMinutes, playMinutes, dataPoints: series.length })
  } catch (err: any) {
    console.error('FitBark activity fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}