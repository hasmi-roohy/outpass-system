import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginApi } from '../api/api'
import heroImage from '../assets/hero.png'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginApi(formData)
      const user = res.data
      login(user)

      const routes = {
        student: '/student',
        warden1: '/warden1',
        warden2: '/warden2',
        admin: '/admin'
      }
      navigate(routes[user.role] || '/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={s.page} className='login-page'>
      <section style={{ ...s.visual, backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.84), rgba(37,99,235,0.62)), url(${heroImage})` }} className='login-visual'>
        <div style={s.visualContent}>
          <div style={s.logo}>OMS</div>
          <h1 style={s.title}>Outpass Management System</h1>
          <p style={s.subtitle}>A clean approval, tracking, and gate verification system for outpasses.</p>

          <div style={s.featureGrid} className='login-feature-grid'>
            {[
              ['Role access', 'Students, wardens, gate staff, and admins each see only what matters.'],
              ['Parent approval', 'Approval links and manual fallback flows support urgent cases.'],
              ['Gate checks', 'Scan and return flows help keep movement records consistent.']
            ].map(([label, text]) => (
              <div key={label} style={s.feature}>
                <span style={s.featureLabel}>{label}</span>
                <span style={s.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={s.formPanel}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.kicker}>Secure login</span>
            <h2 style={s.cardTitle}>Welcome back</h2>
            <p style={s.cardSub}>Sign in with your registered campus account.</p>
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.field}>
              <span style={s.label}>Email address</span>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='you@college.edu'
                style={s.input}
                required
                autoFocus
              />
            </label>

            <label style={s.field}>
              <span style={s.label}>Password</span>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter your password'
                style={s.input}
                required
              />
            </label>

            <button
              type='submit'
              style={{
                ...s.btn,
                opacity: loading ? 0.78 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={s.roles}>
            {['Admin', 'Student', 'Warden 1', 'Warden 2'].map(role => (
              <span key={role} style={s.roleTag}>{role}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'minmax(420px, 1.05fr) minmax(360px, 0.95fr)',
    background: '#f4f7fb'
  },
  visual: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: '100vh',
    padding: '56px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#fff'
  },
  visualContent: { maxWidth: '560px' },
  logo: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.24)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 900,
    marginBottom: '22px'
  },
  title: { margin: '0 0 12px', fontSize: '44px', lineHeight: 1.05, letterSpacing: 0, fontWeight: 900 },
  subtitle: { margin: '0 0 28px', maxWidth: '520px', color: 'rgba(255,255,255,0.84)', fontSize: '17px', lineHeight: 1.6 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' },
  feature: {
    padding: '14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)'
  },
  featureLabel: { display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: 900 },
  featureText: { display: 'block', color: 'rgba(255,255,255,0.78)', fontSize: '12px', lineHeight: 1.45 },
  formPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    border: '1px solid #e3e8f0',
    borderRadius: '10px',
    padding: '34px',
    boxShadow: '0 18px 50px rgba(15,23,42,0.08)'
  },
  cardHeader: { marginBottom: '26px' },
  kicker: { display: 'block', marginBottom: '8px', color: '#2563eb', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' },
  cardTitle: { margin: '0 0 7px', color: '#0f172a', fontSize: '28px', lineHeight: 1.15, fontWeight: 900 },
  cardSub: { margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.55 },
  errorBox: {
    marginBottom: '18px',
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: '14px',
    fontWeight: 700
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#334155', fontSize: '13px', fontWeight: 800 },
  input: {
    width: '100%',
    minHeight: '46px',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    fontSize: '15px',
    outline: 'none'
  },
  btn: {
    width: '100%',
    minHeight: '48px',
    marginTop: '6px',
    border: 'none',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 900,
    boxShadow: '0 10px 22px rgba(37,99,235,0.22)'
  },
  roles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e3e8f0'
  },
  roleTag: {
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 800
  }
}
