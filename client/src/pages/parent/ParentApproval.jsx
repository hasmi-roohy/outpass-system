import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOutpassByTokenApi, parentRespondApi, verifyParentFaceApi } from '../../api/api'

export default function ParentApproval() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)

  const [outpass,      setOutpass]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [message,      setMessage]      = useState('')
  const [acting,       setActing]       = useState(false)
  const [reason,       setReason]       = useState('')
  const [responded,    setResponded]    = useState(false)
  const [streaming,    setStreaming]    = useState(false)
  const [faceResult,   setFaceResult]   = useState(null)
  const [scanning,     setScanning]     = useState(false)
  const [faceVerified, setFaceVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [step,         setStep]         = useState('details')

  useEffect(() => {
    if (token) fetchOutpass()
    // The request should only rerun when the approval-link token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Add viewport meta for mobile
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name    = 'viewport'
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

  const startCamera = async () => {
    try {
      // ← facingMode: 'user' uses front camera on mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode:  'user',
          width:       { ideal: 640 },
          height:      { ideal: 480 }
        }
      })
      videoRef.current.srcObject = stream
      videoRef.current.play()
      setStreaming(true)
    } catch {
      alert('Camera access denied. Please allow camera access in your browser settings.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(track => track.stop())
    setStreaming(false)
  }

  const handleFaceScan = async () => {
    setScanning(true)
    setFaceResult(null)

    try {
      const canvas  = canvasRef.current
      const video   = videoRef.current
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      const image = canvas.toDataURL('image/jpeg')

      const res = await verifyParentFaceApi({ image, token })
      const result = res.data
      setFaceResult(result)

      if (result.matched && result.verificationToken) {
        setVerificationToken(result.verificationToken)
        setFaceVerified(true)
        stopCamera()
        setStep('respond')
      }

    } catch (err) {
      setFaceResult({
        matched: false,
        message: err.response?.data?.message || 'Face verification failed. Please try again.'
      })
    } finally {
      setScanning(false)
    }
  }

  const handleRespond = async (status) => {
    setActing(true)
    try {
      await parentRespondApi(token, {
        status,
        rejectionReason: reason,
        verificationToken
      })
      setResponded(true)
      setMessage(
        status === 'approved'
          ? '✅ You have approved the outpass request.'
          : '❌ You have rejected the outpass request. The warden will be notified.'
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond')
    } finally {
      setActing(false)
    }
  }

  // ── Loading ──
  if (loading) return (
    <div style={s.center}>
      <div style={s.loadingCard}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Loading request details...</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div style={s.center}>
      <div style={s.errorCard}>
        <div style={s.bigIcon}>⚠️</div>
        <h2 style={s.errorTitle}>Link Error</h2>
        <p style={s.errorMsg}>{error}</p>
      </div>
    </div>
  )

  // ── Responded ──
  if (responded) return (
    <div style={s.center}>
      <div style={s.successCard}>
        <div style={s.bigIcon}>
          {message.startsWith('✅') ? '✅' : '❌'}
        </div>
        <h2 style={s.successTitle}>Response Submitted</h2>
        <p style={s.successMsg}>{message}</p>
        <p style={s.closeTip}>You can close this page now.</p>
      </div>
    </div>
  )

  const student = outpass?.studentId

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerIcon}>🎓</div>
          <h1 style={s.title}>Outpass Request</h1>
          <p style={s.subtitle}>Your ward needs your approval</p>
        </div>

        {/* Step indicators */}
        <div style={s.steps}>
          {['Details', 'Verify', 'Respond'].map((label, i) => {
            const stepIdx = step === 'details' ? 0 : step === 'scan' ? 1 : 2
            return (
              <div key={i} style={s.stepItem}>
                <div style={{
                  ...s.stepDot,
                  background: i <= stepIdx ? '#4f46e5' : '#e0e0e0',
                  color:      i <= stepIdx ? '#fff'    : '#999'
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{
                  ...s.stepLabel,
                  color: i <= stepIdx ? '#4f46e5' : '#999',
                  fontWeight: i === stepIdx ? '600' : '400'
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Details ── */}
        {step === 'details' && (
          <div style={s.body}>

            <div style={s.infoCard}>
              <div style={s.infoCardTitle}>👤 Student</div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Name</span>
                <span style={s.infoVal}>{student?.name}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Roll No</span>
                <span style={s.infoVal}>{student?.rollNumber}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Department</span>
                <span style={s.infoVal}>{student?.department}</span>
              </div>
            </div>

            <div style={s.infoCard}>
              <div style={s.infoCardTitle}>📋 Request Details</div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Reason</span>
                <span style={s.infoVal}>{outpass?.reason}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Destination</span>
                <span style={s.infoVal}>{outpass?.destination}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>From</span>
                <span style={s.infoVal}>
                  {new Date(outpass?.fromDate).toDateString()}
                </span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>To</span>
                <span style={s.infoVal}>
                  {new Date(outpass?.toDate).toDateString()}
                </span>
              </div>
            </div>

            {outpass?.wardenNote && (
              <div style={s.wardenNote}>
                <span style={s.wardenNoteLabel}>📝 Warden Note</span>
                <p style={s.wardenNoteText}>{outpass.wardenNote}</p>
              </div>
            )}

            <button
              style={s.primaryBtn}
              onClick={() => { setStep('scan'); startCamera() }}
            >
              🎥 Verify Face to Continue
            </button>

            <p style={s.tip}>
              Your face will be matched against your registered photo
            </p>
          </div>
        )}

        {/* ── Step 2: Face Scan ── */}
        {step === 'scan' && (
          <div style={s.body}>
            <p style={s.scanInstructions}>
              📱 Hold your phone at eye level and look straight at the camera
            </p>

            {/* Camera box */}
            <div style={s.cameraBox}>
              <video
                ref={videoRef}
                style={s.video}
                muted
                playsInline      // ← required for iOS Safari
                autoPlay
              />
              {!streaming && (
                <div style={s.cameraPlaceholder}>
                  📷 Starting camera...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Face result feedback */}
            {faceResult && !faceResult.matched && (
              <div style={s.faceError}>
                <div style={s.faceErrorIcon}>❌</div>
                <div>
                  <strong>Face did not match</strong>
                  <p style={s.faceErrorSub}>
                    {faceResult.message || 'Please ensure good lighting and look directly at the camera'}
                  </p>
                  {faceResult.confidence > 0 && (
                    <p style={s.faceErrorSub}>
                      Confidence: {faceResult.confidence}%
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              style={{
                ...s.primaryBtn,
                background: scanning ? '#888' : '#4f46e5',
                cursor:     (scanning || !streaming) ? 'not-allowed' : 'pointer'
              }}
              onClick={handleFaceScan}
              disabled={scanning || !streaming}
            >
              {scanning ? '⏳ Scanning...' : '🔍 Scan My Face'}
            </button>

            <button
              style={s.ghostBtn}
              onClick={() => { stopCamera(); setStep('details') }}
            >
              ← Go Back
            </button>

            <p style={s.tip}>
              Make sure your face is well lit and clearly visible
            </p>
          </div>
        )}

        {/* ── Step 3: Respond ── */}
        {step === 'respond' && faceVerified && (
          <div style={s.body}>

            <div style={s.verifiedBadge}>
              <span style={s.verifiedIcon}>✅</span>
              <div>
                <div style={s.verifiedTitle}>Identity Verified</div>
                <div style={s.verifiedSub}>
                  Confidence: {faceResult?.confidence}%
                </div>
              </div>
            </div>

            <p style={s.respondPrompt}>
              Do you approve your ward's outpass request?
            </p>

            {/* Summary */}
            <div style={s.summaryBox}>
              <div style={s.summaryRow}>
                <span>📍</span>
                <span>{outpass?.destination}</span>
              </div>
              <div style={s.summaryRow}>
                <span>📅</span>
                <span>
                  {new Date(outpass?.fromDate).toDateString()} →{' '}
                  {new Date(outpass?.toDate).toDateString()}
                </span>
              </div>
            </div>

            <label style={s.reasonLabel}>
              Reason for rejection (fill only if rejecting)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder='Optional rejection reason...'
              style={s.textarea}
            />

            <button
              style={{
                ...s.approveBtn,
                opacity: acting ? 0.7 : 1,
                cursor:  acting ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleRespond('approved')}
              disabled={acting}
            >
              ✅ Approve Outpass
            </button>

            <button
              style={{
                ...s.rejectBtn,
                opacity: acting ? 0.7 : 1,
                cursor:  acting ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleRespond('rejected')}
              disabled={acting}
            >
              ❌ Reject Outpass
            </button>

            <p style={s.tip}>
              Once you respond, other guardians cannot respond
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────
// Mobile-first styles
// ─────────────────────────────────────
const s = {
  page:            { minHeight: '100vh', background: '#f0f2f5', padding: '16px', boxSizing: 'border-box' },
  center:          { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' },
  card:            { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: '480px', margin: '0 auto', overflow: 'hidden' },

  // Header
  header:          { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '28px 24px 20px', textAlign: 'center' },
  headerIcon:      { fontSize: '36px', marginBottom: '8px' },
  title:           { color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' },
  subtitle:        { color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 },

  // Step indicators
  steps:           { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' },
  stepItem:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  stepDot:         { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  stepLabel:       { fontSize: '11px' },

  // Body
  body:            { padding: '20px 20px 28px' },

  // Info cards
  infoCard:        { background: '#f8f9ff', borderRadius: '10px', padding: '14px', marginBottom: '12px' },
  infoCardTitle:   { fontSize: '13px', fontWeight: '600', color: '#4f46e5', marginBottom: '10px' },
  infoRow:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '5px 0', borderBottom: '1px solid #eee', gap: '12px' },
  infoKey:         { fontSize: '13px', color: '#888', flexShrink: 0 },
  infoVal:         { fontSize: '13px', color: '#333', fontWeight: '500', textAlign: 'right' },

  // Warden note
  wardenNote:      { background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '12px', marginBottom: '16px' },
  wardenNoteLabel: { fontSize: '12px', fontWeight: '600', color: '#f59e0b' },
  wardenNoteText:  { fontSize: '13px', color: '#555', margin: '4px 0 0' },

  // Camera
  scanInstructions:{ fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '14px', lineHeight: '1.5' },
  cameraBox:       { background: '#111', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  video:           { width: '100%', height: 'auto', display: 'block' },
  cameraPlaceholder:{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' },

  // Face error
  faceError:       { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  faceErrorIcon:   { fontSize: '20px', flexShrink: 0 },
  faceErrorSub:    { fontSize: '12px', color: '#721c24', margin: '4px 0 0' },

  // Verified badge
  verifiedBadge:   { background: '#f0fff4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' },
  verifiedIcon:    { fontSize: '28px' },
  verifiedTitle:   { fontSize: '15px', fontWeight: '600', color: '#166534' },
  verifiedSub:     { fontSize: '12px', color: '#166534', marginTop: '2px' },

  // Respond
  respondPrompt:   { fontSize: '15px', color: '#333', fontWeight: '500', marginBottom: '14px', textAlign: 'center' },
  summaryBox:      { background: '#f8f9ff', borderRadius: '10px', padding: '12px', marginBottom: '16px' },
  summaryRow:      { display: 'flex', gap: '10px', fontSize: '13px', color: '#555', padding: '4px 0' },
  reasonLabel:     { display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' },
  textarea:        { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '16px', fontFamily: 'inherit' },

  // Buttons
  primaryBtn:      { width: '100%', background: '#4f46e5', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px', display: 'block' },
  ghostBtn:        { width: '100%', background: 'transparent', color: '#666', border: '1px solid #ddd', padding: '14px', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', marginBottom: '10px', display: 'block' },
  approveBtn:      { width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', display: 'block' },
  rejectBtn:       { width: '100%', background: '#dc2626', color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', display: 'block' },
  tip:             { fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '8px' },

  // Loading
  loadingCard:     { textAlign: 'center', padding: '40px' },
  spinner:         { width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' },
  loadingText:     { color: '#888', fontSize: '15px' },

  // Error / Success
  errorCard:       { background: '#fff', borderRadius: '16px', padding: '40px 30px', textAlign: 'center', maxWidth: '360px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  bigIcon:         { fontSize: '48px', marginBottom: '12px' },
  errorTitle:      { fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px' },
  errorMsg:        { fontSize: '14px', color: '#888' },
  successCard:     { background: '#fff', borderRadius: '16px', padding: '40px 30px', textAlign: 'center', maxWidth: '360px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  successTitle:    { fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px' },
  successMsg:      { fontSize: '15px', color: '#555', marginBottom: '8px' },
  closeTip:        { fontSize: '13px', color: '#aaa' }
}
