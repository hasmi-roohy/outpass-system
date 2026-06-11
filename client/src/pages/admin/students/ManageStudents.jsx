import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import StatusBadge from '../../../components/StatusBadge'
import {
  getAllStudentsApi,
  deleteStudentApi
} from '../../../api/api'

export default function ManageStudents() {
  const navigate = useNavigate()

  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [deleteId,  setDeleteId]  = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      const res = await getAllStudentsApi()
      setStudents(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteStudentApi(deleteId)
      setStudents(students.filter(s => s._id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      console.log(err)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = students.filter(s => {
    const matchSearch = search === '' ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())

    const matchFilter = filter === 'all'
      ? true
      : filter === 'active'
      ? s.isActive
      : !s.isActive

    return matchSearch && matchFilter
  })

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Students</h1>
            <p style={s.pageSub}>{students.length} registered students</p>
          </div>
          <button
            style={s.addBtn}
            onClick={() => navigate('/admin/students/add')}
          >
            ➕ Add Student
          </button>
        </div>

        {/* Search + Filter */}
        <div style={s.toolbar}>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by name, roll number, email, department...'
            style={s.searchInput}
          />
          <div style={s.filterBtns}>
            {['all', 'active', 'inactive'].map(f => (
              <button
                key={f}
                style={{
                  ...s.filterBtn,
                  background:  filter === f ? '#4f46e5' : '#fff',
                  color:       filter === f ? '#fff'    : '#666',
                  borderColor: filter === f ? '#4f46e5' : '#e0e0e0'
                }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {search && (
          <p style={s.resultCount}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </p>
        )}

        {/* Table */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🎓</div>
            <p style={s.emptyTitle}>No students found</p>
            <p style={s.emptySub}>
              {search ? 'Try a different search term' : 'Add your first student to get started'}
            </p>
            {!search && (
              <button
                style={s.emptyBtn}
                onClick={() => navigate('/admin/students/add')}
              >
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Student</th>
                  <th style={s.th}>Roll No</th>
                  <th style={s.th}>Department</th>
                  <th style={s.th}>Year</th>
                  <th style={s.th}>Warden 1</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Face</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr
                    key={student._id}
                    style={{
                      ...s.tr,
                      background: i % 2 === 0 ? '#fff' : '#fafafa'
                    }}
                  >
                    <td style={s.td}>
                      <div style={s.studentCell}>
                        <div style={s.avatar}>
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={s.studentName}>{student.name}</p>
                          <p style={s.studentEmail}>{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.rollNumber}>
                        {student.rollNumber || '—'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.dept}>
                        {student.department || '—'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {student.year ? `Year ${student.year}` : '—'}
                    </td>
                    <td style={s.td}>
                      <span style={s.wardenName}>
                        {student.warden1Id?.name || (
                          <span style={s.notAssigned}>Not assigned</span>
                        )}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        ...s.statusChip,
                        background: student.isActive ? '#f0fff4' : '#fff0f0',
                        color:      student.isActive ? '#16a34a' : '#dc2626'
                      }}>
                        {student.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{
                        ...s.faceChip,
                        background: student.faceImageUrl ? '#f0fff4' : '#fff8e1',
                        color:      student.faceImageUrl ? '#16a34a' : '#f59e0b'
                      }}>
                        {student.faceImageUrl ? '✅ Registered' : '⚠️ Missing'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button
                          style={s.editBtn}
                          onClick={() => navigate(`/admin/students/edit/${student._id}`)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={s.deleteBtn}
                          onClick={() => setDeleteId(student._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteId && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <div style={s.modalIcon}>🗑️</div>
              <h3 style={s.modalTitle}>Delete Student?</h3>
              <p style={s.modalSub}>
                This will permanently delete the student and all their data.
                This action cannot be undone.
              </p>
              <div style={s.modalActions}>
                <button
                  style={s.modalCancel}
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  style={s.modalDelete}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
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
  page:          { background: '#f5f6fa', minHeight: '100vh' },
  container:     { maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 60px' },

  pageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:     { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:       { fontSize: '14px', color: '#888', margin: 0 },
  addBtn:        { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },

  toolbar:       { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput:   { flex: 1, minWidth: '240px', padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  filterBtns:    { display: 'flex', gap: '8px' },
  filterBtn:     { padding: '10px 18px', border: '1.5px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },

  resultCount:   { fontSize: '13px', color: '#888', marginBottom: '12px' },

  loadingBox:    { textAlign: 'center', padding: '60px' },
  spinner:       { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:   { color: '#888', fontSize: '14px' },

  emptyBox:      { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:     { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:    { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:      { fontSize: '14px', color: '#888', marginBottom: '20px' },
  emptyBtn:      { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },

  tableWrap:     { background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'auto' },
  table:         { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  thead:         { background: '#f8f9ff' },
  th:            { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0' },
  tr:            { transition: 'background 0.15s' },
  td:            { padding: '14px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },

  studentCell:   { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar:        { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '15px', flexShrink: 0 },
  studentName:   { fontSize: '14px', fontWeight: '600', color: '#1e1e2e', margin: '0 0 2px' },
  studentEmail:  { fontSize: '12px', color: '#888', margin: 0 },
  rollNumber:    { fontFamily: 'monospace', fontSize: '13px', background: '#f8f9ff', padding: '3px 8px', borderRadius: '6px', color: '#4f46e5', fontWeight: '600' },
  dept:          { fontSize: '13px', color: '#555' },
  wardenName:    { fontSize: '13px', color: '#333' },
  notAssigned:   { color: '#f59e0b', fontStyle: 'italic', fontSize: '12px' },
  statusChip:    { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  faceChip:      { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },

  actions:       { display: 'flex', gap: '8px', alignItems: 'center' },
  editBtn:       { background: '#f0f0ff', color: '#4f46e5', border: 'none', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  deleteBtn:     { background: '#fff0f0', color: '#dc2626', border: 'none', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal:         { background: '#fff', borderRadius: '16px', padding: '36px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalIcon:     { fontSize: '40px', marginBottom: '16px' },
  modalTitle:    { fontSize: '20px', fontWeight: '800', color: '#1e1e2e', marginBottom: '8px' },
  modalSub:      { fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: '1.5' },
  modalActions:  { display: 'flex', gap: '12px' },
  modalCancel:   { flex: 1, background: '#f5f5f5', color: '#666', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  modalDelete:   { flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }
}