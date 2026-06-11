import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { applyOutpassApi } from '../../api/api'

export default function ApplyOutpass() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    reason:      '',
    destination: '',
    fromDate:    '',
    toDate:      '',
    fromTime:    '',
    toTime:      ''
  })

  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate dates
    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setError('Return date cannot be before departure date')
      return
    }

    if (new Date(formData.fromDate) < new Date().setHours(0,0,0,0)) {
      setError('Departure date cannot be in the past')
      return
    }

    setLoading(true)

    try {
      await applyOutpassApi(formData)
      setSuccess(true)
      setTimeout(() => navigate('/student'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (success) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.successPage}>
        <div style={s.successCard}>
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Outpass Applied!</h2>
          <p style={s.successSub}>
            Your request has been submitted successfully.
            Your warden will review it shortly.
          </p>
          <p style={s.successRedirect}>Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <button style={s.backBtn} onClick={() => navigate('/student')}>
            ← Back
          </button>
          <div>
            <h1 style={s.pageTitle}>Apply for Outpass</h1>
            <p style={s.pageSub}>Fill in the details for your leave request</p>
          </div>
        </div>

        {/* Info banner */}
        <div style={s.infoBanner}>
          <span style={s.infoIcon}>ℹ️</span>
          <div>
            <p style={s.infoText}>
              Your outpass will be reviewed by your warden and then sent to your
              parents for approval. Make sure all details are accurate.
            </p>
          </div>
        </div>

        {error && (
          <div style={s.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Leave Details</h3>

            {/* Reason */}
            <div style={s.field}>
              <label style={s.label}>
                Reason for Leave <span style={s.required}>*</span>
              </label>
              <textarea
                name='reason'
                value={formData.reason}
                onChange={handleChange}
                placeholder='e.g. Family function, Medical appointment, Personal work...'
                style={s.textarea}
                required
                rows={3}
              />
            </div>

            {/* Destination */}
            <div style={s.field}>
              <label style={s.label}>
                Destination <span style={s.required}>*</span>
              </label>
              <input
                name='destination'
                value={formData.destination}
                onChange={handleChange}
                placeholder='e.g. Hyderabad, Home town, Apollo Hospital...'
                style={s.input}
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>📅 Travel Dates</h3>
            <div style={s.dateGrid}>
              <div style={s.field}>
                <label style={s.label}>
                  Departure Date <span style={s.required}>*</span>
                </label>
                <input
                  type='date'
                  name='fromDate'
                  value={formData.fromDate}
                  onChange={handleChange}
                  style={s.input}
                  min={today}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>
                  Return Date <span style={s.required}>*</span>
                </label>
                <input
                  type='date'
                  name='toDate'
                  value={formData.toDate}
                  onChange={handleChange}
                  style={s.input}
                  min={formData.fromDate || today}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Departure Time (reference)</label>
                <input
                  type='time'
                  name='fromTime'
                  value={formData.fromTime}
                  onChange={handleChange}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Return Time (reference)</label>
                <input
                  type='time'
                  name='toTime'
                  value={formData.toTime}
                  onChange={handleChange}
                  style={s.input}
                />
              </div>
            </div>
          </div>

          {/* Flow info */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>📌 What happens next?</h3>
            <div style={s.flowSteps}>
              {[
                { icon: '📝', title: 'Request submitted',    sub: 'Your warden receives the request' },
                { icon: '👨‍💼', title: 'Warden reviews',      sub: 'Warden adds a note and forwards to parents' },
                { icon: '📧', title: 'Parents notified',     sub: 'All 4 guardians receive an email' },
                { icon: '✅', title: 'Parent approves',      sub: 'First parent to respond decides' },
                { icon: '🚪', title: 'Gate face scan',       sub: 'Scan at gate when leaving and returning' }
              ].map((step, i) => (
                <div key={i} style={s.flowStep}>
                  <div style={s.flowIcon}>{step.icon}</div>
                  <div style={s.flowLine}>
                    {i < 4 && <div style={s.flowConnector} />}
                  </div>
                  <div style={s.flowInfo}>
                    <p style={s.flowTitle}>{step.title}</p>
                    <p style={s.flowSub}>{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={s.buttons}>
            <button
              type='button'
              style={s.cancelBtn}
              onClick={() => navigate('/student')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              style={{
                ...s.submitBtn,
                opacity: loading ? 0.8 : 1,
                cursor:  loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? '⏳ Submitting...' : '➕ Submit Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

const s = {
  page:          { background: '#f5f6fa', minHeight: '100vh' },
  container:     { maxWidth: '700px', margin: '0 auto', padding: '24px 20px 60px' },

  pageHeader:    { marginBottom: '24px' },
  backBtn:       { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '0 0 12px', display: 'block' },
  pageTitle:     { fontSize: '22px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:       { fontSize: '14px', color: '#888', margin: 0 },

  infoBanner:    { background: '#f0f0ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' },
  infoIcon:      { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  infoText:      { fontSize: '13px', color: '#4f46e5', margin: 0, lineHeight: '1.5' },

  errorBox:      { background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' },

  card:          { background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' },
  cardTitle:     { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', marginBottom: '20px' },

  field:         { marginBottom: '18px' },
  label:         { display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' },
  required:      { color: '#dc2626' },
  input:         { width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fafafa' },
  textarea:      { width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', background: '#fafafa' },

  dateGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },

  flowSteps:     { display: 'flex', flexDirection: 'column', gap: '0' },
  flowStep:      { display: 'flex', gap: '14px', alignItems: 'flex-start' },
  flowIcon:      { width: '36px', height: '36px', borderRadius: '50%', background: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  flowLine:      { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '0' },
  flowConnector: { width: '2px', height: '28px', background: '#e0e0f0', margin: '4px 0' },
  flowInfo:      { paddingBottom: '16px', flex: 1 },
  flowTitle:     { fontSize: '14px', fontWeight: '600', color: '#333', margin: '8px 0 2px' },
  flowSub:       { fontSize: '12px', color: '#888', margin: 0 },

  buttons:       { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  cancelBtn:     { background: '#fff', color: '#666', border: '1.5px solid #e0e0e0', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  submitBtn:     { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' },

  successPage:   { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  successCard:   { background: '#fff', borderRadius: '20px', padding: '50px 40px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  successIcon:   { fontSize: '56px', marginBottom: '20px' },
  successTitle:  { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', marginBottom: '12px' },
  successSub:    { fontSize: '15px', color: '#555', marginBottom: '16px', lineHeight: '1.6' },
  successRedirect:{ fontSize: '13px', color: '#aaa' }
}