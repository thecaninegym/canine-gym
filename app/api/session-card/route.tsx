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
  const photoUrl = searchParams.get('photo') || ''

  return new ImageResponse(
    (
      <div style={{ width: '630px', height: '630px', background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 60%, #3d70c0 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', position: 'relative', overflow: 'hidden', alignItems: 'center' }}>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,107,53,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex' }} />

        {/* Branding */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '28px 32px 0 32px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,107,53,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🐾</div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', display: 'flex' }}>The Canine Gym</div>
        </div>

        {/* Dog photo */}
        <div style={{ display: 'flex', marginTop: '24px' }}>
          {photoUrl ? (
            <img src={photoUrl} style={{ width: '110px', height: '110px', borderRadius: '22px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{ width: '110px', height: '110px', borderRadius: '22px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🐶</div>
          )}
        </div>

        {/* Dog name + city */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
          <div style={{ fontSize: '52px', fontWeight: 'bold', color: 'white', display: 'flex', lineHeight: 1 }}>{dogName}</div>
          {city && (
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {city}</div>
          )}
        </div>

        {/* Stats — 3 explicit boxes */}
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: '24px', padding: '0 28px', width: '630px', gap: '14px' }}>

          <div style={{ width: '178px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 'bold', color: 'white', display: 'flex', lineHeight: 1 }}>{sessions}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', display: 'flex' }}>Sessions</div>
          </div>

          <div style={{ width: '178px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 'bold', color: 'white', display: 'flex', lineHeight: 1 }}>{miles}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', display: 'flex' }}>Miles</div>
          </div>

          <div style={{ width: '178px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
            </div>
            <div style={{ fontSize: '34px', fontWeight: 'bold', color: 'white', display: 'flex', lineHeight: 1 }}>{calories}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', display: 'flex' }}>Calories</div>
          </div>

        </div>

        {/* Achievement */}
        {achievement && (
          <div style={{ display: 'flex', marginTop: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f88124, #f9a04e)', borderRadius: '40px', padding: '10px 24px', fontSize: '18px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 {achievement}
            </div>
          </div>
        )}

        {/* URL */}
        <div style={{ position: 'absolute', bottom: 22, right: 28, fontSize: '15px', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>app.thecaninegym.com</div>

      </div>
    ),
    { width: 630, height: 630 }
  )
}