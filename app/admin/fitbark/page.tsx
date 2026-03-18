'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { ArrowLeft, Zap, CheckCircle, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function FitBarkAdmin() {
  const [connected, setConnected] = useState(false)
  const [connectedAt, setConnectedAt] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'connected') {
      setStatus({ type: 'success', message: 'FitBark account connected successfully!' })
    } else if (params.get('error')) {
      setStatus({ type: 'error', message: 'Failed to connect FitBark. Please try again.' })
    }
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    const { data: auth } = await supabase.from('fitbark_auth').select('connected_at, expires_at').single()
    if (auth) {
      setConnected(true)
      setConnectedAt(auth.connected_at)
      setExpiresAt(auth.expires_at)
    }
    const { data: devicesData } = await supabase.from('devices').select('*').order('device_name')
    setDevices(devicesData || [])
    setLoading(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 6vw, 56px)', width: 'auto' }} />
        <a href="/admin" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)', flexShrink: 0 }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 2px', fontSize: '20px', fontWeight: '800' }}>FitBark Integration</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Connect your FitBark account to pull session activity data</p>
          </div>
        </div>

        {status && (
          <div style={{ background: status.type === 'success' ? '#d4edda' : '#f8d7da', color: status.type === 'success' ? '#155724' : '#721c24', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {status.message}
          </div>
        )}

        {/* Connection Status */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: connected ? '20px' : '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: connected ? '#28a745' : '#dc3545', boxShadow: connected ? '0 0 0 3px rgba(40,167,69,0.2)' : 'none' }} />
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '15px' }}>{connected ? 'Connected' : 'Not Connected'}</p>
                {connectedAt && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>Since {formatDate(connectedAt)}</p>}
              </div>
            </div>
            {connected ? <Wifi size={22} color="#28a745" /> : <WifiOff size={22} color="#dc3545" />}
          </div>

          {connected && expiresAt && (
            <div style={{ background: '#f0f2f7', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' }}>TOKEN EXPIRES</p>
              <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#1a1a2e', fontWeight: '700' }}>{formatDate(expiresAt)}</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>Tokens refresh automatically before expiry</p>
            </div>
          )}

          <a href="/api/fitbark/connect" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: connected ? '#f0f2f7' : 'linear-gradient(135deg, #f88124, #f9a04e)', color: connected ? '#555' : 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' as const }}>
            <RefreshCw size={16} />
            {connected ? 'Reconnect FitBark Account' : 'Connect FitBark Account'}
          </a>
        </div>

        {/* Devices */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>Your Devices</h3>

          {loading ? (
            <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>
          ) : devices.length === 0 ? (
            <div style={{ background: '#f0f2f7', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>No devices found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {devices.map(device => (
                <div key={device.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fc', borderRadius: '10px', padding: '12px 16px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{device.device_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{device.fitbark_slug || 'No slug set'}</p>
                  </div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: device.fitbark_slug ? '#28a745' : '#ffc107' }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#eef2fb', borderRadius: '10px', border: '1px solid #c8d4f0' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#2c5a9e', fontWeight: '700' }}>HOW TO FIND YOUR DEVICE SLUG</p>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
              After connecting above, your FitBark dog profile URL contains the slug (e.g. fitbark.com/dogs/<strong>your-slug-here</strong>). Add it to the <code>devices</code> table in Supabase under <code>fitbark_slug</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}