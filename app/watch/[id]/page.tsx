'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function WatchLive() {
  const params = useParams()
  const streamId = params.id as string
  const [playbackId, setPlaybackId] = useState<string | null>(null)
  const [dogName, setDogName] = useState('')
  const [status, setStatus] = useState<'loading' | 'live' | 'ended' | 'error'>('loading')
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await fetch(`/api/live-stream/watch?id=${streamId}`)
        const data = await res.json()
        if (data.error) { setStatus('error'); return }
        if (data.status === 'ended') { setStatus('ended'); setDogName(data.dogName || ''); return }
        setPlaybackId(data.playbackId)
        setDogName(data.dogName || '')
        setStatus('live')
      } catch { setStatus('error') }
    }
    fetchStream()
    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [streamId])

  useEffect(() => {
    if (!playbackId || !videoRef.current) return
    const src = `https://stream.mux.com/${playbackId}.m3u8`

    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src
      videoRef.current.play().catch(() => {})
    } else {
      const loadHls = async () => {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true })
          hls.loadSource(src)
          hls.attachMedia(videoRef.current!)
          hls.on(Hls.Events.MANIFEST_PARSED, () => { videoRef.current?.play().catch(() => {}) })
          hlsRef.current = hls
        }
      }
      loadHls()
    }

    return () => { hlsRef.current?.destroy() }
  }, [playbackId])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '48px', marginBottom: '12px' }} />
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Connecting to live stream...</div>
            <div style={{ fontSize: '14px', color: '#888' }}>Please wait a moment</div>
          </div>
        )}

        {status === 'live' && (
          <>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <video
                ref={videoRef}
                controls
                playsInline
                muted
                autoPlay
                style={{ width: '100%', display: 'block', background: '#000' }}
              />
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4444', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Live</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: '0 0 4px' }}>{dogName}'s Session</p>
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Live from The Canine Gym</p>
            </div>
          </>
        )}

        {status === 'ended' && (
          <div style={{ textAlign: 'center', color: 'white', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{dogName}'s Session is Complete!</div>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>Great workout! Check the app for the full session report.</div>
            <a href="https://app.thecaninegym.com" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              View Session Report
            </a>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', color: 'white', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😿</div>
            <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Stream not found</div>
            <div style={{ fontSize: '14px', color: '#888' }}>This link may have expired or the session hasn't started yet.</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
