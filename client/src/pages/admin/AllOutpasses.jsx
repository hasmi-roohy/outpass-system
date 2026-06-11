import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { getAllOutpassesApi } from '../../api/api'

export default function AllOutpasses() {
  const [outpasses,    setOutpasses]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)

  useEffect(() => { fetchOutpasses() }, [])

  const fetchOutpasses = async () => {
    try {
      const res = await getAllOutpassesApi()
      setOutpasses(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    'all', 'pending', 'warden_forwarded', 'approved',
    'rejected', 'cancelled', 'out', 'returned', 'late_return', 'expired'
  ]

  const filtered = outpasses.filter(o => {
    const matchSearch = search === '' ||
      o.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.destination?.toLowerCase().includes(search.toLowerCase()) ||
      o.reason?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'all' || o.status === filterStatus

    return matchSearch && matchStatus
  })

  // Stats
  const stats = {
    total:      outpasses.length,
    pending:    outpasses.filter(o => o.status === 'pending').length,
    approved:   outpasses.filter(o => o.status === 'approved').length,
    out:        outpasses.filter(o => o.status === 'out').length,
    lateReturn: outpasses.filter(o => o.status === 'late_return').length,
    returned:   outpasses.filter(o => o.status === 'returned').length
  }

  const getTimeAgo = (date) => {
    const diff  = Date.now() - new Date(date).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (days > 0)  return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>All Outpasses</h1>
            <p style={s.pageSub}>{outpasses.length} total requests</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            { label: 'Total',       value: stats.total,      color: '#4f46e5', bg: '#f0f0ff' },
            { label: 'Pending',     value: stats.pending,    color: '#f59e0b', bg: '#fff8e1' },
            { label: 'Approved',    value: stats.approved,   color: '#16a34a', bg: '#f0fff4' },
            { label: 'Out',         value: stats.out,        color: '#9333ea', bg: '#fdf4ff' },
            { label: 'Late Return', value: stats.lateReturn, color: '#ea580c', bg: '#fff8f0' },
            { label: 'Returned',    value: stats.returned,   color: '#0891b2', bg: '#e8f4fd' }
          ].map((stat, i) => (
            <div
              key={i}
              style={{ ...s.statChip, background: stat.bg, borderColor: stat.color + '30' }}
              onClick={() => setFilterStatus(
                stat.label.toLowerCase().replace(' ', '_') === 'total'
                  ? 'all'
                  : stat.label.toLowerCase().replace(' ', '_')
              )}
            >
              <span style={{ ...s.statVal, color: stat.color }}>{stat.value}</span>
              <span style={{ ...s.statLabel, color: stat.color }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={s.toolbar}>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by student name, roll number, destination...'
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

        {search || filterStatus !== 'all' ? (
          <p style={s.resultCount}>
            Showing {filtered.length} of {outpasses.length} outpasses
          </p>
        ) : null}

        {/* Content */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading outpasses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📋</div>
            <p style={s.emptyTitle}>No outpasses found</p>
            <p style={s.emptySub}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(outpass => {
              const isExpanded = expandedId === outpass._id
              const student    = outpass.studentId

              return (
                <div key={outpass._id} style={s.card}>

                  {/* Card header */}
                  <div
                    style={s.cardHeader}
                    onClick={() => setExpandedId(isExpanded ? null : outpass._id)}
                  >
                    <div style={s.cardLeft}>
                      <div style={s.studentRow}>
                        <div style={s.avatar}>
                          {student?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={s.studentName}>{student?.name}</h3>
                          <p style={s.studentMeta}>
                            {student?.rollNumber} • {student?.department}
                          </p>
                        </div>
                      </div>
                      <div style={s.outpassInfo}>
                        <span style={s.destination}>📍 {outpass.destination}</span>
                        <span style={s.separator}>•</span>
                        <span style={s.reason}>{outpass.reason}</span>
                      </div>
                    </div>
                    <div style={s.cardRight}>
                      <StatusBadge status={outpass.status} />
                      <span style={s.timeAgo}>{getTimeAgo(outpass.requestedAt)}</span>
                      <span style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={s.datesRow}>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>From</span>
                      <span style={s.dateVal}>{new Date(outpass.fromDate).toDateString()}</span>
                    </div>
                    <span style={s.dateArrow}>→</span>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>To</span>
                      <span style={s.dateVal}>{new Date(outpass.toDate).toDateString()}</span>
                    </div>
                    <div style={{ ...s.dateItem, marginLeft: 'auto' }}>
                      <span style={s.dateLabel}>Warden</span>
                      <span style={s.dateVal}>{outpass.warden1Id?.name || '—'}</span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={s.expanded}>

                      {/* Parent responses */}
                      {outpass.parentTokens?.length > 0 && (
                        <div style={s.section}>
                          <h4 style={s.sectionTitle}>👨‍👩‍👧 Parent Responses</h4>
                          <div style={s.parentGrid}>
                            {outpass.parentTokens.map((p, i) => (
                              <div key={i} style={{
                                ...s.parentChip,
                                background: p.status === 'approved' ? '#f0fff4'
                                  : p.status === 'rejected' ? '#fff0f0'
                                  : '#f8f9ff',
                                borderColor: p.status === 'approved' ? '#86efac'
                                  : p.status === 'rejected' ? '#fca5a5'
                                  : '#e0e0f0'
                              }}>
                                <span style={s.parentName}>{p.name}</span>
                                <span style={s.parentRelation}>({p.relation})</span>
                                <span style={{
                                  ...s.parentStatus,
                                  color: p.status === 'approved' ? '#16a34a'
                                    : p.status === 'rejected' ? '#dc2626'
                                    : '#888'
                                }}>
                                  {p.status}
                                </span>
                                {p.rejectionReason && (
                                  <span style={s.parentReason}>"{p.rejectionReason}"</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gate scans */}
                      {(outpass.exitScan?.time || outpass.returnScan?.time) && (
                        <div style={s.section}>
                          <h4 style={s.sectionTitle}>🚪 Gate Scans</h4>
                          <div style={s.scansRow}>
                            {outpass.exitScan?.time && (
                              <div style={s.scanChip}>
                                <span style={s.scanType}>Exit</span>
                                <span style={{
                                  ...s.scanResult,
                                  color: outpass.exitScan.matched ? '#16a34a' : '#dc2626'
                                }}>
                                  {outpass.exitScan.matched ? '✅ Matched' : '❌ No match'}
                                </span>
                                <span style={s.scanTime}>
                                  {new Date(outpass.exitScan.time).toLocaleString()}
                                </span>
                                {outpass.exitScan.confidence && (
                                  <span style={s.scanConf}>
                                    {outpass.exitScan.confidence}% confidence
                                  </span>
                                )}
                              </div>
                            )}
                            {outpass.returnScan?.time && (
                              <div style={s.scanChip}>
                                <span style={s.scanType}>Return</span>
                                <span style={{
                                  ...s.scanResult,
                                  color: outpass.returnScan.matched ? '#16a34a' : '#dc2626'
                                }}>
                                  {outpass.returnScan.matched ? '✅ Matched' : '❌ No match'}
                                </span>
                                <span style={s.scanTime}>
                                  {new Date(outpass.returnScan.time).toLocaleString()}
                                </span>
                                {outpass.returnScan.confidence && (
                                  <span style={s.scanConf}>
                                    {outpass.returnScan.confidence}% confidence
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Warden note */}
                      {outpass.wardenNote && (
                        <div style={s.noteBox}>
                          <span style={s.noteLabel}>📝 Warden note:</span>
                          <span style={s.noteText}>{outpass.wardenNote}</span>
                        </div>
                      )}

                      {/* Expiry */}
                      <div style={s.expiryRow}>
                        <span style={s.expiryLabel}>Expires:</span>
                        <span style={{
                          ...s.expiryVal,
                          color: new Date() > new Date(outpass.expiresAt)
                            ? '#dc2626' : '#16a34a'
                        }}>
                          {new Date(outpass.expiresAt).toLocaleString()}
                        </span>
                      </div>

                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page:          { background: '#f5f6fa', minHeight: '100vh' },
  container:     { maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 60px' },

  pageHeader:    { marginBottom: '24px' },
  pageTitle:     { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:       { fontSize: '14px', color: '#888', margin: 0 },

  statsRow:      { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  statChip:      { flex: 1, minWidth: '100px', border: '1.5px solid', borderRadius: '12px', padding: '14px 16px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s' },
  statVal:       { display: 'block', fontSize: '26px', fontWeight: '800', lineHeight: 1, marginBottom: '4px' },
  statLabel:     { display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },

  toolbar:       { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput:   { flex: 1, minWidth: '240px', padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  filterSelect:  { padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer', minWidth: '160px' },
  resultCount:   { fontSize: '13px', color: '#888', marginBottom: '12px' },

  loadingBox:    { textAlign: 'center', padding: '60px' },
  spinner:       { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:   { color: '#888', fontSize: '14px' },

  emptyBox:      { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:     { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:    { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:      { fontSize: '14px', color: '#888' },

  list:          { display: 'flex', flexDirection: 'column', gap: '12px' },

  card:          { background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader:    { padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '16px' },
  cardLeft:      { flex: 1 },
  studentRow:    { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  avatar:        { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 },
  studentName:   { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 2px' },
  studentMeta:   { fontSize: '12px', color: '#888', margin: 0 },
  outpassInfo:   { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  destination:   { fontSize: '13px', fontWeight: '600', color: '#4f46e5' },
  separator:     { color: '#ddd' },
  reason:        { fontSize: '13px', color: '#888' },
  cardRight:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  timeAgo:       { fontSize: '11px', color: '#aaa' },
  expandIcon:    { fontSize: '12px', color: '#aaa' },

  datesRow:      { display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', flexWrap: 'wrap' },
  dateItem:      { display: 'flex', flexDirection: 'column', gap: '2px' },
  dateLabel:     { fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateVal:       { fontSize: '13px', color: '#333', fontWeight: '500' },
  dateArrow:     { color: '#ddd', fontSize: '16px' },

  expanded:      { padding: '16px 20px 20px', borderTop: '1px solid #f8f8f8' },

  section:       { marginBottom: '16px' },
  sectionTitle:  { fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },

  parentGrid:    { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  parentChip:    { border: '1px solid', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '140px' },
  parentName:    { fontSize: '13px', fontWeight: '600', color: '#333' },
  parentRelation:{ fontSize: '11px', color: '#888' },
  parentStatus:  { fontSize: '12px', fontWeight: '700', marginTop: '4px', textTransform: 'capitalize' },
  parentReason:  { fontSize: '11px', color: '#dc2626', fontStyle: 'italic' },

  scansRow:      { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  scanChip:      { background: '#f8f9ff', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '180px' },
  scanType:      { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  scanResult:    { fontSize: '14px', fontWeight: '700' },
  scanTime:      { fontSize: '12px', color: '#888' },
  scanConf:      { fontSize: '12px', color: '#4f46e5', fontWeight: '600' },

  noteBox:       { background: '#f8f9ff', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' },
  noteLabel:     { fontSize: '13px', fontWeight: '600', color: '#4f46e5', flexShrink: 0 },
  noteText:      { fontSize: '13px', color: '#555' },

  expiryRow:     { display: 'flex', gap: '10px', alignItems: 'center' },
  expiryLabel:   { fontSize: '12px', color: '#888', fontWeight: '600' },
  expiryVal:     { fontSize: '13px', fontWeight: '700' }
}