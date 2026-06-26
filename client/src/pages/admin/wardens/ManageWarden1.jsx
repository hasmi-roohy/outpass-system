import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../../components/Navbar'
import {
  getAllWarden1sApi,
  deleteWarden1Api
} from '../../../api/api'

export default function ManageWarden1() {
  const navigate = useNavigate()

  const [wardens, setWardens] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchWardens() }, [])

  const fetchWardens = async () => {
    try {
      setError('')
      const res = await getAllWarden1sApi()
      setWardens(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Warden 1 list')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteWarden1Api(deleteId)
      setWardens(wardens.filter(w => w._id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete Warden 1')
      setDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  const selectedWarden = wardens.find(w => w._id === deleteId)
  const filtered = wardens.filter(w =>
    search === '' ||
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.email?.toLowerCase().includes(search.toLowerCase()) ||
    w.hostelBlock?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Existing Warden 1s</h1>
            <p style={s.pageSub}>{wardens.length} review wardens in the system</p>
          </div>
          <button
            style={s.addBtn}
            onClick={() => navigate('/admin/warden1s/add')}
          >
            + Add Warden 1
          </button>
        </div>

        <div style={s.toolbar}>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by name, email, hostel block...'
            style={s.searchInput}
          />
        </div>

        {error && <div style={s.errorAlert}>{error}</div>}

        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading wardens...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>W1</div>
            <p style={s.emptyTitle}>No Warden 1s found</p>
            <p style={s.emptySub}>
              {search ? 'Try a different search' : 'Add your first Warden 1'}
            </p>
            {!search && (
              <button
                style={s.emptyBtn}
                onClick={() => navigate('/admin/warden1s/add')}
              >
                Add Warden 1
              </button>
            )}
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map(warden => (
              <div key={warden._id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>
                    {warden.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.cardInfo}>
                    <h3 style={s.name}>{warden.name}</h3>
                    <p style={s.email}>{warden.email}</p>
                  </div>
                  <span style={{
                    ...s.statusDot,
                    background: warden.isActive ? '#16a34a' : '#dc2626'
                  }} />
                </div>

                <div style={s.details}>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Phone</span>
                    <span style={s.detailVal}>{warden.phone || '-'}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Hostel Block</span>
                    <span style={s.detailVal}>{warden.hostelBlock || '-'}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Assigned Students</span>
                    <span style={{
                      ...s.assignedChip,
                      background: warden.assignedStudentCount > 0 ? '#e8f4fd' : '#f5f5f5',
                      color: warden.assignedStudentCount > 0 ? '#0891b2' : '#888'
                    }}>
                      {warden.assignedStudentCount || 0}
                    </span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Status</span>
                    <span style={{
                      ...s.statusChip,
                      background: warden.isActive ? '#f0fff4' : '#fff0f0',
                      color: warden.isActive ? '#16a34a' : '#dc2626'
                    }}>
                      {warden.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div style={s.actions}>
                  <button
                    style={s.editBtn}
                    onClick={() => navigate(`/admin/warden1s/edit/${warden._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      ...s.deleteBtn,
                      opacity: warden.assignedStudentCount > 0 ? 0.55 : 1
                    }}
                    onClick={() => setDeleteId(warden._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteId && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <h3 style={s.modalTitle}>Delete Warden 1?</h3>
              <p style={s.modalSub}>
                {selectedWarden?.assignedStudentCount > 0
                  ? `${selectedWarden.assignedStudentCount} student${selectedWarden.assignedStudentCount === 1 ? ' is' : 's are'} assigned to this warden. Reassign them before deleting.`
                  : 'This will permanently delete this warden. This action cannot be undone.'}
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
                  disabled={deleting || selectedWarden?.assignedStudentCount > 0}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
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
  page: { background: '#f5f6fa', minHeight: '100vh' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 60px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub: { fontSize: '14px', color: '#888', margin: 0 },
  addBtn: { background: '#0891b2', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  toolbar: { marginBottom: '16px' },
  searchInput: { width: '100%', padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  errorAlert: { background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' },
  loadingBox: { textAlign: 'center', padding: '60px' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #0891b2', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#888', fontSize: '14px' },
  emptyBox: { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon: { width: '52px', height: '52px', margin: '0 auto 16px', borderRadius: '14px', background: '#e8f4fd', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  emptyTitle: { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  emptyBtn: { background: '#0891b2', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  name: { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 3px' },
  email: { fontSize: '12px', color: '#888', margin: 0, overflowWrap: 'anywhere' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  details: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', padding: '14px 0', borderTop: '1px solid #f8f8f8', borderBottom: '1px solid #f8f8f8' },
  detailItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  detailLabel: { fontSize: '12px', color: '#aaa', fontWeight: '600' },
  detailVal: { fontSize: '13px', color: '#333', fontWeight: '500', textAlign: 'right' },
  statusChip: { fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' },
  assignedChip: { minWidth: '28px', textAlign: 'center', fontSize: '12px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px' },
  actions: { display: 'flex', gap: '8px' },
  editBtn: { flex: 1, background: '#e8f4fd', color: '#0891b2', border: 'none', padding: '9px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  deleteBtn: { flex: 1, background: '#fff0f0', color: '#dc2626', border: 'none', padding: '9px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '20px', fontWeight: '800', color: '#1e1e2e', marginBottom: '8px' },
  modalSub: { fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: '1.5' },
  modalActions: { display: 'flex', gap: '12px' },
  modalCancel: { flex: 1, background: '#f5f5f5', color: '#666', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  modalDelete: { flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }
}
