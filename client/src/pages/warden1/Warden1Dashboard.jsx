import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import {
  getMyStudentsOutpassesApi,
  getNoResponseOutpassesApi,
  getPendingOutpassesApi
} from '../../api/api'
import {
  Alert,
  AppPage,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  Tabs,
  TextInput,
  Toolbar
} from '../../components/ui/UI'

export default function Warden1Dashboard() {
  const navigate = useNavigate()

  const [pending, setPending] = useState([])
  const [allOutpasses, setAllOutpasses] = useState([])
  const [noResponse, setNoResponse] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [allPage, setAllPage] = useState(1)
  const [allPagination, setAllPagination] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [p, a, n] = await Promise.all([
        getPendingOutpassesApi(),
        getMyStudentsOutpassesApi({
          page: allPage,
          limit: 20,
          search,
          status: filterStatus
        }),
        getNoResponseOutpassesApi()
      ])
      setPending(p.data)
      setAllOutpasses(a.data.items || a.data)
      setAllPagination(a.data.pagination || null)
      setNoResponse(n.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }, [allPage, search, filterStatus])

  useEffect(() => { fetchAll() }, [fetchAll])

  const tabs = [
    { key: 'pending', label: 'Pending Review', count: pending.length, alert: pending.length > 0 },
    { key: 'noresponse', label: 'No Response', count: noResponse.length, alert: noResponse.length > 0 },
    { key: 'all', label: 'All Outpasses', count: allPagination?.total ?? allOutpasses.length }
  ]

  const statusOptions = [
    'all', 'pending', 'warden_forwarded', 'approved',
    'rejected', 'cancelled', 'out', 'returned', 'late_return', 'expired'
  ]

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  const displayed =
    activeTab === 'pending' ? pending :
    activeTab === 'noresponse' ? noResponse :
    allOutpasses

  return (
    <>
      <Navbar />
      <AppPage maxWidth={920}>
        <PageHeader
          title='Warden Dashboard'
          subtitle='Review outpass requests, parent response alerts, and assigned student history.'
        />

        {noResponse.length > 0 && (
          <Alert
            variant='warning'
            action={<Button variant='warning' size='sm' onClick={() => setActiveTab('noresponse')}>View now</Button>}
          >
            <strong>{noResponse.length} outpass{noResponse.length > 1 ? 'es' : ''} with no parent response</strong>
            Parents were contacted over 1 hour ago. Call them directly or resend the parent email.
          </Alert>
        )}

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'all' && (
          <Toolbar>
            <TextInput
              value={search}
              onChange={event => {
                setAllPage(1)
                setSearch(event.target.value)
              }}
              placeholder='Search by name, roll number, destination...'
              style={{ flex: 1, minWidth: 240 }}
            />
            <Select
              value={filterStatus}
              onChange={event => {
                setAllPage(1)
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
        )}

        {loading ? (
          <LoadingState label='Loading outpasses...' />
        ) : displayed.length === 0 ? (
          <EmptyState
            title={activeTab === 'pending' ? 'All caught up' : activeTab === 'noresponse' ? 'No parent response alerts' : 'No results found'}
            subtitle={activeTab === 'all' ? 'Try changing the search or status filter.' : 'Nothing needs action in this tab.'}
          />
        ) : (
          <div style={s.list}>
            {displayed.map(outpass => (
              <OutpassItem
                key={outpass._id}
                outpass={outpass}
                alert={activeTab === 'noresponse'}
                getTimeAgo={getTimeAgo}
                onClick={() => navigate(`/warden1/outpass/${outpass._id}`)}
              />
            ))}
          </div>
        )}

        {activeTab === 'all' && allPagination && allPagination.totalPages > 1 && (
          <div style={s.pagination}>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setAllPage(allPage - 1)}
              disabled={!allPagination.hasPrevPage}
            >
              Previous
            </Button>
            <span style={s.pageInfo}>Page {allPagination.page} of {allPagination.totalPages}</span>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setAllPage(allPage + 1)}
              disabled={!allPagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </AppPage>
    </>
  )
}

function OutpassItem({ outpass, alert, getTimeAgo, onClick }) {
  const student = outpass.studentId

  return (
    <Card interactive onClick={onClick} style={{ ...s.card, borderLeft: alert ? '4px solid #ea580c' : '4px solid transparent' }}>
      <div style={s.cardTop}>
        <div style={s.studentInfo}>
          <div style={s.studentAvatar}>{student?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <h3 style={s.studentName}>{student?.name || 'Unknown student'}</h3>
            <p style={s.studentMeta}>{[student?.rollNumber, student?.department].filter(Boolean).join(' - ')}</p>
          </div>
        </div>
        <div style={s.cardRight}>
          <StatusBadge status={outpass.status} />
          <span style={s.timeAgo}>{getTimeAgo(outpass.requestedAt)}</span>
        </div>
      </div>

      <div style={s.detailGrid}>
        <Info label='Destination' value={outpass.destination} />
        <Info label='Reason' value={outpass.reason} />
        <Info label='Dates' value={`${new Date(outpass.fromDate).toDateString()} to ${new Date(outpass.toDate).toDateString()}`} />
      </div>

      {alert && (
        <div style={s.noResponse}>
          No parent response. Call parents immediately or resend the approval email.
        </div>
      )}

      <div style={s.footer}>View details</div>
    </Card>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <span style={s.detailLabel}>{label}</span>
      <strong style={s.detailVal}>{value || '-'}</strong>
    </div>
  )
}

const s = {
  list: { display: 'grid', gap: '12px' },
  card: { padding: '18px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' },
  studentInfo: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  studentAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 900,
    flexShrink: 0
  },
  studentName: { margin: '0 0 3px', color: '#172033', fontSize: '15px' },
  studentMeta: { margin: 0, color: '#64748b', fontSize: '12px' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  timeAgo: { color: '#94a3b8', fontSize: '11px', fontWeight: 800 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e3e8f0' },
  detailLabel: { display: 'block', marginBottom: '4px', color: '#64748b', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' },
  detailVal: { display: 'block', color: '#172033', fontSize: '13px', lineHeight: 1.45 },
  noResponse: { marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#fff7ed', color: '#c2410c', fontSize: '13px', fontWeight: 800 },
  footer: { marginTop: '12px', color: '#2563eb', fontSize: '13px', fontWeight: 900, textAlign: 'right' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '18px' },
  pageInfo: { color: '#64748b', fontSize: '13px', fontWeight: 800 }
}
