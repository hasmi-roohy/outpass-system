import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import { getAllWarden1sApi, editWarden1Api } from '../../../api/api'

export default function EditWarden1() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    hostelBlock: '', isActive: true
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchWarden() }, [])

  const fetchWarden = async () => {
    try {
      const res    = await getAllWarden1sApi()
      const warden = res.data.find(w => w._id === id)
      if (warden) {
        setFormData({
          name:        warden.name        || '',
          email:       warden.email       || '',
          password:    '',
          phone:       warden.phone       || '',
          hostelBlock: warden.hostelBlock || '',
          isActive:    warden.isActive
        })
      }
    } catch (err) {
      console.log(err)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...formData }
      if (!payload.password) delete payload.password
      await editWarden1Api(id, payload)
      navigate('/admin/warden1s')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update warden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        <button style={s.backBtn} onClick={() => navigate('/admin/warden1s')}>
          ← Back
        </button>

        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Edit Warden 1</h1>
          <p style={s.pageSub}>Update warden details</p>
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        <div style={s.card}>
          <form onSubmit={handleSubmit}>
            <div style={s.grid}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input name='name' value={formData.name}
                  onChange={handleChange} style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input type='email' name='email' value={formData.email}
                  onChange={handleChange} style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>New Password (leave blank to keep)</label>
                <input type='password' name='password' value={formData.password}
                  onChange={handleChange} style={s.input}
                  placeholder='Leave blank to keep current' />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input name='phone' value={formData.phone}
                  onChange={handleChange} style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Hostel Block</label>
                <input name='hostelBlock' value={formData.hostelBlock}
                  onChange={handleChange} style={s.input} />
              </div>
            </div>

            <div style={s.checkRow}>
              <input
                type='checkbox'
                name='isActive'
                id='isActive'
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor='isActive' style={s.checkLabel}>
                Account Active
              </label>
            </div>

            <div style={s.buttons}>
              <button
                type='button'
                style={s.cancelBtn}
                onClick={() => navigate('/admin/warden1s')}
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
                {loading ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}

const s = {
  page:       { background: '#f5f6fa', minHeight: '100vh' },
  container:  { maxWidth: '700px', margin: '0 auto', padding: '24px 20px 60px' },
  backBtn:    { background: 'none', border: 'none', color: '#0891b2', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '0 0 16px', display: 'block' },
  pageHeader: { marginBottom: '24px' },
  pageTitle:  { fontSize: '22px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:    { fontSize: '14px', color: '#888', margin: 0 },
  errorBox:   { background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' },
  card:       { background: '#fff', borderRadius: '14px', padding: '28px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' },
  field:      { display: 'flex', flexDirection: 'column' },
  label:      { fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' },
  input:      { padding: '11px 14px', border: '1.5px solid #e8e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fafafa' },
  checkRow:   { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
  checkLabel: { fontSize: '14px', fontWeight: '600', color: '#333', cursor: 'pointer' },
  buttons:    { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn:  { background: '#fff', color: '#666', border: '1.5px solid #e0e0e0', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  submitBtn:  { background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '14px' }
}