import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { getAllScanLogsApi } from '../../api/api'

export default function ScanLogs() {
  const [logs,         setLogs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterType,   setFilterType]   = useState('all')
  const [filterMatch,  setFilterMatch]  = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    try {
      const res = await getAllScanLogsApi()
      setLogs(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter(log => {
    const matchSearch = search === '' ||
      log.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase())

    const matchType  = filterType  === 'all' || log.type === filterType
    const matchMatch = filterMatch === 'all'
      ? true
      : filterMatch === 'matched'
      ? log.matched
      : !log.matched

    return matchSearch && matchType && matchMatch
  })

  const stats = {
    total:    logs.length,
    exit:     logs.filter(l => l.type === 'exit').length,
    return:   logs.filter(l => l.type === 'return').length,
    matched:  logs.filter(l => l.matched).length,
    failed:   logs.filter(l => !l.matched).length,
    overrides:logs.filter(l => l.manualOverride).length
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
            <h1 style={s.pageTitle}>Face Scan Logs</h1>
            <p style={s.pageSub}>{logs.length} total scans recorded</p>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total Scans',  value: stats.total,     color: '#4f46e5', bg: '#f0f0ff' },
            { label: 'Exit Scans',   value: stats.exit,      color: '#0891b2', bg: '#e8f4fd' },
            { label: 'Return Scans', value: stats.return,    color: '#9333ea', bg: '#fdf4ff' },
            { label: 'Matched',      value: stats.matched,   color: '#16a34a', bg: '#f0fff4' },
            { label: 'Failed',       value: stats.failed,    color: '#dc2626', bg: '#fff0f0' },
            { label: 'Overrides',    value: stats.overrides, color: '#ea580c', bg: '#fff8f0' }
          ].map((stat, i) => (
            <div key={i} style={{
              ...s.statChip,
              background:  stat.bg,
              borderColor: stat.color + '30'
            }}>
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
            placeholder='Search by student name or roll number...'
            style={s.searchInput}
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={s.filterSelect}
          >
            <option value='all'>All Types</option>
            <option value='exit'>Exit Only</option>
            <option value='return'>Return Only</option>
          </select>
          <select
            value={filterMatch}
            onChange={e => setFilterMatch(e.target.value)}
            style={s.filterSelect}
          >
            <option value='all'>All Results</option>
            <option value='matched'>Matched Only</option>
            <option value='failed'>Failed Only</option>
          </select>
        </div>

        {(search || filterType !== 'all' || filterMatch !== 'all') && (
          <p style={s.resultCount}>
            Showing {filtered.length} of {logs.length} logs
          </p>
        )}

        {/* Logs */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading scan logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🔍</div>
            <p style={s.emptyTitle}>No scan logs found</p>
            <p style={s.emptySub}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(log => {
              const isExpanded = expandedId === log._id
              const student    = log.studentId

              return (
                <div
                  key={log._id}
                  style={{
                    ...s.card,
                    borderLeft: log.manualOverride
                      ? '4px solid #ea580c'
                      : log.matched
                      ? '4px solid #16a34a'
                      : '4px solid #dc2626'
                  }}
                >
                  <div
                    style={s.cardHeader}
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                  >
                    {/* Left */}
                    <div style={s.cardLeft}>
                      <div style={s.studentRow}>
                        <div style={s.avatar}>
                          {student?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={s.studentName}>{student?.name || 'Unknown'}</h3>
                          <p style={s.studentMeta}>
                            {student?.rollNumber} • {student?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div style={s.cardRight}>
                      {/* Scan type badge */}
                      <span style={{
                        ...s.typeBadge,
                        background: log.type === 'exit' ? '#e8f4fd' : '#fdf4ff',
                        color:      log.type === 'exit' ? '#0891b2' : '#9333ea'
                      }}>
                        {log.type === 'exit' ? '🚪 Exit' : '🏠 Return'}
                      </span>

                      {/* Result badge */}
                      {log.manualOverride ? (
                        <span style={s.overrideBadge}>⚠️ Override</span>
                      ) : (
                        <span style={{
                          ...s.resultBadge,
                          background: log.matched ? '#f0fff4' : '#fff0f0',
                          color:      log.matched ? '#16a34a' : '#dc2626'
                        }}>
                          {log.matched ? '✅ Matched' : '❌ Failed'}
                        </span>
                      )}

                      {/* Confidence */}
                      {log.confidence > 0 && (
                        <span style={s.confidence}>
                          {log.confidence}%
                        </span>
                      )}

                      <span style={s.timeAgo}>{getTimeAgo(log.scannedAt)}</span>
                      <span style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div style={s.summaryRow}>
                    <div style={s.summaryItem}>
                      <span style={s.summaryLabel}>Scanned by</span>
                      <span style={s.summaryVal}>
                        {log.scannedBy?.name || 'Unknown'}
                      </span>
                    </div>
                    <div style={s.summaryItem}>
                      <span style={s.summaryLabel}>Date & Time</span>
                      <span style={s.summaryVal}>
                        {new Date(log.scannedAt).toLocaleString()}
                      </span>
                    </div>
                    {log.manualOverride && (
                      <div style={s.summaryItem}>
                        <span style={s.summaryLabel}>Override Note</span>
                        <span style={{ ...s.summaryVal, color: '#ea580c' }}>
                          {log.overrideNote || 'No note'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={s.expanded}>

                      {/* Snapshot */}
                      {log.snapshot && (
                        <div style={s.snapshotSection}>
                          <h4 style={s.sectionTitle}>📸 Scan Snapshot</h4>
                          <img
                            src={log.snapshot}
                            alt='Scan snapshot'
                            style={s.snapshot}
                            onError={e => {
                              e.target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      {/* Details */}
                      <div style={s.detailGrid}>
                        <div style={s.detailItem}>
                          <span style={s.detailLabel}>Outpass ID</span>
                          <span style={s.detailVal}>
                            {log.outpassId?._id || log.outpassId || '—'}
                          </span>
                        </div>
                        <div style={s.detailItem}>
                          <span style={s.detailLabel}>Scan Type</span>
                          <span style={s.detailVal}>{log.type}</span>
                        </div>
                        <div style={s.detailItem}>
                          <span style={s.detailLabel}>Face Match</span>
                          <span style={{
                            ...s.detailVal,
                            color: log.matched ? '#16a34a' : '#dc2626',
                            fontWeight: '700'
                          }}>
                            {log.matched ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div style={s.detailItem}>
                          <span style={s.detailLabel}>Confidence</span>
                          <span style={s.detailVal}>
                            {log.confidence > 0 ? `${log.confidence}%` : 'N/A'}
                          </span>
                        </div>
                        <div style={s.detailItem}>
                          <span style={s.detailLabel}>Manual Override</span>
                          <span style={{
                            ...s.detailVal,
                            color: log.manualOverride ? '#ea580c' : '#16a34a',
                            fontWeight: '600'
                          }}>
                            {log.manualOverride ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {log.manualOverride && (
                          <div style={s.detailItem}>
                            <span style={s.detailLabel}>Override Reason</span>
                            <span style={{ ...s.detailVal, color: '#ea580c' }}>
                              {log.overrideNote || 'No reason given'}
                            </span>
                          </div>
                        )}
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
  statChip:      { flex: 1, minWidth: '100px', border: '1.5px solid', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' },
  statVal:       { display: 'block', fontSize: '26px', fontWeight: '800', lineHeight: 1, marginBottom: '4px' },
  statLabel:     { display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },

  toolbar:       { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput:   { flex: 1, minWidth: '220px', padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  filterSelect:  { padding: '11px 16px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' },
  resultCount:   { fontSize: '13px', color: '#888', marginBottom: '12px' },

  loadingBox:    { textAlign: 'center', padding: '60px' },
  spinner:       { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:   { color: '#888', fontSize: '14px' },

  emptyBox:      { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:     { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:    { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:      { fontSize: '14px', color: '#888' },

  list:          { display: 'flex', flexDirection: 'column', gap: '10px' },

  card:          { background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader:    { padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '16px' },
  cardLeft:      { flex: 1 },
  studentRow:    { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar:        { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 },
  studentName:   { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 2px' },
  studentMeta:   { fontSize: '12px', color: '#888', margin: 0 },

  cardRight:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  typeBadge:     { fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' },
  resultBadge:   { fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' },
  overrideBadge: { fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: '#fff8f0', color: '#ea580c' },
  confidence:    { fontSize: '13px', fontWeight: '700', color: '#4f46e5' },
  timeAgo:       { fontSize: '11px', color: '#aaa' },
  expandIcon:    { fontSize: '12px', color: '#aaa' },

  summaryRow:    { display: 'flex', gap: '24px', padding: '12px 20px', flexWrap: 'wrap' },
  summaryItem:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  summaryLabel:  { fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  summaryVal:    { fontSize: '13px', color: '#333', fontWeight: '500' },

  expanded:      { padding: '16px 20px 20px', borderTop: '1px solid #f8f8f8' },

  snapshotSection:{ marginBottom: '16px' },
  sectionTitle:  { fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  snapshot:      { width: '160px', height: '160px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e0e0e0' },

  detailGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' },
  detailItem:    { background: '#f8f9ff', borderRadius: '8px', padding: '10px 14px' },
  detailLabel:   { display: 'block', fontSize: '11px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  detailVal:     { display: 'block', fontSize: '13px', color: '#333', fontWeight: '500', wordBreak: 'break-all' }
}