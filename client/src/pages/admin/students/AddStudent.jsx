import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import WebcamCapture from '../../../components/WebcamCapture'
import {
  addStudentApi,
  getAllWarden1sApi,
  getAllWarden2sApi,
  registerStudentFaceApi,
  registerParentFaceApi
} from '../../../api/api'

export default function AddStudent() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name:        '',
    email:       '',
    password:    '',
    phone:       '',
    rollNumber:  '',
    department:  '',
    year:        '',
    warden1Id:   '',
    warden2Id:   '',
    hostelBlock: '',
    parents: [
      { name: '', email: '', phone: '', relation: 'Father'    },
      { name: '', email: '', phone: '', relation: 'Mother'    },
      { name: '', email: '', phone: '', relation: 'Guardian1' },
      { name: '', email: '', phone: '', relation: 'Guardian2' }
    ]
  })

  const [warden1s,       setWarden1s]       = useState([])
  const [warden2s,       setWarden2s]       = useState([])
  const [studentFace,    setStudentFace]    = useState(null)
  const [parentFaces,    setParentFaces]    = useState([null, null, null, null])
  const [parentPreviews, setParentPreviews] = useState([null, null, null, null])
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [statusMsg,      setStatusMsg]      = useState('')
  const [faceWarnings,   setFaceWarnings]   = useState([])

  useEffect(() => { fetchWardens() }, [])

  const fetchWardens = async () => {
    try {
      const [w1, w2] = await Promise.all([
        getAllWarden1sApi(),
        getAllWarden2sApi()
      ])
      setWarden1s(w1.data)
      setWarden2s(w2.data)
    } catch (err) {
      console.log('Failed to fetch wardens:', err)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleParentChange = (index, field, value) => {
    const updated = [...formData.parents]
    updated[index][field] = value
    setFormData({ ...formData, parents: updated })
  }

  // FILE UPLOAD for parents — keeps full base64 for preview
  // sends full base64 to API (face_utils.py strips prefix itself)
  const handleParentPhotoUpload = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError(`Parent photo too large. Max size is 5MB.`)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result // full data:image/jpeg;base64,...

      const updatedFaces = [...parentFaces]
      updatedFaces[index] = base64
      setParentFaces(updatedFaces)

      const updatedPreviews = [...parentPreviews]
      updatedPreviews[index] = base64
      setParentPreviews(updatedPreviews)
    }
    reader.onerror = () => {
      setError(`Failed to read parent photo. Please try again.`)
    }
    reader.readAsDataURL(file)
  }

  const removeParentPhoto = (index) => {
    const updatedFaces = [...parentFaces]
    updatedFaces[index] = null
    setParentFaces(updatedFaces)

    const updatedPreviews = [...parentPreviews]
    updatedPreviews[index] = null
    setParentPreviews(updatedPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFaceWarnings([])
    setLoading(true)

    try {
      // Build clean payload — skip empty strings
      const cleanData = {
        name:        formData.name,
        email:       formData.email,
        password:    formData.password,
        phone:       formData.phone,
        rollNumber:  formData.rollNumber  || undefined,
        department:  formData.department  || undefined,
        year:        formData.year        || undefined,
        hostelBlock: formData.hostelBlock || undefined,
        warden1Id:   formData.warden1Id   || undefined,
        warden2Id:   formData.warden2Id   || undefined,
        parents:     formData.parents
      }

      // ── Step 1: Create student account ──
      setStatusMsg('Creating student account...')
      const res = await addStudentApi(cleanData)
      const studentId = res.data.student._id

      if (!studentId) {
        throw new Error('Student created but ID not returned. Contact admin.')
      }

      const warnings = []

      // ── Step 2: Register student face (optional) ──
      if (studentFace) {
        setStatusMsg('Registering student face...')
        try {
          await registerStudentFaceApi(studentId, { image: studentFace })
        } catch (err) {
          console.log('Student face error:', err.response?.data)
          warnings.push('Student face registration failed — you can register it later from Edit Student.')
        }
      }

      // ── Step 3: Register parent faces (optional) ──
      for (let i = 0; i < parentFaces.length; i++) {
        if (parentFaces[i]) {
          setStatusMsg(`Registering ${formData.parents[i].relation} photo...`)
          try {
            await registerParentFaceApi(studentId, {
              image:       parentFaces[i],
              parentIndex: i
            })
          } catch (err) {
            console.log(`Parent ${i} face error:`, err.response?.data)
            warnings.push(
              `${formData.parents[i].relation} photo registration failed — you can upload it later from Edit Student.`
            )
          }
        }
      }

      // Show any warnings but still navigate
      if (warnings.length > 0) {
        setFaceWarnings(warnings)
        setStatusMsg('⚠️ Student added with some issues. See warnings above.')
        setTimeout(() => navigate('/admin/students'), 3000)
      } else {
        setStatusMsg('✅ Student added successfully!')
        setTimeout(() => navigate('/admin/students'), 1500)
      }

    } catch (err) {
      console.log('Submit error:', err.response?.data || err.message)
      setError(err.response?.data?.message || 'Failed to add student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>

        <button style={styles.backBtn} onClick={() => navigate('/admin/students')}>
          ← Back
        </button>

        <h2 style={styles.title}>Add New Student</h2>

        {error && <p style={styles.error}>{error}</p>}

        {faceWarnings.length > 0 && (
          <div style={styles.warningBox}>
            {faceWarnings.map((w, i) => (
              <p key={i} style={styles.warningText}>⚠️ {w}</p>
            ))}
          </div>
        )}

        {statusMsg && !error && (
          <p style={styles.status}>{statusMsg}</p>
        )}

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Basic Information</h3>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name *</label>
                <input name='name' value={formData.name}
                  onChange={handleChange} style={styles.input}
                  required placeholder='Full name' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email *</label>
                <input type='email' name='email' value={formData.email}
                  onChange={handleChange} style={styles.input}
                  required placeholder='Email address' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password *</label>
                <input type='password' name='password' value={formData.password}
                  onChange={handleChange} style={styles.input}
                  required placeholder='Set password' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Phone *</label>
                <input name='phone' value={formData.phone}
                  onChange={handleChange} style={styles.input}
                  required placeholder='Phone number' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Roll Number</label>
                <input name='rollNumber' value={formData.rollNumber}
                  onChange={handleChange} style={styles.input}
                  placeholder='Roll number' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Department</label>
                <input name='department' value={formData.department}
                  onChange={handleChange} style={styles.input}
                  placeholder='Department' />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Year</label>
                <select name='year' value={formData.year}
                  onChange={handleChange} style={styles.input}>
                  <option value=''>Select Year</option>
                  <option value='1'>1st Year</option>
                  <option value='2'>2nd Year</option>
                  <option value='3'>3rd Year</option>
                  <option value='4'>4th Year</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Hostel Block</label>
                <input name='hostelBlock' value={formData.hostelBlock}
                  onChange={handleChange} style={styles.input}
                  placeholder='Block A / B / C' />
              </div>
            </div>
          </div>

          {/* Assign Wardens */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Assign Wardens</h3>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Warden 1 (Review)</label>
                <select name='warden1Id' value={formData.warden1Id}
                  onChange={handleChange} style={styles.input}>
                  <option value=''>Select Warden 1</option>
                  {warden1s.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} — {w.hostelBlock}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Warden 2 (Gate)</label>
                <select name='warden2Id' value={formData.warden2Id}
                  onChange={handleChange} style={styles.input}>
                  <option value=''>Select Warden 2</option>
                  {warden2s.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} — {w.hostelBlock}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Face — WEBCAM */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Student Face Photo</h3>
            <p style={styles.hint}>
              📸 Capture student face for gate biometric scan (optional — can be added later)
            </p>
            <WebcamCapture onCapture={(image) => setStudentFace(image)} />
            {studentFace && (
              <div style={styles.capturedRow}>
                <span style={styles.captured}>✅ Student face captured</span>
                <button
                  type='button'
                  style={styles.clearBtn}
                  onClick={() => setStudentFace(null)}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>

          {/* Parents — FILE UPLOAD */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Parent / Guardian Details</h3>
            <p style={styles.hint}>
              📁 Fill parent details and upload photos for face verification (optional — can be added later)
            </p>

            {formData.parents.map((parent, i) => (
              <div key={i} style={styles.parentSection}>
                <h4 style={styles.parentTitle}>
                  {parent.relation}
                  {parentFaces[i] && (
                    <span style={styles.parentBadge}>✅ Photo uploaded</span>
                  )}
                </h4>

                <div style={styles.grid3}>
                  <div style={styles.field}>
                    <label style={styles.label}>Name</label>
                    <input
                      value={parent.name}
                      onChange={e => handleParentChange(i, 'name', e.target.value)}
                      style={styles.input}
                      placeholder='Parent name' />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input type='email'
                      value={parent.email}
                      onChange={e => handleParentChange(i, 'email', e.target.value)}
                      style={styles.input}
                      placeholder='Parent email' />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Phone</label>
                    <input
                      value={parent.phone}
                      onChange={e => handleParentChange(i, 'phone', e.target.value)}
                      style={styles.input}
                      placeholder='Parent phone' />
                  </div>
                </div>

                {/* FILE UPLOAD */}
                <div style={styles.uploadSection}>
                  <label style={styles.label}>
                    📁 Upload {parent.relation} Photo
                  </label>

                  {!parentFaces[i] ? (
                    <input
                      type='file'
                      accept='image/*'
                      onChange={e => handleParentPhotoUpload(i, e)}
                      style={styles.fileInput}
                    />
                  ) : (
                    <div style={styles.previewBox}>
                      <img
                        src={parentPreviews[i]}
                        alt={`${parent.relation} photo`}
                        style={styles.preview}
                      />
                      <div>
                        <p style={styles.captured}>✅ {parent.relation} photo ready</p>
                        <button
                          type='button'
                          style={styles.clearBtn}
                          onClick={() => removeParentPhoto(i)}
                        >
                          ✕ Remove photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={styles.buttons}>
            <button
              type='button'
              style={styles.cancelBtn}
              onClick={() => navigate('/admin/students')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor:  loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? statusMsg || 'Processing...' : 'Add Student'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

const styles = {
  container:     { maxWidth: '900px', margin: '30px auto', padding: '0 20px' },
  backBtn:       { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', padding: 0 },
  title:         { fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' },
  error:         { background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' },
  warningBox:    { background: '#fff3cd', border: '1px solid #ffc107', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px' },
  warningText:   { color: '#856404', fontSize: '13px', margin: '4px 0' },
  status:        { background: '#cce5ff', color: '#004085', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' },
  card:          { background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' },
  cardTitle:     { fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', color: '#4f46e5' },
  hint:          { fontSize: '13px', color: '#888', marginBottom: '16px' },
  capturedRow:   { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' },
  captured:      { color: '#155724', fontWeight: 'bold', fontSize: '13px' },
  clearBtn:      { background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', color: '#666', cursor: 'pointer' },
  grid2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  grid3:         { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  field:         { display: 'flex', flexDirection: 'column' },
  label:         { marginBottom: '6px', fontWeight: '500', fontSize: '13px', color: '#555' },
  input:         { padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  parentSection: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' },
  parentTitle:   { fontSize: '14px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  parentBadge:   { fontSize: '12px', background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '12px', fontWeight: 'normal' },
  uploadSection: { marginTop: '16px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' },
  fileInput:     { display: 'block', marginTop: '8px', fontSize: '14px', cursor: 'pointer' },
  previewBox:    { marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' },
  preview:       { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #4f46e5' },
  buttons:       { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' },
  cancelBtn:     { background: '#fff', color: '#666', border: '1px solid #ddd', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' },
  submitBtn:     { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold' }
}