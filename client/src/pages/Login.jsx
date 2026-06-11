import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginApi } from '../api/api'
import './Login.css'

export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res  = await loginApi(formData)
      const user = res.data
      login(user)

      const routes = {
        student: '/student',
        warden1: '/warden1',
        warden2: '/warden2',
        admin:   '/admin'
      }
      navigate(routes[user.role] || '/login')

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>

      {/* Left panel */}
      <div style={s.left} className='login-left'>
        <div style={s.leftContent}>
          <div style={s.logoBox}>
            <span style={s.logoIcon}>🎓</span>
          </div>
          <h1 style={s.brand}>OutpassMS</h1>
          <p style={s.brandSub}>College Outpass Management System</p>

          <div style={s.features}>
            {[
              { icon: '🔐', text: 'Secure role-based access' },
              { icon: '📧', text: 'Parent email approval flow' },
              { icon: '🤖', text: 'AI face recognition at gate' },
              { icon: '📊', text: 'Real-time outpass tracking' }
            ].map((f, i) => (
              <div key={i} style={s.feature}>
                <span style={s.featureIcon}>{f.icon}</span>
                <span style={s.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>

          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Welcome back</h2>
            <p style={s.cardSub}>Sign in to your account</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
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
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter your password'
                style={s.input}
                required
              />
            </div>

            <button
              type='submit'
              style={{
                ...s.btn,
                opacity: loading ? 0.8 : 1,
                cursor:  loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={s.roles}>
            <p style={s.rolesTitle}>Available roles</p>
            <div style={s.rolesList}>
              {['Admin', 'Student', 'Warden 1', 'Warden 2'].map((r, i) => (
                <span key={i} style={s.roleTag}>{r}</span>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

const s = {
  page:        { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },

  // Left — @media moved to Login.css
  left:        { flex: 1, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  leftContent: { maxWidth: '400px', color: '#fff' },
  logoBox:     { width: '72px', height: '72px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', backdropFilter: 'blur(10px)' },
  logoIcon:    { fontSize: '36px' },
  brand:       { fontSize: '32px', fontWeight: '800', color: '#fff', margin: '0 0 8px' },
  brandSub:    { fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0 0 48px' },
  features:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  feature:     { display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', backdropFilter: 'blur(8px)' },
  featureIcon: { fontSize: '20px', flexShrink: 0 },
  featureText: { fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // Right
  right:       { width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#f8f9ff' },
  card:        { width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 8px 40px rgba(79,70,229,0.12)' },
  cardHeader:  { marginBottom: '28px' },
  cardTitle:   { fontSize: '26px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 6px' },
  cardSub:     { fontSize: '14px', color: '#888', margin: 0 },

  errorBox:    { background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' },

  field:       { marginBottom: '20px' },
  label:       { display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' },
  input:       { width: '100%', padding: '12px 16px', border: '1.5px solid #e8e8f0', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: '#fafafa' },

  btn:         { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', marginTop: '8px', letterSpacing: '0.3px' },

  roles:       { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' },
  rolesTitle:  { fontSize: '12px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' },
  rolesList:   { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  roleTag:     { background: '#f0f0ff', color: '#4f46e5', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }
}