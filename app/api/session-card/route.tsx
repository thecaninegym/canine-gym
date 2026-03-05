import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dogName = searchParams.get('dog') || 'Your Dog'
  const sessions = searchParams.get('sessions') || '0'
  const miles = searchParams.get('miles') || '0'
  const calories = searchParams.get('calories') || '0'
  const city = searchParams.get('city') || ''
  const achievement = searchParams.get('achievement') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#003087',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Top branding */}
        <div style={{ position: 'absolute', top: 40, left: 60, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>🐾 The Canine Gym</div>
        </div>

        {/* Dog name */}
        <div style={{ fontSize: 80, fontWeight: 'bold', color: 'white', marginBottom: '8px', display: 'flex' }}>
          {dogName}
        </div>

        {/* City */}
        {city && (
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', marginBottom: '48px', display: 'flex' }}>
            {city} · The Canine Gym
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '48px' }}>
          {[
            { icon: '🏃', value: sessions, label: 'Sessions' },
            { icon: '📍', value: miles, label: 'Miles' },
            { icon: '🔥', value: calories, label: 'Calories' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: 40, marginBottom: '8px', display: 'flex' }}>{stat.icon}</div>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white', display: 'flex' }}>{stat.value}</div>
              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievement badge */}
        {achievement && (
          <div style={{
            background: '#FF6B35',
            borderRadius: '40px',
            padding: '12px 32px',
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            display: 'flex'
          }}>
            🏆 {achievement}
          </div>
        )}

        {/* Bottom URL */}
        <div style={{ position: 'absolute', bottom: 40, right: 60, fontSize: 24, color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
          app.thecaninegym.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}