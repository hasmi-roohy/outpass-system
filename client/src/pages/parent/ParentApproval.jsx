import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { getOutpassByTokenApi, parentRespondApi } from '../../api/api'

export default function ParentApproval() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const token = searchParams.get('token')
  const initialAction = location.pathname.includes('/reject') ? 'rejected' : 'approved'

  const [outpass, setOutpass] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [acting, setActing] = useState(false)
  const [reason, setReason] = useState('')
  const [selectedAction, setSelectedAction] = useState(initialAction)

  useEffect(() => {
    if (token) fetchOutpass()
    else {
      setError('Invalid approval link')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  const fetchOutpass = async () => {
    try {
      const res = await getOutpassByTokenApi(token)
      setOutpass(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link')
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (status) => {
    setActing(true)
    setError('')
    try {
      await parentRespondApi(token, {
        status,
        rejectionReason: status === 'rejected' ? reason : ''
      })
      setMessage(
        status === 'approved'
          ? 'You have approved the outpass request.'
          : 'You have declined the outpass request. The warden will be notified.'
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.stateCard}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error && !outpass) {
    return (
      <div style={s.center}>
        <div style={s.stateCard}>
          <h2 style={s.errorTitle}>Link Error</h2>
          <p style={s.muted}>{error}</p>
        </div>
      </div>
    )
  }

  if (message) {
    return (
      <div style={s.center}>
        <div style={s.stateCard}>
          <h2 style={s.successTitle}>Response Submitted</h2>
          <p style={s.message}>{message}</p>
          <p style={s.muted}>You can close this page now.</p>
        </div>
      </div>
    )
  }

  const student = outpass?.studentId

  return (
    <div style={s.page}>
      <div style={s.card}>
        <header style={s.header}>
          <div style={s.logo}>OMS</div>
          <h1 style={s.title}>Outpass Request</h1>
          <p style={s.subtitle}>Please review and respond.</p>
        </header>

        <main style={s.body}>
          {error && <div style={s.errorBox}>{error}</div>}

          <section style={s.infoCard}>
            <h2 style={s.sectionTitle}>Student</h2>
            <Info label='Name' value={student?.name} />
            <Info label='Roll No' value={student?.rollNumber} />
            <Info label='Department' value={student?.department} />
          </section>

          <section style={s.infoCard}>
            <h2 style={s.sectionTitle}>Request Details</h2>
            <Info label='Reason' value={outpass?.reason} />
            <Info label='Destination' value={outpass?.destination} />
            <Info label='From' value={new Date(outpass?.fromDate).toDateString()} />
            <Info label='To' value={new Date(outpass?.toDate).toDateString()} />
          </section>

          {outpass?.wardenNote && (
            <section style={s.noteBox}>
              <strong>Warden Note</strong>
              <p>{outpass.wardenNote}</p>
            </section>
          )}

          <div style={s.choiceRow}>
            <button
              style={{
                ...s.choiceBtn,
                ...(selectedAction === 'approved' ? s.approveChoiceActive : s.choiceInactive)
              }}
              onClick={() => setSelectedAction('approved')}
              type='button'
            >
              Approve
            </button>
            <button
              style={{
                ...s.choiceBtn,
                ...(selectedAction === 'rejected' ? s.rejectChoiceActive : s.choiceInactive)
              }}
              onClick={() => setSelectedAction('rejected')}
              type='button'
            >
              Decline
            </button>
          </div>

          {selectedAction === 'rejected' && (
            <label style={s.reasonField}>
              <span>Reason for decline</span>
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder='Optional reason...'
                style={s.textarea}
              />
            </label>
          )}

          <button
            style={{
              ...s.submitBtn,
              background: selectedAction === 'approved' ? '#16a34a' : '#dc2626',
              opacity: acting ? 0.7 : 1
            }}
            onClick={() => handleRespond(selectedAction)}
            disabled={acting}
          >
            {acting
              ? 'Submitting...'
              : selectedAction === 'approved'
              ? 'Submit Approval'
              : 'Submit Decline'}
          </button>

          <p style={s.tip}>Once you respond, other guardians cannot respond to this request.</p>
        </main>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoKey}>{label}</span>
      <span style={s.infoVal}>{value || '-'}</span>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f4f7fb', padding: '18px', boxSizing: 'border-box' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', background: '#f4f7fb' },
  card: { width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e3e8f0', boxShadow: '0 18px 48px rgba(15,23,42,0.10)' },
  header: { background: '#2563eb', padding: '26px 22px', textAlign: 'center', color: '#fff' },
  logo: { width: 44, height: 40, margin: '0 auto 12px', borderRadius: 8, background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12 },
  title: { margin: '0 0 6px', fontSize: 24, lineHeight: 1.15 },
  subtitle: { margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: 14 },
  body: { padding: '20px' },
  infoCard: { background: '#f8fafc', border: '1px solid #e3e8f0', borderRadius: 10, padding: 14, marginBottom: 12 },
  sectionTitle: { margin: '0 0 10px', color: '#2563eb', fontSize: 14, fontWeight: 900 },
  infoRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderTop: '1px solid #e3e8f0' },
  infoKey: { color: '#64748b', fontSize: 13, flexShrink: 0 },
  infoVal: { color: '#172033', fontSize: 13, fontWeight: 800, textAlign: 'right' },
  noteBox: { padding: 14, marginBottom: 14, borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13 },
  choiceRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' },
  choiceBtn: { minHeight: 48, borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 900 },
  choiceInactive: { background: '#fff', color: '#475569', border: '1px solid #cbd5e1' },
  approveChoiceActive: { background: '#ecfdf5', color: '#047857', border: '2px solid #16a34a' },
  rejectChoiceActive: { background: '#fef2f2', color: '#b91c1c', border: '2px solid #dc2626' },
  reasonField: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, color: '#334155', fontSize: 13, fontWeight: 800 },
  textarea: { width: '100%', minHeight: 86, padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', resize: 'vertical', font: 'inherit', boxSizing: 'border-box' },
  submitBtn: { width: '100%', minHeight: 50, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 900 },
  tip: { margin: '12px 0 0', color: '#64748b', textAlign: 'center', fontSize: 12 },
  errorBox: { marginBottom: 12, padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, fontWeight: 800 },
  stateCard: { width: '100%', maxWidth: 380, padding: 32, borderRadius: 12, background: '#fff', border: '1px solid #e3e8f0', boxShadow: '0 18px 48px rgba(15,23,42,0.10)', textAlign: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid #e3e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 14px', animation: 'ui-spin 0.8s linear infinite' },
  errorTitle: { margin: '0 0 8px', color: '#b91c1c', fontSize: 21 },
  successTitle: { margin: '0 0 8px', color: '#047857', fontSize: 21 },
  message: { color: '#334155', fontSize: 15 },
  muted: { color: '#64748b', fontSize: 14 }
}
