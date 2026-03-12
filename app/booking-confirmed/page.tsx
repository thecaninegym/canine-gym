'use client'
import { useEffect } from 'react'
import { CheckCircle, PawPrint, Calendar } from 'lucide-react'
import { trackEvent } from '../../components/Analytics'

export default function BookingConfirmed() {
  useEffect(() => {
    trackEvent('session_booked')
  }, [])
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2c5a9e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <CheckCircle size={64} color="#28a745" />
        </div>
        <h2 style={{ color: '#2c5a9e', margin: '0 0 12px 0', fontSize: '28px' }}>Booking Confirmed!</h2>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
          Your payment was successful and your session has been booked. We'll see you and your pup soon!
        </p>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#f88124', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>
          <PawPrint size={18} /> View My Dashboard
        </a>
        <a href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#f0f0f0', color: '#333', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          <Calendar size={18} /> Book Another Session
        </a>
      </div>
    </div>
  )
}