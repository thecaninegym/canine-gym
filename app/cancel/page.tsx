'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Suspense } from 'react'
import { PawPrint, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

function CancelForm() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const [booking, setBooking] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [dogIsSick, setDogIsSick] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFee, setHasFee] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return
      const { data } = await supabase.from('bookings').select('*, dogs(name, owners(name, email))').eq('id', bookingId).single()
      if (data) {
        setBooking(data)
        const bookingDateTime = new Date(data.booking_date + 'T' + String(data.slot_hour).padStart(2, '0') + ':00:00')
        setHasFee((bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60) < 48)
      }
      setLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    setCancelling(true)
    setError(null)
    const feeApplies = hasFee && !dogIsSick
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason, dog_is_sick: dogIsSick, cancellation_fee: feeApplies }).eq('id', bookingId)
    if (error) { setError(error.message); setCancelling(false); return }
    const h = booking.slot_hour
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
    const dateStr = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin_notification', to: 'dev@thecaninegym.com', data: { action: 'Booking Cancelled', dogName: booking.dogs?.name, ownerName: booking.dogs?.owners?.name, date: dateStr, time: timeStr, reason, fee: feeApplies } })
    })
    setSuccess(true)
    setCancelling(false)
  }

  const formatBookingTime = () => {
    if (!booking) return ''
    const d = new Date(booking.booking_date + 'T12:00:00')
    const h = booking.slot_hour
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${hour}:00 ${ampm}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}>
      <p style={{ color: 'white' }}>Loading...</p>
    </div>
  )

  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
      <p style={{ color: '#666' }}>Booking not found.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <nav style={{ backgroundColor: '#003087', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint size={24} color="white" />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>The Canine Gym</h1>
        </div>
        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <XCircle size={28} color="#dc3545" />
          <h2 style={{ color: '#003087', margin: 0 }}>Cancel Session</h2>
        </div>

        {success ? (
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CheckCircle size={52} color="#003087" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#003087', marginBottom: '8px' }}>Session Cancelled</h3>
            {hasFee && !dogIsSick ? (
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#856404', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Cancellation Fee Applied
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#856404', fontSize: '14px' }}>Because this was cancelled with less than 48 hours notice, a cancellation fee will be charged. Our team will be in touch.</p>
              </div>
            ) : (
              <p style={{ color: '#666', marginBottom: '16px' }}>Your session has been cancelled with no fee.</p>
            )}
            <a href="/dashboard" style={{ backgroundColor: '#003087', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Back to Dashboard</a>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#003087', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PawPrint size={24} color="white" />
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '18px' }}>{booking.dogs?.name}</p>
                <p style={{ margin: 0, opacity: 0.8 }}>{formatBookingTime()}</p>
              </div>
            </div>

            {hasFee && (
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle size={20} color="#856404" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#856404', fontWeight: 'bold' }}>Late Cancellation Warning</p>
                  <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>This session is less than 48 hours away. A cancellation fee will apply unless your dog is sick.</p>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleCancel}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#333' }}>Reason for cancellation</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', color: '#000' }}>
                    <option value="">Select a reason...</option>
                    <option value="scheduling_conflict">Scheduling conflict</option>
                    <option value="dog_is_sick">My dog is sick</option>
                    <option value="family_emergency">Family emergency</option>
                    <option value="weather">Weather concerns</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {reason === 'dog_is_sick' && (
                  <div style={{ backgroundColor: '#d4edda', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} color="#155724" />
                    <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>No cancellation fee will be charged since your dog is sick. We hope they feel better soon!</p>
                  </div>
                )}

                {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

                <button type="submit" disabled={cancelling} onClick={() => setDogIsSick(reason === 'dog_is_sick')}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <XCircle size={18} /> {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>

                <a href="/dashboard" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#666', fontSize: '14px' }}>
                  Never mind, keep my session
                </a>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#003087' }}><p style={{ color: 'white' }}>Loading...</p></div>}>
      <CancelForm />
    </Suspense>
  )
}