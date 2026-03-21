import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dogName   = searchParams.get('dog') || 'Your Dog'
  const sessions  = searchParams.get('sessions') || '0'
  const miles     = searchParams.get('miles') || '0.00'
  const calories  = searchParams.get('calories') || '0'
  const peak      = searchParams.get('peak') || null
  const city      = searchParams.get('city') || ''
  const photoUrl  = searchParams.get('photo') || ''

  const stats = [
    { value: sessions,                  label: 'SESSIONS',       icon: 'sessions' },
    { value: `${miles} mi`,             label: 'TOTAL MILES',    icon: 'miles'    },
    { value: `${calories} cal`,         label: 'CALORIES',       icon: 'fire'     },
    { value: peak ? `${peak} mph` : '—', label: 'PEAK SPEED',   icon: 'bolt'     },
  ]

  // SVG icon paths (inline, no external deps)
  const icons: Record<string, string> = {
    sessions: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    miles:    'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    fire:     'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    bolt:     'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  }

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        background: 'linear-gradient(135deg, #001228 0%, #001840 45%, #0d2d5e 100%)',
        display: 'flex', flexDirection: 'row',
        fontFamily: 'Arial, sans-serif',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ── Background accents ── */}
        <div style={{ position: 'absolute', top: -120, right: 340, width: '420px', height: '420px', borderRadius: '50%', background: 'rgba(248,129,36,0.06)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -80, left: 320, width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(44,90,158,0.25)', display: 'flex' }} />
        {/* Orange accent bar on left edge */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: '6px', height: '630px', background: 'linear-gradient(180deg, #f88124, #f9a04e)', display: 'flex' }} />

        {/* ── LEFT PANEL — dog photo + identity ── */}
        <div style={{
          width: '380px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingLeft: '30px', paddingRight: '20px', gap: '0px',
        }}>

          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <img
              src="https://app.thecaninegym.com/logo-white.png"
              style={{ height: '36px', width: 'auto' }}
            />
          </div>

          {/* Dog photo */}
          <div style={{
            width: '200px', height: '200px', borderRadius: '28px',
            border: '3px solid rgba(248,129,36,0.6)',
            overflow: 'hidden', display: 'flex',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {photoUrl ? (
              <img src={photoUrl} style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px' }}>🐾</div>
            )}
          </div>

          {/* Dog name */}
          <div style={{
            marginTop: '20px', fontSize: '42px', fontWeight: '900',
            color: 'white', display: 'flex', lineHeight: 1.1,
            textAlign: 'center',
          }}>{dogName}</div>

          {/* City */}
          {city && (
            <div style={{ marginTop: '6px', fontSize: '16px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              📍 {city}
            </div>
          )}
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '48px 0', display: 'flex' }} />

        {/* ── RIGHT PANEL — stats ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '48px 52px 48px 48px', gap: '20px',
        }}>

          {/* Heading */}
          <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f88124', letterSpacing: '3px', display: 'flex' }}>FITNESS SUMMARY</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', display: 'flex', lineHeight: 1.1 }}>Crushing It 💪</div>
          </div>

          {/* Stats grid 2x2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              [stats[0], stats[1]],
              [stats[2], stats[3]],
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: '14px' }}>
                {row.map((stat, si) => (
                  <div key={si} style={{
                    flex: 1, background: 'rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '20px 24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f88124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icons[stat.icon]} />
                    </svg>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', display: 'flex', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', display: 'flex' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer URL */}
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
            app.thecaninegym.com
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}