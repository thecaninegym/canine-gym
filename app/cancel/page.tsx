'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Suspense } from 'react'
import { PawPrint, ArrowLeft, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react'

function CancelForm() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const [booking, setBooking] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasFee, setHasFee] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return
      const { data } = await supabase
        .from('bookings')
        .select('*, dogs(name, owner_id, owners(id, name, email, phone, sms_consent))')
        .eq('id', bookingId)
        .single()

      if (data) {
        setBooking(data)
        const bookingDateTime = new Date(data.booking_date + 'T' + String(data.slot_hour).padStart(2, '0') + ':00:00')
        const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
        setHasFee(hoursUntil < 48)

        // Check if this dog has its own active membership
        const { data: membership } = await supabase
          .from('memberships')
          .select('id')
          .eq('dog_id', data.dog_id)
          .eq('status', 'active')
          .single()
        setIsMember(!!membership)
      }
      setLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    setCancelling(true)
    setError(null)

    const dogIsSick = reason === 'dog_is_sick'

    // Send admin notification
    const h = booking.slot_hour
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    const timeStr = `${hour}:00 ${ampm} – ${hour}:30 ${ampm}`
    const dateStr = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    // Get the current session token to authenticate the API call
    const { data: { session } } = await supabase.auth.getSession()

    // Call refund API (handles cancellation + refund logic)
    const res = await fetch('/api/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ bookingId, reason, dogIsSick })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Something went wrong'); setCancelling(false); return }

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        to: 'dev@thecaninegym.com',
        data: {
          action: 'Booking Cancelled',
          dogName: booking.dogs?.name,
          ownerName: booking.dogs?.owners?.name,
          date: dateStr,
          time: timeStr,
          reason,
          refundStatus: data.refundStatus,
          refundAmount: data.refundAmount ? `$${(data.refundAmount / 100).toFixed(2)}` : 'N/A'
        }
      })
    })

    // Build refund note for client messages
    let refundNote = ''
    if (data.refundStatus === 'full_refund') refundNote = 'A full refund has been issued and will appear on your original payment method within 5-10 business days.'
    else if (data.refundStatus === 'partial_refund') refundNote = `A 50% refund of $${(data.refundAmount / 100).toFixed(2)} has been issued and will appear within 5-10 business days.`
    else if (data.refundStatus === 'no_refund_sick') refundNote = 'No charge has been applied since your dog was sick. We hope they feel better soon!'
    else if (data.refundStatus === 'forfeited') refundNote = 'Because this was cancelled with less than 48 hours notice, this session has been forfeited from your membership.'

    // Send client cancellation confirmation email
    const ownerEmail = booking.dogs?.owners?.email
    const ownerPhone = booking.dogs?.owners?.phone
    const ownerSmsConsent = booking.dogs?.owners?.sms_consent
    const ownerName = booking.dogs?.owners?.name
    const dogName = booking.dogs?.name

    if (ownerEmail) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_cancelled',
          to: ownerEmail,
          data: { ownerName, dogName, date: dateStr, time: timeStr, refundNote }
        })
      })
    }

    // Send client cancellation SMS if consented
    if (ownerPhone && ownerSmsConsent) {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_cancelled',
          to: ownerPhone,
          data: { ownerName, dogName, date: dateStr, time: timeStr, refundNote }
        })
      })
    }

    setResult(data)
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

  const getResultMessage = () => {
    if (!result) return null
    switch (result.refundStatus) {
      case 'full_refund':
        return { color: '#d4edda', textColor: '#155724', icon: <CheckCircle size={20} color="#155724" />, title: 'Full Refund Issued', message: `$${(result.refundAmount / 100).toFixed(2)} will be returned to your original payment method within 5-10 business days.` }
      case 'partial_refund':
        return { color: '#fff3cd', textColor: '#856404', icon: <DollarSign size={20} color="#856404" />, title: '50% Refund Issued', message: `$${(result.refundAmount / 100).toFixed(2)} will be returned to your original payment method within 5-10 business days. The remaining 50% is kept due to the late cancellation.` }
      case 'session_restored':
        return { color: '#d4edda', textColor: '#155724', icon: <CheckCircle size={20} color="#155724" />, title: 'Session Credited Back', message: 'Your session has been credited back to your membership.' }
      case 'session_forfeited':
        return { color: '#fff3cd', textColor: '#856404', icon: <AlertTriangle size={20} color="#856404" />, title: 'Session Forfeited', message: 'Because this was cancelled with less than 48 hours notice, this session has been forfeited from your membership.' }
      case 'none':
        return { color: '#d4edda', textColor: '#155724', icon: <CheckCircle size={20} color="#155724" />, title: 'Session Cancelled', message: 'Your session has been cancelled.' }
      default:
        return { color: '#d4edda', textColor: '#155724', icon: <CheckCircle size={20} color="#155724" />, title: 'Session Cancelled', message: 'Your session has been cancelled.' }
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f7' }}>
      <p style={{ color: '#001840' }}>Loading...</p>
    </div>
  )

  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f7' }}>
      <p style={{ color: '#666' }}>Booking not found.</p>
    </div>
  )

  const resultMessage = getResultMessage()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <img src="/logo.png" alt="The Canine Gym" style={{ height: 'clamp(36px, 7vw, 56px)', width: 'auto' }} />
        <a href="/dashboard" style={{ color: '#001840', textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <XCircle size={28} color="#dc3545" />
          <h2 style={{ color: '#001840', margin: 0, fontSize: '22px', fontWeight: '800' }}>Cancel Session</h2>
        </div>

        {result ? (
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CheckCircle size={52} color="#2c5a9e" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#001840', marginBottom: '16px', fontWeight: '800' }}>Session Cancelled</h3>
            {resultMessage && (
              <div style={{ backgroundColor: resultMessage.color, padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left' }}>
                {resultMessage.icon}
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: resultMessage.textColor }}>{resultMessage.title}</p>
                  <p style={{ margin: 0, color: resultMessage.textColor, fontSize: '14px' }}>{resultMessage.message}</p>
                </div>
              </div>
            )}
            <a href="/dashboard" style={{ backgroundColor: '#f88124', color: 'white', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', display: 'inline-block' }}>Back to Dashboard</a>
          </div>
        ) : (
          <>
            <div style={{ background: 'linear-gradient(135deg, #001840 0%, #2c5a9e 100%)', color: 'white', padding: '20px 24px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 20px rgba(0,48,135,0.2)' }}>
              <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PawPrint size={22} color="white" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: '800', fontSize: '18px' }}>{booking.dogs?.name}</p>
                <p style={{ margin: 0, opacity: 0.75, fontSize: '14px' }}>{formatBookingTime()}</p>
              </div>
            </div>

            {hasFee && (
              <div style={{ backgroundColor: '#fff8e6', border: '1.5px solid #ffc107', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle size={20} color="#856404" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#856404', fontWeight: '700' }}>Late Cancellation Warning</p>
                  {isMember
                    ? <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>This session is less than 48 hours away. As a membership client, this session will be forfeited — no fee charged.</p>
                    : <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>This session is less than 48 hours away. You will receive a 50% refund. Select "My dog is sick" below to receive a full refund.</p>
                  }
                </div>
              </div>
            )}

            <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <form onSubmit={handleCancel}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#001840', fontSize: '14px' }}>Reason for cancellation</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} required
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', color: '#001840', fontFamily: 'inherit', background: 'white' }}>
                    <option value="">Select a reason...</option>
                    <option value="scheduling_conflict">Scheduling conflict</option>
                    <option value="dog_is_sick">My dog is sick</option>
                    <option value="family_emergency">Family emergency</option>
                    <option value="weather">Weather concerns</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {reason === 'dog_is_sick' && (
                  <div style={{ backgroundColor: '#d4edda', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} color="#155724" />
                    <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>
                      {isMember ? 'Your session will be credited back to your membership. We hope your pup feels better!' : 'You will receive a full refund. We hope your pup feels better soon!'}
                    </p>
                  </div>
                )}

                {error && <p style={{ color: '#dc3545', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>{error}</p>}

                <button type="submit" disabled={cancelling}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                  <XCircle size={18} /> {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>

                <a href="/dashboard" style={{ display: 'block', textAlign: 'center', marginTop: '14px', color: '#888', fontSize: '14px', textDecoration: 'none' }}>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f7' }}><p style={{ color: '#001840' }}>Loading...</p></div>}>
      <CancelForm />
    </Suspense>
  )
}
