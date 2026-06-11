import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { getMyOutpassesApi } from '../../api/api'

export default function MyOutpasses() {
  const navigate = useNavigate()

  const [outpasses,    setOutpasses]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)

  useEffect(() => { fetchOutpasses() }, [])

  const fetchOutpasses = async () => {
    try {
      const res = await getMyOutpassesApi()
      setOutpasses(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all',     label: 'All' },
    { key: 'active',  label: 'Active' },
    { key: 'history', label: 'History' }
  ]

  const activeStatuses  = ['pending', 'warden_forwarded', 'approved', 'out', 'late_return']
  const historyStatuses = ['returned', 'rejected', 'cancelled', 'expired']

  const filtered = outpasses.filter(o => {
    if (activeTab === 'active')  return activeStatuses.includes(o.status)
    if (activeTab === 'history') return historyStatuses.includes(o.status)
    return true
  })

  const getParentStatus = (outpass) => {
    if (!outpass.parentTokens?.length) return null
    const responded = outpass.parentTokens.find(
      p => p.status === 'approved' || p.status === 'rejected'
    )
    if (responded) return responded
    return null
  }

  const getStatusInfo = (status) => {
    const info = {
      pending:          { msg: 'Waiting for your warden to review',         color: '#f59e0b' },
      warden_forwarded: { msg: 'Sent to parents — waiting for their response', color: '#0891b2' },
      approved:         { msg: 'Approved! Report to gate before it expires', color: '#16a34a' },
      rejected:         { msg: 'Request was rejected',                       color: '#dc2626' },
      cancelled:        { msg: 'Outpass was cancelled',                      color: '#888' },
      out:              { msg: 'You are currently outside campus',           color: '#9333ea' },
      returned:         { msg: 'Successfully returned to campus',            color: '#16a34a' },
      late_return:      { msg: '⚠️ You are overdue — return immediately!',   color: '#ea580c' },
      expired:          { msg: 'Outpass expired without use',                color: '#888' }
    }
    return info[status] || { msg: status, color: '#888' }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <button style={s.backBtn} onClick={() => navigate('/student')}>
            ← Back
          </button>
          <div style={s.headerRow}>
            <div>
              <h1 style={s.pageTitle}>My Outpasses</h1>
              <p style={s.pageSub}>{outpasses.length} total requests</p>
            </div>
            <button
              style={s.applyBtn}
              onClick={() => navigate('/student/apply')}
            >
              ➕ Apply New
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {tabs.map(tab => {
            const count = tab.key === 'all'
              ? outpasses.length
              : tab.key === 'active'
              ? outpasses.filter(o => activeStatuses.includes(o.status)).length
              : outpasses.filter(o => historyStatuses.includes(o.status)).length

            return (
              <button
                key={tab.key}
                style={{
                  ...s.tab,
                  background:  activeTab === tab.key ? '#4f46e5' : '#fff',
                  color:       activeTab === tab.key ? '#fff'    : '#666',
                  borderColor: activeTab === tab.key ? '#4f46e5' : '#e0e0e0'
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span style={{
                  ...s.tabCount,
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#f0f0f0',
                  color:      activeTab === tab.key ? '#fff' : '#888'
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* List */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading your outpasses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>📭</div>
            <p style={s.emptyTitle}>No outpasses found</p>
            <p style={s.emptySub}>
              {activeTab === 'active'
                ? 'You have no active outpass requests'
                : 'No outpass history yet'}
            </p>
            <button
              style={s.emptyBtn}
              onClick={() => navigate('/student/apply')}
            >
              Apply for Outpass
            </button>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(outpass => {
              const isExpanded   = expandedId === outpass._id
              const statusInfo   = getStatusInfo(outpass.status)
              const respondedParent = getParentStatus(outpass)

              return (
                <div key={outpass._id} style={s.card}>

                  {/* Card header */}
                  <div
                    style={s.cardHeader}
                    onClick={() => setExpandedId(isExpanded ? null : outpass._id)}
                  >
                    <div style={s.cardLeft}>
                      <h3 style={s.destination}>📍 {outpass.destination}</h3>
                      <p style={s.reason}>{outpass.reason}</p>
                      <p style={{ ...s.statusMsg, color: statusInfo.color }}>
                        {statusInfo.msg}
                      </p>
                    </div>
                    <div style={s.cardRight}>
                      <StatusBadge status={outpass.status} />
                      <span style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Dates row */}
                  <div style={s.datesRow}>
                    <div style={s.dateChip}>
                      <span style={s.dateChipLabel}>Departure</span>
                      <span style={s.dateChipVal}>
                        {new Date(outpass.fromDate).toDateString()}
                      </span>
                    </div>
                    <span style={s.dateArrow}>→</span>
                    <div style={s.dateChip}>
                      <span style={s.dateChipLabel}>Return</span>
                      <span style={s.dateChipVal}>
                        {new Date(outpass.toDate).toDateString()}
                      </span>
                    </div>
                    <div style={{ ...s.dateChip, marginLeft: 'auto' }}>
                      <span style={s.dateChipLabel}>Applied</span>
                      <span style={s.dateChipVal}>
                        {new Date(outpass.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={s.expanded}>

                      {/* Timeline */}
                      <div style={s.timeline}>
                        <h4 style={s.timelineTitle}>Request Timeline</h4>

                        <div style={s.timelineItem}>
                          <div style={{ ...s.timelineDot, background: '#4f46e5' }} />
                          <div style={s.timelineContent}>
                            <p style={s.timelineLabel}>Applied</p>
                            <p style={s.timelineTime}>
                              {new Date(outpass.requestedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {outpass.wardenNote && (
                          <div style={s.timelineItem}>
                            <div style={{ ...s.timelineDot, background: '#0891b2' }} />
                            <div style={s.timelineContent}>
                              <p style={s.timelineLabel}>Warden Note</p>
                              <p style={s.timelineNote}>{outpass.wardenNote}</p>
                            </div>
                          </div>
                        )}

                        {respondedParent && (
                          <div style={s.timelineItem}>
                            <div style={{
                              ...s.timelineDot,
                              background: respondedParent.status === 'approved'
                                ? '#16a34a' : '#dc2626'
                            }} />
                            <div style={s.timelineContent}>
                              <p style={s.timelineLabel}>
                                {respondedParent.name} ({respondedParent.relation}) —{' '}
                                <span style={{
                                  color: respondedParent.status === 'approved'
                                    ? '#16a34a' : '#dc2626',
                                  fontWeight: '600'
                                }}>
                                  {respondedParent.status}
                                </span>
                              </p>
                              {respondedParent.rejectionReason && (
                                <p style={s.timelineNote}>
                                  Reason: {respondedParent.rejectionReason}
                                </p>
                              )}
                              <p style={s.timelineTime}>
                                {new Date(respondedParent.respondedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {outpass.exitScan?.time && (
                          <div style={s.timelineItem}>
                            <div style={{ ...s.timelineDot, background: '#9333ea' }} />
                            <div style={s.timelineContent}>
                              <p style={s.timelineLabel}>Exit Scan — {outpass.exitScan.matched ? '✅ Matched' : '⚠️ Manual override'}</p>
                              <p style={s.timelineTime}>
                                {new Date(outpass.exitScan.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {outpass.returnScan?.time && (
                          <div style={s.timelineItem}>
                            <div style={{ ...s.timelineDot, background: '#16a34a' }} />
                            <div style={s.timelineContent}>
                              <p style={s.timelineLabel}>Return Scan — {outpass.returnScan.matched ? '✅ Matched' : '⚠️ Manual override'}</p>
                              <p style={s.timelineTime}>
                                {new Date(outpass.returnScan.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expiry */}
                      <div style={s.expiryBox}>
                        <span style={s.expiryLabel}>Expires at</span>
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
  page:           { background: '#f5f6fa', minHeight: '100vh' },
  container:      { maxWidth: '780px', margin: '0 auto', padding: '24px 20px 60px' },

  pageHeader:     { marginBottom: '24px' },
  backBtn:        { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '0 0 12px', display: 'block' },
  headerRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle:      { fontSize: '22px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:        { fontSize: '14px', color: '#888', margin: 0 },
  applyBtn:       { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', flexShrink: 0 },

  tabRow:         { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab:            { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', border: '1.5px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  tabCount:       { padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },

  loadingBox:     { textAlign: 'center', padding: '60px' },
  spinner:        { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:    { color: '#888', fontSize: '14px' },

  emptyBox:       { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:      { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:     { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:       { fontSize: '14px', color: '#888', marginBottom: '20px' },
  emptyBtn:       { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },

  list:           { display: 'flex', flexDirection: 'column', gap: '12px' },

  card:           { background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader:     { padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '12px' },
  cardLeft:       { flex: 1 },
  destination:    { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 4px' },
  reason:         { fontSize: '13px', color: '#888', margin: '0 0 6px' },
  statusMsg:      { fontSize: '13px', fontWeight: '500', margin: 0 },
  cardRight:      { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  expandIcon:     { fontSize: '12px', color: '#aaa' },

  datesRow:       { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', flexWrap: 'wrap' },
  dateChip:       { display: 'flex', flexDirection: 'column', gap: '2px' },
  dateChipLabel:  { fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateChipVal:    { fontSize: '13px', color: '#333', fontWeight: '500' },
  dateArrow:      { color: '#ddd', fontSize: '16px' },

  expanded:       { padding: '0 20px 20px', borderTop: '1px solid #f8f8f8', marginTop: '4px' },

  timeline:       { marginBottom: '16px' },
  timelineTitle:  { fontSize: '13px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', marginTop: '16px' },
  timelineItem:   { display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' },
  timelineDot:    { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
  timelineContent:{ flex: 1 },
  timelineLabel:  { fontSize: '13px', fontWeight: '600', color: '#333', margin: '0 0 2px' },
  timelineNote:   { fontSize: '12px', color: '#888', margin: '2px 0' },
  timelineTime:   { fontSize: '11px', color: '#aaa', margin: 0 },

  expiryBox:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9ff', padding: '10px 14px', borderRadius: '8px' },
  expiryLabel:    { fontSize: '12px', color: '#888', fontWeight: '600' },
  expiryVal:      { fontSize: '13px', fontWeight: '700' }
}