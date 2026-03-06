'use client'
import { useState, useEffect } from 'react'

export default function BookingConfirmed() {
  const [pendingId, setPendingId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPendingId(params.get('pending') || '')
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: '#003087', margin: '0 0 12px 0', fontSize: '28px' }}>Booking Confirmed!</h2>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
          Your payment was successful and your session has been booked. We'll see you and your pup soon!
        </p>
        <a href="/dashboard" style={{ display: 'block', backgroundColor: '#FF6B35', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>
          View My Dashboard →
        </a>
        <a href="/book" style={{ display: 'block', backgroundColor: '#f0f0f0', color: '#333', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          Book Another Session
        </a>
      </div>
    </div>
  )
}