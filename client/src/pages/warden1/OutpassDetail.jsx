import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import {
  forwardToParentsApi,
  rejectOutpassApi,
  callApproveApi,
  cancelOutpassApi
} from '../../api/api'

const BASE_URL = 'http://localhost:5000/api'

export default function OutpassDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [outpass,   setOutpass]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState(false)
  const [note,      setNote]      = useState('')
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => { fetchOutpass() }, [])

  const fetchOutpass = async () => {
    try {
      const res = await fetch(`${BASE_URL}/outpass/${id}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
        }
      })
      const data = await res.json()
      setOutpass(data)
    } catch (err) {
      setError('Failed to load outpass details')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    setActing(true)
    setError('')
    setSuccess('')

    try {
      if (action === 'forward') {
        await forwardToParentsApi(id, { wardenNote: note })
        setSuccess('✅ Outpass forwarded to parents successfully!')
      } else if (action === 'reject') {
        await rejectOutpassApi(id, { wardenNote: note })
        setSuccess('Outpass rejected.')
      } else if (action === 'callApprove') {
        await callApproveApi(id, { wardenNote: note })
        setSuccess('✅ Outpass approved via call!')
      } else if (action === 'cancel') {
        await cancelOutpassApi(id, { wardenNote: note })
        setSuccess('Outpass cancelled.')
      }

      setConfirmAction(null)
      await fetchOutpass()

    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.')
    } finally {
      setActing(false)
    }
  }

  if (loading) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.loadingBox}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Loading outpass details...</p>
      </div>
    </div>
  )

  if (!outpass) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.errorBox}>
        <p>⚠️ Outpass not found</p>
        <button style={s.backBtn} onClick={() => navigate('/warden1')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )

  const student       = outpass.studentId
  const parentTokens  = outpass.parentTokens || []
  const noResponse    = outpass.parentNoResponse?.alerted
  const canForward    = outpass.status === 'pending'
  const canReject     = outpass.status === 'pending'
  const canCallApprove= outpass.status === 'warden_forwarded'
  const canCancel     = ['warden_forwarded', 'approved'].includes(outpass.status)

  const respondedParent = parentTokens.find(
    p => p.status === 'approved' || p.status === 'rejected'
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Back */}
        <button style={s.backBtn} onClick={() => navigate('/warden1')}>
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Outpass Request</h1>
            <p style={s.pageSub}>Review and take action on this request</p>
          </div>
          <StatusBadge status={outpass.status} />
        </div>

        {error   && <div style={s.errorAlert}> ⚠️ {error}</div>}
        {success && <div style={s.successAlert}>✅ {success}</div>}

        {/* No response alert */}
        {noResponse && (
          <div style={s.noResponseAlert}>
            <span style={s.alertIcon}>🚨</span>
            <div>
              <strong style={s.alertTitle}>No parent response received!</strong>
              <p style={s.alertSub}>
                Parents were contacted over 1 hour ago and have not responded.
                Please call them directly using the numbers below.
              </p>
            </div>
          </div>
        )}

        <div style={s.grid}>

          {/* Left column */}
          <div style={s.leftCol}>

            {/* Student info */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>👤 Student Details</h3>
              <div style={s.studentTop}>
                <div style={s.avatar}>
                  {student?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={s.studentName}>{student?.name}</h3>
                  <p style={s.studentMeta}>{student?.rollNumber}</p>
                  <p style={s.studentMeta}>{student?.department}</p>
                </div>
              </div>
              <div style={s.infoList}>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Phone</span>
                  <span style={s.infoVal}>📞 {student?.phone}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Email</span>
                  <span style={s.infoVal}>{student?.email}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Hostel Block</span>
                  <span style={s.infoVal}>{student?.hostelBlock || '—'}</span>
                </div>
              </div>
            </div>

            {/* Outpass details */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>📋 Request Details</h3>
              <div style={s.infoList}>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Reason</span>
                  <span style={s.infoVal}>{outpass.reason}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Destination</span>
                  <span style={s.infoVal}>📍 {outpass.destination}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>From Date</span>
                  <span style={s.infoVal}>{new Date(outpass.fromDate).toDateString()}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>To Date</span>
                  <span style={s.infoVal}>{new Date(outpass.toDate).toDateString()}</span>
                </div>
                {outpass.fromTime && (
                  <div style={s.infoRow}>
                    <span style={s.infoKey}>From Time</span>
                    <span style={s.infoVal}>{outpass.fromTime}</span>
                  </div>
                )}
                {outpass.toTime && (
                  <div style={s.infoRow}>
                    <span style={s.infoKey}>To Time</span>
                    <span style={s.infoVal}>{outpass.toTime}</span>
                  </div>
                )}
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Applied At</span>
                  <span style={s.infoVal}>
                    {new Date(outpass.requestedAt).toLocaleString()}
                  </span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoKey}>Expires At</span>
                  <span style={{
                    ...s.infoVal,
                    color: new Date() > new Date(outpass.expiresAt) ? '#dc2626' : '#16a34a',
                    fontWeight: '600'
                  }}>
                    {new Date(outpass.expiresAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Warden note input */}
            {(canForward || canReject || canCallApprove || canCancel) && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>📝 Add Note</h3>
                <p style={s.cardSub}>
                  Optional note to parents or student
                </p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder='Add a note (optional)...'
                  style={s.textarea}
                />
              </div>
            )}

          </div>

          {/* Right column */}
          <div style={s.rightCol}>

            {/* Actions */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>⚡ Actions</h3>

              {canForward && (
                <button
                  style={s.forwardBtn}
                  onClick={() => setConfirmAction('forward')}
                  disabled={acting}
                >
                  📧 Forward to Parents
                </button>
              )}

              {canReject && (
                <button
                  style={s.rejectBtn}
                  onClick={() => setConfirmAction('reject')}
                  disabled={acting}
                >
                  ❌ Reject Request
                </button>
              )}

              {canCallApprove && (
                <button
                  style={s.callApproveBtn}
                  onClick={() => setConfirmAction('callApprove')}
                  disabled={acting}
                >
                  📞 Call Approve
                </button>
              )}

              {canCancel && (
                <button
                  style={s.cancelBtn}
                  onClick={() => setConfirmAction('cancel')}
                  disabled={acting}
                >
                  🚫 Cancel Outpass
                </button>
              )}

              {!canForward && !canReject && !canCallApprove && !canCancel && (
                <div style={s.noActions}>
                  <p style={s.noActionsText}>No actions available for this outpass</p>
                </div>
              )}
            </div>

            {/* Parent responses */}
            {parentTokens.length > 0 && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>👨‍👩‍👧 Parent Responses</h3>
                <div style={s.parentList}>
                  {parentTokens.map((parent, i) => (
                    <div key={i} style={{
                      ...s.parentItem,
                      background: parent.status === 'approved' ? '#f0fff4'
                        : parent.status === 'rejected' ? '#fff0f0'
                        : '#f8f9ff'
                    }}>
                      <div style={s.parentTop}>
                        <div>
                          <span style={s.parentName}>{parent.name}</span>
                          <span style={s.parentRelation}> ({parent.relation})</span>
                        </div>
                        <span style={{
                          ...s.parentStatus,
                          background: parent.status === 'approved' ? '#d1fae5'
                            : parent.status === 'rejected' ? '#fee2e2'
                            : parent.status === 'deactivated' ? '#f3f4f6'
                            : '#fff8e1',
                          color: parent.status === 'approved' ? '#16a34a'
                            : parent.status === 'rejected' ? '#dc2626'
                            : parent.status === 'deactivated' ? '#9ca3af'
                            : '#f59e0b'
                        }}>
                          {parent.status}
                        </span>
                      </div>

                      {/* Show phone if rejected or no response */}
                      {(parent.status === 'rejected' || noResponse) && (
                        <p style={s.parentPhone}>
                          📞 <a href={`tel:${parent.phone}`} style={s.phoneLink}>
                            {parent.phone}
                          </a>
                        </p>
                      )}

                      {parent.rejectionReason && (
                        <p style={s.rejectionReason}>
                          Reason: {parent.rejectionReason}
                        </p>
                      )}

                      {parent.respondedAt && (
                        <p style={s.respondedAt}>
                          Responded: {new Date(parent.respondedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gate scan info */}
            {(outpass.exitScan?.time || outpass.returnScan?.time) && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>🚪 Gate Scans</h3>
                {outpass.exitScan?.time && (
                  <div style={s.scanItem}>
                    <div style={s.scanHeader}>
                      <span style={s.scanLabel}>Exit Scan</span>
                      <span style={{
                        ...s.scanBadge,
                        background: outpass.exitScan.matched ? '#d1fae5' : '#fee2e2',
                        color:      outpass.exitScan.matched ? '#16a34a' : '#dc2626'
                      }}>
                        {outpass.exitScan.matched ? '✅ Matched' : '❌ No Match'}
                      </span>
                    </div>
                    <p style={s.scanTime}>
                      {new Date(outpass.exitScan.time).toLocaleString()}
                    </p>
                    {outpass.exitScan.confidence && (
                      <p style={s.scanConfidence}>
                        Confidence: {outpass.exitScan.confidence}%
                      </p>
                    )}
                  </div>
                )}
                {outpass.returnScan?.time && (
                  <div style={{ ...s.scanItem, marginTop: '12px' }}>
                    <div style={s.scanHeader}>
                      <span style={s.scanLabel}>Return Scan</span>
                      <span style={{
                        ...s.scanBadge,
                        background: outpass.returnScan.matched ? '#d1fae5' : '#fee2e2',
                        color:      outpass.returnScan.matched ? '#16a34a' : '#dc2626'
                      }}>
                        {outpass.returnScan.matched ? '✅ Matched' : '❌ No Match'}
                      </span>
                    </div>
                    <p style={s.scanTime}>
                      {new Date(outpass.returnScan.time).toLocaleString()}
                    </p>
                    {outpass.returnScan.confidence && (
                      <p style={s.scanConfidence}>
                        Confidence: {outpass.returnScan.confidence}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Confirm modal */}
        {confirmAction && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <h3 style={s.modalTitle}>
                {confirmAction === 'forward'     && '📧 Forward to Parents?'}
                {confirmAction === 'reject'      && '❌ Reject this Outpass?'}
                {confirmAction === 'callApprove' && '📞 Approve via Call?'}
                {confirmAction === 'cancel'      && '🚫 Cancel this Outpass?'}
              </h3>
              <p style={s.modalSub}>
                {confirmAction === 'forward'     && 'Emails will be sent to all 4 registered parents.'}
                {confirmAction === 'reject'      && 'This action cannot be undone.'}
                {confirmAction === 'callApprove' && 'You are confirming that you spoke to a parent and they approved.'}
                {confirmAction === 'cancel'      && 'The outpass will be cancelled immediately.'}
              </p>
              {note && (
                <div style={s.modalNote}>
                  <strong>Your note:</strong> {note}
                </div>
              )}
              <div style={s.modalActions}>
                <button
                  style={s.modalCancel}
                  onClick={() => setConfirmAction(null)}
                  disabled={acting}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...s.modalConfirm,
                    background: confirmAction === 'forward'     ? '#4f46e5'
                      : confirmAction === 'callApprove' ? '#16a34a'
                      : '#dc2626'
                  }}
                  onClick={() => handleAction(confirmAction)}
                  disabled={acting}
                >
                  {acting ? '⏳ Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page:             { background: '#f5f6fa', minHeight: '100vh' },
  container:        { maxWidth: '1000px', margin: '0 auto', padding: '24px 20px 60px' },

  backBtn:          { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '0 0 16px', display: 'block' },

  pageHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  pageTitle:        { fontSize: '22px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:          { fontSize: '14px', color: '#888', margin: 0 },

  errorAlert:       { background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' },
  successAlert:     { background: '#f0fff4', border: '1px solid #86efac', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' },

  noResponseAlert:  { background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' },
  alertIcon:        { fontSize: '28px', flexShrink: 0 },
  alertTitle:       { color: '#ea580c', fontSize: '14px', display: 'block', marginBottom: '4px' },
  alertSub:         { color: '#888', fontSize: '13px', margin: 0 },

  grid:             { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' },
  leftCol:          { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightCol:         { display: 'flex', flexDirection: 'column', gap: '16px' },

  card:             { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardTitle:        { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', marginBottom: '16px' },
  cardSub:          { fontSize: '13px', color: '#888', marginBottom: '12px', marginTop: '-8px' },

  studentTop:       { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
  avatar:           { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: '800', flexShrink: 0 },
  studentName:      { fontSize: '16px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 3px' },
  studentMeta:      { fontSize: '12px', color: '#888', margin: '0 0 2px' },

  infoList:         { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoRow:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f8f8f8' },
  infoKey:          { fontSize: '12px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 },
  infoVal:          { fontSize: '13px', color: '#333', fontWeight: '500', textAlign: 'right' },

  textarea:         { width: '100%', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', minHeight: '90px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },

  forwardBtn:       { width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', marginBottom: '10px' },
  rejectBtn:        { width: '100%', background: '#fff', color: '#dc2626', border: '2px solid #dc2626', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', marginBottom: '10px' },
  callApproveBtn:   { width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', marginBottom: '10px' },
  cancelBtn:        { width: '100%', background: '#fff', color: '#888', border: '1.5px solid #e0e0e0', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  noActions:        { textAlign: 'center', padding: '20px 0' },
  noActionsText:    { color: '#aaa', fontSize: '14px' },

  parentList:       { display: 'flex', flexDirection: 'column', gap: '10px' },
  parentItem:       { borderRadius: '10px', padding: '12px 14px' },
  parentTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  parentName:       { fontSize: '14px', fontWeight: '600', color: '#333' },
  parentRelation:   { fontSize: '12px', color: '#888' },
  parentStatus:     { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize' },
  parentPhone:      { fontSize: '13px', color: '#555', margin: '4px 0' },
  phoneLink:        { color: '#4f46e5', fontWeight: '600', textDecoration: 'none' },
  rejectionReason:  { fontSize: '12px', color: '#dc2626', margin: '4px 0' },
  respondedAt:      { fontSize: '11px', color: '#aaa', margin: '4px 0 0' },

  scanItem:         { background: '#f8f9ff', borderRadius: '10px', padding: '12px 14px' },
  scanHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  scanLabel:        { fontSize: '13px', fontWeight: '700', color: '#333' },
  scanBadge:        { fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' },
  scanTime:         { fontSize: '12px', color: '#888', margin: '0 0 2px' },
  scanConfidence:   { fontSize: '12px', color: '#4f46e5', fontWeight: '600', margin: 0 },

  loadingBox:       { textAlign: 'center', padding: '80px 20px' },
  spinner:          { width: '40px', height: '40px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:      { color: '#888', fontSize: '14px' },
  errorBox:         { textAlign: 'center', padding: '80px 20px' },

  modalOverlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal:            { background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:       { fontSize: '18px', fontWeight: '800', color: '#1e1e2e', marginBottom: '8px' },
  modalSub:         { fontSize: '14px', color: '#888', marginBottom: '16px' },
  modalNote:        { background: '#f8f9ff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#555', marginBottom: '20px' },
  modalActions:     { display: 'flex', gap: '12px' },
  modalCancel:      { flex: 1, background: '#f5f5f5', color: '#666', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  modalConfirm:     { flex: 1, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }
}