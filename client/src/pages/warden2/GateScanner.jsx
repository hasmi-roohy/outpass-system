import { useState, useRef } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import {
  verifyExitApi,
  verifyReturnApi,
  manualOverrideApi,
  getOutpassByRollNumberApi
} from '../../api/api'

export default function GateScanner() {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)

  const [rollNumber,  setRollNumber]  = useState('')
  const [outpass,     setOutpass]     = useState(null)
  const [student,     setStudent]     = useState(null)
  const [scanType,    setScanType]    = useState('exit')
  const [streaming,   setStreaming]   = useState(false)
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [searching,   setSearching]   = useState(false)
  const [note,        setNote]        = useState('')
  const [searchError, setSearchError] = useState('')
  const [overrideDone, setOverrideDone] = useState(false)

  const handleSearch = async () => {
    if (!rollNumber.trim()) return
    setSearching(true)
    setSearchError('')
    setOutpass(null)
    setStudent(null)
    setResult(null)
    setOverrideDone(false)
    setNote('')

    try {
      const res = await getOutpassByRollNumberApi(rollNumber)

      const fetchedOutpass = res.data.outpass
      const fetchedStudent = res.data.student

      setOutpass(fetchedOutpass)

      if (fetchedStudent && fetchedStudent.name) {
        setStudent(fetchedStudent)
      } else if (fetchedOutpass.studentId?.name) {
        setStudent(fetchedOutpass.studentId)
      }

      // Auto set correct scan type
      if (fetchedOutpass.status === 'approved') setScanType('exit')
      if (fetchedOutpass.status === 'out' || fetchedOutpass.status === 'late_return') {
        setScanType('return')
      }

    } catch (err) {
      setSearchError(err.response?.data?.message || 'Student or outpass not found')
    } finally {
      setSearching(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      videoRef.current.play()
      setStreaming(true)
    } catch {
      alert('Camera access denied.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(track => track.stop())
    setStreaming(false)
  }

  const captureImage = () => {
    const canvas  = canvasRef.current
    const video   = videoRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg')
  }

  const updateScannedOutpass = ({ matched, confidence }) => {
    const scanKey = scanType === 'exit' ? 'exitScan' : 'returnScan'
    const nextStatus = scanType === 'exit' ? 'out' : 'returned'

    setOutpass(current => current
      ? {
          ...current,
          status: nextStatus,
          [scanKey]: {
            time: new Date().toISOString(),
            matched,
            confidence
          }
        }
      : current
    )
  }

  const handleScan = async () => {
    if (!outpass) return
    setLoading(true)
    setResult(null)

    try {
      const image = captureImage()
      const data  = { image, outpassId: outpass._id }

      const res = scanType === 'exit'
        ? await verifyExitApi(data)
        : await verifyReturnApi(data)

      setResult(res.data)
      if (res.data?.matched) {
        updateScannedOutpass({
          matched: true,
          confidence: res.data.confidence
        })
      }
      stopCamera()
    } catch (err) {
      setResult({
        matched: false,
        message: err.response?.data?.message || 'Scan failed'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOverride = async () => {
    if (!note.trim()) {
      alert('Please enter a reason for manual override')
      return
    }
    try {
      await manualOverrideApi({
        outpassId:    outpass._id,
        type:         scanType,
        overrideNote: note
      })
      setOverrideDone(true)
      updateScannedOutpass({ matched: false, confidence: 0 })
      setResult({ matched: true, message: '✅ Manual override applied successfully' })
    } catch {
      alert('Override failed. Please try again.')
    }
  }

  const getSuggestedScanType = () => {
    if (!outpass) return null
    if (outpass.status === 'approved')    return 'exit'
    if (outpass.status === 'out')         return 'return'
    if (outpass.status === 'late_return') return 'return'
    return null
  }

  const suggestedType = getSuggestedScanType()

  const studentName  = student?.name       || outpass?.studentId?.name       || '—'
  const studentRoll  = student?.rollNumber || outpass?.studentId?.rollNumber || '—'
  const studentDept  = student?.department || outpass?.studentId?.department || '—'
  const studentPhone = student?.phone      || outpass?.studentId?.phone      || '—'
  const studentPhoto = student?.faceImageUrl || outpass?.studentId?.faceImageUrl || null

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>🚪 Gate Scanner</h2>
          <p style={s.subtitle}>Scan student face for exit or return</p>
        </div>

        {/* Scan Type Tabs */}
        <div style={s.tabs}>
          {['exit', 'return'].map(type => (
            <button
              key={type}
              style={{
                ...s.tab,
                background: scanType === type ? '#4f46e5' : '#fff',
                color:      scanType === type ? '#fff'    : '#555',
                borderColor: scanType === type ? '#4f46e5' : '#e0e0e0'
              }}
              onClick={() => { setScanType(type); setResult(null) }}
            >
              {type === 'exit' ? '🚪 Exit Scan' : '🏠 Return Scan'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={s.searchCard}>
          <label style={s.label}>Student Roll Number</label>
          <div style={s.searchRow}>
            <input
              type='text'
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder='e.g. 21CS001'
              style={s.input}
            />
            <button
              style={s.searchBtn}
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? '⏳' : '🔍'} {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchError && <p style={s.errorMsg}>{searchError}</p>}
        </div>

        {/* Student Info Card */}
        {outpass && (
          <div style={s.studentCard}>

            {/* Student identity */}
            <div style={s.studentTop}>
              <div style={s.studentPhotoBox}>
                {studentPhoto ? (
                  <img
                    src={studentPhoto}
                    alt='Student'
                    style={s.studentPhoto}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div style={s.studentPhotoPlaceholder}>
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={s.studentInfo}>
                <h3 style={s.studentName}>{studentName}</h3>
                <p style={s.studentMeta}>{studentRoll} • {studentDept}</p>
                <p style={s.studentMeta}>📞 {studentPhone}</p>
              </div>
              <StatusBadge status={outpass.status} />
            </div>

            {/* Suggestion alert */}
            {suggestedType && suggestedType !== scanType && (
              <div style={s.suggestionAlert}>
                ⚠️ Outpass is <strong>{outpass.status}</strong> — switch to{' '}
                <button
                  style={s.switchBtn}
                  onClick={() => setScanType(suggestedType)}
                >
                  {suggestedType === 'exit' ? 'Exit Scan' : 'Return Scan'}
                </button>
              </div>
            )}

            {/* Outpass details */}
            <div style={s.outpassGrid}>
              <div style={s.outpassItem}>
                <span style={s.outpassKey}>Reason</span>
                <span style={s.outpassVal}>{outpass.reason}</span>
              </div>
              <div style={s.outpassItem}>
                <span style={s.outpassKey}>Destination</span>
                <span style={s.outpassVal}>{outpass.destination}</span>
              </div>
              <div style={s.outpassItem}>
                <span style={s.outpassKey}>From</span>
                <span style={s.outpassVal}>{new Date(outpass.fromDate).toDateString()}</span>
              </div>
              <div style={s.outpassItem}>
                <span style={s.outpassKey}>To</span>
                <span style={s.outpassVal}>{new Date(outpass.toDate).toDateString()}</span>
              </div>
              <div style={s.outpassItem}>
                <span style={s.outpassKey}>Expires</span>
                <span style={{
                  ...s.outpassVal,
                  color: new Date() > new Date(outpass.expiresAt) ? '#dc2626' : '#16a34a',
                  fontWeight: '600'
                }}>
                  {new Date(outpass.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Camera */}
        {outpass && !overrideDone && (
          <div style={s.cameraCard}>
            <div style={s.cameraBox}>
              <video ref={videoRef} style={s.video} muted playsInline />
              {!streaming && (
                <div style={s.cameraPlaceholder}>
                  📷 Click Start Camera to begin face scan
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div style={s.cameraActions}>
              {!streaming ? (
                <button style={s.startBtn} onClick={startCamera}>
                  📷 Start Camera
                </button>
              ) : (
                <>
                  <button
                    style={{
                      ...s.scanBtn,
                      opacity: loading ? 0.7 : 1,
                      cursor:  loading ? 'not-allowed' : 'pointer'
                    }}
                    onClick={handleScan}
                    disabled={loading}
                  >
                    {loading ? '⏳ Scanning...' : '🔍 Scan Face'}
                  </button>
                  <button style={s.stopBtn} onClick={stopCamera}>
                    ✕ Stop
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Scan Result */}
        {result && (
          <div style={{
            ...s.resultCard,
            borderColor: result.matched ? '#16a34a' : '#dc2626',
            background:  result.matched ? '#f0fff4' : '#fff0f0'
          }}>
            <div style={s.resultIcon}>
              {result.matched ? '✅' : '❌'}
            </div>
            <div>
              <h3 style={{
                ...s.resultTitle,
                color: result.matched ? '#16a34a' : '#dc2626'
              }}>
                {result.matched ? 'Face Matched!' : 'Face Not Matched!'}
              </h3>
              {result.message   && <p style={s.resultMsg}>{result.message}</p>}
              {result.confidence && <p style={s.resultMsg}>Confidence: <strong>{result.confidence}%</strong></p>}
              {result.student   && <p style={s.resultMsg}>Student: <strong>{result.student}</strong></p>}
            </div>
          </div>
        )}

        {/* Manual Override — shows student photo for visual confirmation */}
        {result && !result.matched && !overrideDone && (
          <div style={s.overrideCard}>

            <div style={s.overrideHeader}>
              <div style={s.overrideIcon}>⚠️</div>
              <div>
                <h3 style={s.overrideTitle}>Manual Override</h3>
                <p style={s.overrideSub}>Face scan failed. Verify student identity visually before overriding.</p>
              </div>
            </div>

            {/* Student registered photo for visual comparison */}
            <div style={s.compareBox}>
              <div style={s.compareLeft}>
                <p style={s.compareLabel}>📋 Registered Photo</p>
                {studentPhoto ? (
                  <img
                    src={studentPhoto}
                    alt='Registered student'
                    style={s.comparePhoto}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div style={{
                  ...s.comparePhotoPlaceholder,
                  display: studentPhoto ? 'none' : 'flex'
                }}>
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <p style={s.compareName}>{studentName}</p>
                <p style={s.compareRoll}>{studentRoll}</p>
              </div>

              <div style={s.compareRight}>
                <p style={s.compareLabel}>✅ Verify these match:</p>
                <div style={s.checkList}>
                  {[
                    'Face matches the registered photo',
                    'Student ID card matches roll number',
                    'Student is physically present'
                  ].map((item, i) => (
                    <div key={i} style={s.checkItem}>
                      <span style={s.checkDot}>•</span>
                      <span style={s.checkText}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.overrideForm}>
              <label style={s.label}>
                Reason for override <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder='e.g. Student verified by ID card. Face scan failed due to poor lighting.'
                style={s.textarea}
              />
              <button
                style={{
                  ...s.overrideBtn,
                  opacity: !note.trim() ? 0.5 : 1,
                  cursor:  !note.trim() ? 'not-allowed' : 'pointer'
                }}
                onClick={handleOverride}
                disabled={!note.trim()}
              >
                ✅ Apply Manual Override
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────
// Styles
// ─────────────────────────────────────
const s = {
  page:          { background: '#f5f6fa', minHeight: '100vh' },
  container:     { maxWidth: '680px', margin: '0 auto', padding: '24px 20px 40px' },

  header:        { marginBottom: '24px' },
  title:         { fontSize: '22px', fontWeight: '700', color: '#1e1e2e', marginBottom: '4px' },
  subtitle:      { fontSize: '14px', color: '#888' },

  tabs:          { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab:           { flex: 1, padding: '12px', border: '2px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },

  searchCard:    { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '16px' },
  label:         { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#444' },
  searchRow:     { display: 'flex', gap: '10px' },
  input:         { flex: 1, padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  searchBtn:     { background: '#4f46e5', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' },
  errorMsg:      { color: '#dc2626', fontSize: '13px', marginTop: '8px' },

  studentCard:   { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '16px' },
  studentTop:    { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
  studentPhotoBox:{ flexShrink: 0 },
  studentPhoto:  { width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' },
  studentPhotoPlaceholder: { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold', flexShrink: 0 },
  studentInfo:   { flex: 1 },
  studentName:   { fontSize: '16px', fontWeight: '700', color: '#1e1e2e', marginBottom: '4px' },
  studentMeta:   { fontSize: '12px', color: '#888', marginBottom: '2px' },

  suggestionAlert: { background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#795548', marginBottom: '14px' },
  switchBtn:     { background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: 0 },

  outpassGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '14px' },
  outpassItem:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  outpassKey:    { fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  outpassVal:    { fontSize: '13px', color: '#333', fontWeight: '500' },

  cameraCard:    { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '16px' },
  cameraBox:     { background: '#111', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  video:         { width: '100%', height: 'auto', display: 'block' },
  cameraPlaceholder: { color: '#666', fontSize: '14px', textAlign: 'center', padding: '40px 20px' },
  cameraActions: { display: 'flex', gap: '10px' },
  startBtn:      { flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  scanBtn:       { flex: 1, background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  stopBtn:       { background: '#fff', color: '#666', border: '1px solid #e0e0e0', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  resultCard:    { padding: '20px', borderRadius: '12px', border: '2px solid', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  resultIcon:    { fontSize: '32px', flexShrink: 0 },
  resultTitle:   { fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  resultMsg:     { fontSize: '14px', color: '#555', marginBottom: '2px' },

  overrideCard:  { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '16px' },
  overrideHeader:{ background: '#fff8f0', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start', borderBottom: '1px solid #ffe0cc' },
  overrideIcon:  { fontSize: '28px', flexShrink: 0 },
  overrideTitle: { fontSize: '16px', fontWeight: '700', color: '#c2410c', marginBottom: '4px' },
  overrideSub:   { fontSize: '13px', color: '#888' },

  compareBox:    { display: 'flex', gap: '20px', padding: '20px', borderBottom: '1px solid #f0f0f0' },
  compareLeft:   { textAlign: 'center', flexShrink: 0 },
  compareRight:  { flex: 1 },
  compareLabel:  { fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  comparePhoto:  { width: '100px', height: '100px', borderRadius: '10px', objectFit: 'cover', border: '3px solid #4f46e5', display: 'block', margin: '0 auto 8px' },
  comparePhotoPlaceholder: { width: '100px', height: '100px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '36px', fontWeight: 'bold', margin: '0 auto 8px' },
  compareName:   { fontSize: '13px', fontWeight: '600', color: '#333' },
  compareRoll:   { fontSize: '12px', color: '#888' },
  checkList:     { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' },
  checkItem:     { display: 'flex', gap: '8px', alignItems: 'flex-start' },
  checkDot:      { color: '#4f46e5', fontWeight: '700', flexShrink: 0 },
  checkText:     { fontSize: '13px', color: '#555', lineHeight: '1.4' },

  overrideForm:  { padding: '20px' },
  textarea:      { width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '14px', fontFamily: 'inherit' },
  overrideBtn:   { width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }
}
