import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import {
  getPendingOutpassesApi,
  getMyStudentsOutpassesApi,
  getNoResponseOutpassesApi
} from '../../api/api'

export default function Warden1Dashboard() {
  const navigate = useNavigate()

  const [pending,     setPending]     = useState([])
  const [allOutpasses,setAllOutpasses]= useState([])
  const [noResponse,  setNoResponse]  = useState([])
  const [activeTab,   setActiveTab]   = useState('pending')
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterStatus,setFilterStatus]= useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [p, a, n] = await Promise.all([
        getPendingOutpassesApi(),
        getMyStudentsOutpassesApi(),
        getNoResponseOutpassesApi()
      ])
      setPending(p.data)
      setAllOutpasses(a.data)
      setNoResponse(n.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = allOutpasses.filter(o => {
    const matchSearch = search === '' ||
      o.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.destination?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'all' || o.status === filterStatus

    return matchSearch && matchStatus
  })

  const tabs = [
    { key: 'pending',    label: 'Pending Review', count: pending.length,    alert: pending.length > 0 },
    { key: 'noresponse', label: 'No Response',    count: noResponse.length, alert: noResponse.length > 0 },
    { key: 'all',        label: 'All Outpasses',  count: allOutpasses.length }
  ]

  const statusOptions = [
    'all', 'pending', 'warden_forwarded', 'approved',
    'rejected', 'cancelled', 'out', 'returned', 'late_return', 'expired'
  ]

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (days > 0)  return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  const renderOutpassCard = (outpass, showAlert = false) => {
    const student = outpass.studentId
    return (
      <div
        key={outpass._id}
        style={{
          ...s.outpassCard,
          borderLeft: showAlert ? '4px solid #ea580c' : '4px solid transparent'
        }}
        onClick={() => navigate(`/warden1/outpass/${outpass._id}`)}
      >
        <div style={s.cardTop}>
          <div style={s.studentInfo}>
            <div style={s.studentAvatar}>
              {student?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3 style={s.studentName}>{student?.name || 'Unknown'}</h3>
              <p style={s.studentMeta}>
                {student?.rollNumber} • {student?.department}
              </p>
            </div>
          </div>
          <div style={s.cardRight}>
            <StatusBadge status={outpass.status} />
            <span style={s.timeAgo}>
              {getTimeAgo(outpass.requestedAt)}
            </span>
          </div>
        </div>

        <div style={s.cardBody}>
          <div style={s.cardDetail}>
            <span style={s.detailLabel}>Destination</span>
            <span style={s.detailVal}>📍 {outpass.destination}</span>
          </div>
          <div style={s.cardDetail}>
            <span style={s.detailLabel}>Reason</span>
            <span style={s.detailVal}>{outpass.reason}</span>
          </div>
          <div style={s.cardDetail}>
            <span style={s.detailLabel}>Dates</span>
            <span style={s.detailVal}>
              {new Date(outpass.fromDate).toDateString()} →{' '}
              {new Date(outpass.toDate).toDateString()}
            </span>
          </div>
        </div>

        {showAlert && (
          <div style={s.noResponseBadge}>
            ⚠️ No parent response — call parents immediately
          </div>
        )}

        <div style={s.cardFooter}>
          <span style={s.viewDetail}>View Details →</span>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Warden Dashboard</h1>
            <p style={s.pageSub}>Review and manage student outpass requests</p>
          </div>

          {/* Summary chips */}
          <div style={s.summaryChips}>
            {[
              { label: 'Pending',     value: pending.length,      color: '#f59e0b' },
              { label: 'No Response', value: noResponse.length,   color: '#ea580c' },
              { label: 'Total',       value: allOutpasses.length, color: '#4f46e5' }
            ].map((chip, i) => (
              <div key={i} style={{ ...s.chip, borderColor: chip.color }}>
                <span style={{ ...s.chipVal, color: chip.color }}>{chip.value}</span>
                <span style={s.chipLabel}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {noResponse.length > 0 && (
          <div style={s.alertBox}>
            <span style={s.alertIcon}>🚨</span>
            <div style={s.alertText}>
              <strong style={s.alertTitle}>
                {noResponse.length} outpass{noResponse.length > 1 ? 'es' : ''} with no parent response!
              </strong>
              <p style={s.alertSub}>
                Parents were contacted over 1 hour ago. Please call them directly.
              </p>
            </div>
            <button
              style={s.alertBtn}
              onClick={() => setActiveTab('noresponse')}
            >
              View Now →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabRow}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              style={{
                ...s.tab,
                background:  activeTab === tab.key ? '#4f46e5'    : '#fff',
                color:       activeTab === tab.key ? '#fff'        : '#666',
                borderColor: activeTab === tab.key ? '#4f46e5'    : '#e0e0e0'
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span style={{
                ...s.tabCount,
                background: activeTab === tab.key
                  ? 'rgba(255,255,255,0.25)'
                  : tab.alert ? '#ea580c' : '#f0f0f0',
                color: activeTab === tab.key
                  ? '#fff'
                  : tab.alert ? '#fff' : '#888'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Filter (all tab only) */}
        {activeTab === 'all' && (
          <div style={s.filterRow}>
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search by name, roll number, destination...'
              style={s.searchInput}
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={s.filterSelect}
            >
              {statusOptions.map(st => (
                <option key={st} value={st}>
                  {st === 'all' ? 'All Status' : st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading outpasses...</p>
          </div>
        ) : (
          <div style={s.outpassList}>

            {/* Pending tab */}
            {activeTab === 'pending' && (
              pending.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={s.emptyIcon}>✅</div>
                  <p style={s.emptyTitle}>All caught up!</p>
                  <p style={s.emptySub}>No pending outpass requests</p>
                </div>
              ) : (
                pending.map(o => renderOutpassCard(o))
              )
            )}

            {/* No response tab */}
            {activeTab === 'noresponse' && (
              noResponse.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={s.emptyIcon}>📭</div>
                  <p style={s.emptyTitle}>No alerts</p>
                  <p style={s.emptySub}>All parents have responded</p>
                </div>
              ) : (
                noResponse.map(o => renderOutpassCard(o, true))
              )
            )}

            {/* All tab */}
            {activeTab === 'all' && (
              filtered.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={s.emptyIcon}>🔍</div>
                  <p style={s.emptyTitle}>No results found</p>
                  <p style={s.emptySub}>Try adjusting your search or filter</p>
                </div>
              ) : (
                filtered.map(o => renderOutpassCard(o))
              )
            )}

          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page:           { background: '#f5f6fa', minHeight: '100vh' },
  container:      { maxWidth: '900px', margin: '0 auto', padding: '28px 20px 60px' },

  pageHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  pageTitle:      { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:        { fontSize: '14px', color: '#888', margin: 0 },

  summaryChips:   { display: 'flex', gap: '10px' },
  chip:           { background: '#fff', border: '1.5px solid', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', minWidth: '80px' },
  chipVal:        { display: 'block', fontSize: '22px', fontWeight: '800', lineHeight: 1 },
  chipLabel:      { display: 'block', fontSize: '11px', color: '#888', marginTop: '4px', fontWeight: '600' },

  alertBox:       { background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  alertIcon:      { fontSize: '28px', flexShrink: 0 },
  alertText:      { flex: 1 },
  alertTitle:     { color: '#ea580c', fontSize: '14px', display: 'block', marginBottom: '2px' },
  alertSub:       { color: '#888', fontSize: '13px', margin: 0 },
  alertBtn:       { background: '#ea580c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', flexShrink: 0 },

  tabRow:         { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tab:            { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: '1.5px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  tabCount:       { padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },

  filterRow:      { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  searchInput:    { flex: 1, minWidth: '200px', padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  filterSelect:   { padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' },

  loadingBox:     { textAlign: 'center', padding: '60px' },
  spinner:        { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:    { color: '#888', fontSize: '14px' },

  outpassList:    { display: 'flex', flexDirection: 'column', gap: '12px' },

  outpassCard:    { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' },
  cardTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' },
  studentInfo:    { display: 'flex', alignItems: 'center', gap: '12px' },
  studentAvatar:  { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '18px', flexShrink: 0 },
  studentName:    { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 3px' },
  studentMeta:    { fontSize: '12px', color: '#888', margin: 0 },
  cardRight:      { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  timeAgo:        { fontSize: '11px', color: '#aaa' },

  cardBody:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: '14px 0', borderTop: '1px solid #f8f8f8', borderBottom: '1px solid #f8f8f8', marginBottom: '12px' },
  cardDetail:     { display: 'flex', flexDirection: 'column', gap: '3px' },
  detailLabel:    { fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  detailVal:      { fontSize: '13px', color: '#333', fontWeight: '500' },

  noResponseBadge:{ background: '#fff8f0', border: '1px solid #fed7aa', color: '#ea580c', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '12px' },

  cardFooter:     { display: 'flex', justifyContent: 'flex-end' },
  viewDetail:     { fontSize: '13px', color: '#4f46e5', fontWeight: '600' },

  emptyBox:       { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:      { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:     { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:       { fontSize: '14px', color: '#888' }
}