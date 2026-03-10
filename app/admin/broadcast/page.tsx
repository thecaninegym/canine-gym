'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { ArrowLeft, Bell, Users, CreditCard, Send, CheckCircle, AlertCircle, Eye, X } from 'lucide-react'

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e8f0', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }
const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '700' as const, color: '#555', fontSize: '13px' }

export default function AdminBroadcast() {
  const [audience, setAudience] = useState<'all' | 'members'>('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<any[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, total: 0 })

  useEffect(() => {
    fetchRecipients()
  }, [audience])

  const fetchRecipients = async () => {
    setLoadingRecipients(true)
    if (audience === 'all') {
      const { data } = await supabase.from('owners').select('id, name, email').order('name')
      setRecipients(data || [])
    } else {
      const { data: memberships } = await supabase
        .from('memberships')
        .select('owner_id, owners(id, name, email)')
        .eq('status', 'active')
      const seen = new Set()
      const unique: any[] = []
      ;(memberships || []).forEach((m: any) => {
        if (m.owners && !seen.has(m.owners.id)) {
          seen.add(m.owners.id)
          unique.push(m.owners)
        }
      })
      setRecipients(unique.sort((a, b) => a.name.localeCompare(b.name)))
    }
    setLoadingRecipients(false)
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message.')
      return
    }
    if (recipients.length === 0) {
      setError('No recipients found.')
      return
    }
    if (!confirm(`Send this email to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}? This cannot be undone.`)) return

    setSending(true)
    setError(null)
    setProgress({ sent: 0, total: recipients.length })

    let successCount = 0
    for (let i = 0; i < recipients.length; i++) {
      const owner = recipients[i]
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'broadcast',
            to: owner.email,
            data: { ownerName: owner.name.split(' ')[0], subject, message }
          })
        })
        successCount++
      } catch (e) {
        // continue on individual failure
      }
      setProgress({ sent: i + 1, total: recipients.length })
      // Small delay to avoid rate limiting
      if (i < recipients.length - 1) await new Promise(r => setTimeout(r, 700))
    }

    setSending(false)
    setSent(true)
    setProgress({ sent: successCount, total: recipients.length })
  }

  const audienceOptions = [
    { key: 'all', label: 'All Clients', desc: 'Everyone with an account', icon: <Users size={18} color="#2c5a9e" /> },
    { key: 'members', label: 'Active Members Only', desc: 'Current subscription holders', icon: <CreditCard size={18} color="#f88124" /> },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f7', fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        textarea:focus, input:focus { border-color: #2c5a9e !important; box-shadow: 0 0 0 3px rgba(44,90,158,0.08); }
        * { box-sizing: border-box; }
      `}</style>

      <nav style={{ background: 'white', padding: '0 24px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,24,64,0.08)', borderBottom: '3px solid #f88124' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="The Canine Gym" style={{ height: '56px', width: 'auto' }} />
          <span style={{ color: '#888', fontWeight: '600', fontSize: '14px' }}>· Admin</span>
        </div>
        <a href="/admin" style={{ color: '#001840', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,24,64,0.04)' }}>
          <ArrowLeft size={15} /> Dashboard
        </a>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '760px', margin: '0 auto', animation: 'fadeUp 0.35s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #001840, #2c5a9e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: '0 0 3px', fontSize: '22px', fontWeight: '800' }}>Broadcast Email</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Send a message to all clients or active members</p>
          </div>
        </div>

        {sent ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '52px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #b8dfc4' }}>
            <div style={{ width: '72px', height: '72px', background: '#d4edda', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="#155724" />
            </div>
            <h3 style={{ color: '#1a1a2e', margin: '0 0 8px', fontWeight: '800', fontSize: '20px' }}>Broadcast Sent!</h3>
            <p style={{ color: '#888', margin: '0 0 8px', fontSize: '15px' }}>
              Successfully sent to <strong style={{ color: '#155724' }}>{progress.sent}</strong> of {progress.total} recipients.
            </p>
            <p style={{ color: '#aaa', margin: '0 0 28px', fontSize: '13px' }}>Subject: "{subject}"</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setSent(false); setSubject(''); setMessage(''); setProgress({ sent: 0, total: 0 }) }}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Send Another
              </button>
              <a href="/admin" style={{ padding: '12px 24px', background: '#f0f2f7', color: '#555', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Back to Dashboard
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Audience Selector */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
              <label style={{ ...labelStyle, marginBottom: '14px', fontSize: '14px', color: '#1a1a2e' }}>Who are you sending to?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {audienceOptions.map(opt => (
                  <button key={opt.key} onClick={() => setAudience(opt.key as any)}
                    style={{ padding: '16px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', borderColor: audience === opt.key ? '#2c5a9e' : '#e5e8f0', background: audience === opt.key ? '#eef2fb' : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      {opt.icon}
                      <span style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '14px' }}>{opt.label}</span>
                    </div>
                    <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Recipient count */}
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fc', padding: '12px 16px', borderRadius: '10px' }}>
                {loadingRecipients ? (
                  <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Loading recipients…</p>
                ) : (
                  <>
                    <div style={{ width: '28px', height: '28px', background: audience === 'members' ? '#fff0ea' : '#eef2fb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {audience === 'members' ? <CreditCard size={14} color="#f88124" /> : <Users size={14} color="#2c5a9e" />}
                    </div>
                    <p style={{ margin: 0, color: '#555', fontSize: '13px', fontWeight: '700' }}>
                      <span style={{ color: '#1a1a2e', fontSize: '15px' }}>{recipients.length}</span> recipient{recipients.length !== 1 ? 's' : ''}
                      <span style={{ color: '#aaa', fontWeight: '400' }}> — {recipients.slice(0, 3).map(r => r.name.split(' ')[0]).join(', ')}{recipients.length > 3 ? ` +${recipients.length - 3} more` : ''}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Compose */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #eef0f5' }}>
              <h3 style={{ color: '#1a1a2e', margin: '0 0 20px', fontWeight: '800', fontSize: '15px' }}>Compose Message</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important update from The Canine Gym"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>Message Body</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your message here. You can use line breaks for paragraphs. Each email will start with 'Hi [First Name],' automatically."
                  rows={10}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
                />
              </div>

              <p style={{ margin: '0 0 20px', color: '#aaa', fontSize: '12px' }}>
                💡 Each email will open with "Hi [First Name]," using the client's actual first name.
              </p>

              {error && (
                <div style={{ background: '#ffeaea', color: '#dc3545', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              {/* Sending progress */}
              {sending && (
                <div style={{ background: '#eef2fb', border: '1.5px solid #c8d4f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: '#2c5a9e', fontSize: '13px' }}>Sending emails…</span>
                    <span style={{ color: '#888', fontSize: '13px' }}>{progress.sent} / {progress.total}</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(44,90,158,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(135deg, #2c5a9e, #2c5a9e)', width: `${(progress.sent / progress.total) * 100}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ margin: '8px 0 0', color: '#888', fontSize: '12px' }}>Please don't close this tab until complete.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowPreview(true)} disabled={!subject || !message}
                  style={{ padding: '12px 20px', background: '#f0f2f7', color: '#555', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', opacity: !subject || !message ? 0.5 : 1 }}>
                  <Eye size={15} /> Preview
                </button>
                <button onClick={handleSend} disabled={sending || loadingRecipients || !subject || !message || recipients.length === 0}
                  style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #f88124, #f9a04e)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(255,107,53,0.35)', opacity: sending || loadingRecipients || !subject || !message || recipients.length === 0 ? 0.6 : 1 }}>
                  <Send size={16} />
                  {sending ? `Sending… (${progress.sent}/${progress.total})` : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div onClick={() => setShowPreview(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white' }}>
              <div>
                <h3 style={{ margin: '0 0 3px', fontWeight: '800', fontSize: '16px', color: '#1a1a2e' }}>Email Preview</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>This is how it will look to recipients</p>
              </div>
              <button onClick={() => setShowPreview(false)}
                style={{ background: '#f0f2f7', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} color="#666" />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Mini email render */}
              <div style={{ border: '1.5px solid #e5e8f0', borderRadius: '12px', overflow: 'hidden', fontSize: '13px' }}>
                <div style={{ background: '#f8f9fc', padding: '12px 16px', borderBottom: '1px solid #e5e8f0' }}>
                  <p style={{ margin: '0 0 4px', color: '#888', fontSize: '12px' }}>From: <strong>The Canine Gym &lt;info@thecaninegym.com&gt;</strong></p>
                  <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>Subject: <strong style={{ color: '#1a1a2e' }}>{subject}</strong></p>
                </div>
                <div style={{ padding: '20px', background: 'white' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '3px solid #f88124' }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#001840', fontSize: '14px' }}>🐾 The Canine Gym</p>
                  </div>
                  <p style={{ margin: '0 0 12px', color: '#555', lineHeight: 1.7 }}><strong>Hi [First Name],</strong></p>
                  {message.split('\n').filter(l => l.trim()).map((line, i) => (
                    <p key={i} style={{ margin: '0 0 12px', color: '#555', lineHeight: 1.7 }}>{line}</p>
                  ))}
                  <p style={{ margin: '16px 0 0', color: '#888', fontSize: '12px', borderTop: '1px solid #f0f2f7', paddingTop: '12px' }}>
                    — The Canine Gym Team · Hamilton County, IN
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
