import { useCallback, useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { adminEmergencyApproveApi, getAllOutpassesApi } from '../../api/api'
import {
  Alert,
  AppPage,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  StatCard,
  TextInput,
  Toolbar
} from '../../components/ui/UI'

export default function AllOutpasses() {
  const [outpasses, setOutpasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [actingId, setActingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchOutpasses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAllOutpassesApi({
        page,
        limit: 20,
        search,
        status: filterStatus
      })
      setOutpasses(res.data.items || res.data)
      setPagination(res.data.pagination || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load outpasses')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus])

  useEffect(() => { fetchOutpasses() }, [fetchOutpasses])

  const handleEmergencyApprove = async (outpassId) => {
    const note = window.prompt('Reason for admin emergency approval?')
    if (!note?.trim()) return

    setActingId(outpassId)
    setMessage('')
    setError('')

    try {
      const res = await adminEmergencyApproveApi(outpassId, { note })
      setMessage(res.data.message || 'Outpass approved by admin')
      await fetchOutpasses()
    } catch (err) {
      setError(err.response?.data?.message || 'Emergency approval failed')
    } finally {
      setActingId(null)
    }
  }

  const statusOptions = [
    'all', 'pending', 'warden_forwarded', 'approved',
    'rejected', 'cancelled', 'out', 'returned', 'late_return', 'expired'
  ]

  const stats = {
    total: pagination?.total ?? outpasses.length,
    pending: outpasses.filter(o => o.status === 'pending').length,
    approved: outpasses.filter(o => o.status === 'approved').length,
    out: outpasses.filter(o => o.status === 'out').length,
    lateReturn: outpasses.filter(o => o.status === 'late_return').length,
    returned: outpasses.filter(o => o.status === 'returned').length
  }

  const setStatFilter = (status) => {
    setPage(1)
    setFilterStatus(status)
  }

  return (
    <>
      <Navbar />
      <AppPage>
        <PageHeader
          title='All Outpasses'
          subtitle={`${pagination?.total ?? outpasses.length} total requests across the system.`}
        />

        <div style={s.statsGrid}>
          <StatCard label='Total' value={stats.total} icon='ALL' tone='blue' onClick={() => setStatFilter('all')} />
          <StatCard label='Pending' value={stats.pending} icon='P' tone='orange' onClick={() => setStatFilter('pending')} />
          <StatCard label='Approved' value={stats.approved} icon='A' tone='green' onClick={() => setStatFilter('approved')} />
          <StatCard label='Out' value={stats.out} icon='OUT' tone='purple' onClick={() => setStatFilter('out')} />
          <StatCard label='Late Return' value={stats.lateReturn} icon='!' tone='orange' onClick={() => setStatFilter('late_return')} />
          <StatCard label='Returned' value={stats.returned} icon='R' tone='blue' onClick={() => setStatFilter('returned')} />
        </div>

        <Toolbar>
          <TextInput
            value={search}
            onChange={event => {
              setPage(1)
              setSearch(event.target.value)
            }}
            placeholder='Search by student name, roll number, destination...'
            style={{ flex: 1, minWidth: 260 }}
          />
          <Select
            value={filterStatus}
            onChange={event => {
              setPage(1)
              setFilterStatus(event.target.value)
            }}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </Toolbar>

        {(search || filterStatus !== 'all') && (
          <p style={s.resultCount}>Showing {outpasses.length} of {pagination?.total ?? outpasses.length} outpasses</p>
        )}

        {message && <Alert variant='success'>{message}</Alert>}
        {error && <Alert variant='danger'>{error}</Alert>}

        {loading ? (
          <LoadingState label='Loading outpasses...' />
        ) : outpasses.length === 0 ? (
          <EmptyState title='No outpasses found' subtitle='Try adjusting your search or status filter.' />
        ) : (
          <div style={s.list}>
            {outpasses.map(outpass => (
              <OutpassCard
                key={outpass._id}
                outpass={outpass}
                expanded={expandedId === outpass._id}
                acting={actingId === outpass._id}
                onToggle={() => setExpandedId(expandedId === outpass._id ? null : outpass._id)}
                onEmergencyApprove={() => handleEmergencyApprove(outpass._id)}
              />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div style={s.pagination}>
            <Button variant='secondary' size='sm' onClick={() => setPage(page - 1)} disabled={!pagination.hasPrevPage}>
              Previous
            </Button>
            <span style={s.pageInfo}>Page {pagination.page} of {pagination.totalPages}</span>
            <Button variant='secondary' size='sm' onClick={() => setPage(page + 1)} disabled={!pagination.hasNextPage}>
              Next
            </Button>
          </div>
        )}
      </AppPage>
    </>
  )
}

function OutpassCard({ outpass, expanded, acting, onToggle, onEmergencyApprove }) {
  const student = outpass.studentId
  const canEmergencyApprove = ['pending', 'warden_forwarded'].includes(outpass.status)

  return (
    <Card style={s.card}>
      <button style={s.cardHeader} onClick={onToggle}>
        <div style={s.studentRow}>
          <div style={s.avatar}>{student?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <h3 style={s.studentName}>{student?.name || 'Unknown student'}</h3>
            <p style={s.studentMeta}>{[student?.rollNumber, student?.department].filter(Boolean).join(' - ')}</p>
          </div>
        </div>
        <div style={s.cardRight}>
          <StatusBadge status={outpass.status} />
          <span style={s.expandIcon}>{expanded ? 'Hide' : 'View'}</span>
        </div>
      </button>

      <div style={s.summaryRow}>
        <Info label='Destination' value={outpass.destination} />
        <Info label='Reason' value={outpass.reason} />
        <Info label='From' value={new Date(outpass.fromDate).toDateString()} />
        <Info label='To' value={new Date(outpass.toDate).toDateString()} />
      </div>

      {expanded && (
        <div style={s.expanded}>
          {outpass.parentTokens?.length > 0 && (
            <Section title='Parent Responses'>
              <div style={s.chipGrid}>
                {outpass.parentTokens.map((parent, index) => (
                  <div key={`${parent.email}-${index}`} style={s.infoChip}>
                    <strong>{parent.name}</strong>
                    <span>{parent.relation}</span>
                    <StatusBadge status={parent.status} />
                    {parent.rejectionReason && <p>{parent.rejectionReason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(outpass.exitScan?.time || outpass.returnScan?.time) && (
            <Section title='Gate Scans'>
              <div style={s.chipGrid}>
                {outpass.exitScan?.time && (
                  <ScanChip type='Exit' scan={outpass.exitScan} />
                )}
                {outpass.returnScan?.time && (
                  <ScanChip type='Return' scan={outpass.returnScan} />
                )}
              </div>
            </Section>
          )}

          {outpass.wardenNote && (
            <div style={s.noteBox}>
              <strong>Warden note:</strong> {outpass.wardenNote}
            </div>
          )}

          <div style={s.expiryRow}>
            <Info label='Warden' value={outpass.warden1Id?.name || '-'} />
            <Info label='Expires' value={new Date(outpass.expiresAt).toLocaleString()} />
          </div>

          {canEmergencyApprove && (
            <div style={s.actionRow}>
              <Button variant='danger' size='sm' onClick={onEmergencyApprove} disabled={acting}>
                {acting ? 'Approving...' : 'Admin emergency approve'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Section({ title, children }) {
  return (
    <section style={s.section}>
      <h4 style={s.sectionTitle}>{title}</h4>
      {children}
    </section>
  )
}

function Info({ label, value }) {
  return (
    <div style={s.info}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

function ScanChip({ type, scan }) {
  return (
    <div style={s.infoChip}>
      <strong>{type}</strong>
      <span>{scan.matched ? 'Matched' : 'No match'}</span>
      <span>{new Date(scan.time).toLocaleString()}</span>
      {scan.confidence && <span>{scan.confidence}% confidence</span>}
    </div>
  )
}

const s = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '18px'
  },
  resultCount: { margin: '-6px 0 12px', color: '#64748b', fontSize: '13px', fontWeight: 700 },
  list: { display: 'grid', gap: '12px' },
  card: { overflow: 'hidden' },
  cardHeader: {
    width: '100%',
    padding: '18px',
    border: 'none',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
    cursor: 'pointer',
    textAlign: 'left'
  },
  studentRow: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, flexShrink: 0 },
  studentName: { margin: '0 0 3px', color: '#172033', fontSize: 15 },
  studentMeta: { margin: 0, color: '#64748b', fontSize: 12 },
  cardRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  expandIcon: { color: '#2563eb', fontSize: 13, fontWeight: 900 },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, padding: '0 18px 18px' },
  info: { padding: 11, borderRadius: 8, border: '1px solid #e3e8f0', background: '#f8fafc' },
  expanded: { padding: '16px 18px 18px', borderTop: '1px solid #e3e8f0' },
  section: { marginBottom: 16 },
  sectionTitle: { margin: '0 0 10px', color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  infoChip: { minWidth: 150, padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e3e8f0', display: 'grid', gap: 5 },
  noteBox: { marginBottom: 12, padding: 12, borderRadius: 8, background: '#eff6ff', color: '#334155', fontSize: 13 },
  expiryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 },
  actionRow: { display: 'flex', justifyContent: 'flex-end', marginTop: 14 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18 },
  pageInfo: { color: '#64748b', fontSize: 13, fontWeight: 800 }
}
