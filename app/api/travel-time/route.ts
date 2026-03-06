import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { addresses } = await request.json()

  if (!addresses || addresses.length < 2) {
    return NextResponse.json({ totalMinutes: 0, legs: [] })
  }

  const origins = addresses.slice(0, -1).map((a: string) => encodeURIComponent(a)).join('|')
  const destinations = addresses.slice(1).map((a: string) => encodeURIComponent(a)).join('|')

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${process.env.GOOGLE_MAPS_API_KEY}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ totalMinutes: 0, legs: [] })
    }

    let totalMinutes = 0
    const legs: { from: string; to: string; minutes: number; text: string }[] = []

    data.rows?.forEach((row: any, i: number) => {
      const element = row.elements?.[i]
      if (element?.status === 'OK') {
        const minutes = Math.round(element.duration.value / 60)
        totalMinutes += minutes
        legs.push({
          from: addresses[i],
          to: addresses[i + 1],
          minutes,
          text: element.duration.text
        })
      }
    })

    return NextResponse.json({ totalMinutes, legs })
  } catch (error) {
    return NextResponse.json({ totalMinutes: 0, legs: [] })
  }
}