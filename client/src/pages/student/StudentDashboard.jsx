import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import ChatWindow from '../../components/ChatWindow'
import { getMyOutpassesApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const [outpasses,  setOutpasses]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('active')

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

  const activeStatuses   = ['pending', 'warden_forwarded', 'approved', 'out', 'late_return']
  const inactiveStatuses = ['returned', 'rejected', 'cancelled', 'expired']

  const activeOutpasses   = outpasses.filter(o => activeStatuses.includes(o.status))
  const historyOutpasses  = outpasses.filter(o => inactiveStatuses.includes(o.status))

  const hasActiveOutpass  = activeOutpasses.length > 0

  // Monthly count
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyCount = outpasses.filter(
    o => new Date(o.requestedAt) >= startOfMonth
  ).length

  const getStatusMessage = (status) => {
    const messages = {
      pending:          '⏳ Waiting for warden review',
      warden_forwarded: '📧 Sent to parents for approval',
      approved:         '✅ Approved — report to gate',
      out:              '🏃 You are currently out of campus',
      late_return:      '⚠️ You are overdue — return immediately!'
    }
    return messages[status] || ''
  }

  const displayed = activeTab === 'active' ? activeOutpasses : historyOutpasses

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>

        {/* Welcome header */}
        <div style={s.welcomeCard}>
          <div style={s.welcomeLeft}>
            <div style={s.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={s.welcomeTitle}>
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p style={s.welcomeSub}>
                {user?.rollNumber && `${user.rollNumber} • `}
                {user?.department && `${user.department} • `}
                {user?.year && `Year ${user.year}`}
              </p>
            </div>
          </div>
          <div style={s.welcomeStats}>
            <div style={s.miniStat}>
              <span style={s.miniStatVal}>{monthlyCount}</span>
              <span style={s.miniStatLabel}>This month</span>
            </div>
            <div style={s.miniDivider} />
            <div style={s.miniStat}>
              <span style={{ ...s.miniStatVal, color: monthlyCount >= 2 ? '#dc2626' : '#16a34a' }}>
                {2 - monthlyCount}
              </span>
              <span style={s.miniStatLabel}>Remaining</span>
            </div>
          </div>
        </div>

        {/* Active outpass alert */}
        {activeOutpasses.length > 0 && (
          <div style={{
            ...s.activeAlert,
            background: activeOutpasses[0].status === 'late_return'
              ? '#fff8f0' : activeOutpasses[0].status === 'approved'
              ? '#f0fff4' : '#f8f9ff',
            borderColor: activeOutpasses[0].status === 'late_return'
              ? '#fed7aa' : activeOutpasses[0].status === 'approved'
              ? '#86efac' : '#c7d2fe'
          }}>
            <div style={s.activeAlertLeft}>
              <StatusBadge status={activeOutpasses[0].status} />
              <p style={s.activeAlertMsg}>
                {getStatusMessage(activeOutpasses[0].status)}
              </p>
              <p style={s.activeAlertDest}>
                📍 {activeOutpasses[0].destination}
              </p>
            </div>
            <button
              style={s.viewBtn}
              onClick={() => navigate('/student/my-outpasses')}
            >
              View →
            </button>
          </div>
        )}

        {/* Apply button */}
        <div style={s.applySection}>
          {!hasActiveOutpass && monthlyCount < 2 ? (
            <button
              style={s.applyBtn}
              onClick={() => navigate('/student/apply')}
            >
              ➕ Apply for Outpass
            </button>
          ) : (
            <div style={s.applyDisabled}>
              <span style={s.applyDisabledIcon}>
                {hasActiveOutpass ? '🔒' : '📅'}
              </span>
              <div>
                <p style={s.applyDisabledTitle}>
                  {hasActiveOutpass
                    ? 'You have an active outpass'
                    : 'Monthly limit reached'}
                </p>
                <p style={s.applyDisabledSub}>
                  {hasActiveOutpass
                    ? 'Complete your current outpass before applying again'
                    : 'You have used both outpasses for this month'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Outpass list */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>My Outpasses</h2>
            <div style={s.tabs}>
              {[
                { key: 'active',  label: `Active (${activeOutpasses.length})` },
                { key: 'history', label: `History (${historyOutpasses.length})` }
              ].map(tab => (
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
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              <p style={s.loadingText}>Loading outpasses...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={s.emptyBox}>
              <div style={s.emptyIcon}>
                {activeTab === 'active' ? '📭' : '📂'}
              </div>
              <p style={s.emptyTitle}>
                {activeTab === 'active'
                  ? 'No active outpasses'
                  : 'No outpass history'}
              </p>
              <p style={s.emptySub}>
                {activeTab === 'active'
                  ? 'Apply for an outpass to get started'
                  : 'Your completed outpasses will appear here'}
              </p>
            </div>
          ) : (
            <div style={s.outpassList}>
              {displayed.map(outpass => (
                <div key={outpass._id} style={s.outpassCard}>

                  <div style={s.outpassTop}>
                    <div style={s.outpassLeft}>
                      <h3 style={s.outpassDest}>📍 {outpass.destination}</h3>
                      <p style={s.outpassReason}>{outpass.reason}</p>
                    </div>
                    <StatusBadge status={outpass.status} />
                  </div>

                  <div style={s.outpassDates}>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>From</span>
                      <span style={s.dateVal}>
                        {new Date(outpass.fromDate).toDateString()}
                      </span>
                    </div>
                    <div style={s.dateDivider}>→</div>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>To</span>
                      <span style={s.dateVal}>
                        {new Date(outpass.toDate).toDateString()}
                      </span>
                    </div>
                    <div style={s.dateItem}>
                      <span style={s.dateLabel}>Applied</span>
                      <span style={s.dateVal}>
                        {new Date(outpass.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {outpass.wardenNote && (
                    <div style={s.wardenNote}>
                      💬 <strong>Warden note:</strong> {outpass.wardenNote}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Chatbot */}
      <ChatWindow />
    </div>
  )
}

const s = {
  page:              { background: '#f5f6fa', minHeight: '100vh' },
  container:         { maxWidth: '800px', margin: '0 auto', padding: '28px 20px 80px' },

  welcomeCard:       { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '16px', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  welcomeLeft:       { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar:            { width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: '800', flexShrink: 0 },
  welcomeTitle:      { fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 4px' },
  welcomeSub:        { fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 },
  welcomeStats:      { display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px' },
  miniStat:          { textAlign: 'center' },
  miniStatVal:       { display: 'block', fontSize: '28px', fontWeight: '800', color: '#fff', lineHeight: 1 },
  miniStatLabel:     { display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' },
  miniDivider:       { width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' },

  activeAlert:       { border: '1px solid', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  activeAlertLeft:   { flex: 1 },
  activeAlertMsg:    { fontSize: '14px', color: '#555', margin: '8px 0 4px' },
  activeAlertDest:   { fontSize: '13px', color: '#888', margin: 0 },
  viewBtn:           { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', flexShrink: 0 },

  applySection:      { marginBottom: '28px' },
  applyBtn:          { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  applyDisabled:     { background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' },
  applyDisabledIcon: { fontSize: '28px', flexShrink: 0 },
  applyDisabledTitle:{ fontSize: '15px', fontWeight: '600', color: '#333', margin: '0 0 4px' },
  applyDisabledSub:  { fontSize: '13px', color: '#888', margin: 0 },

  section:           { },
  sectionHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle:      { fontSize: '17px', fontWeight: '700', color: '#1e1e2e', margin: 0 },
  tabs:              { display: 'flex', gap: '8px' },
  tab:               { padding: '6px 16px', border: '1.5px solid', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },

  loadingBox:        { textAlign: 'center', padding: '60px 20px' },
  spinner:           { width: '36px', height: '36px', border: '3px solid #e0e0e0', borderTop: '3px solid #4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' },
  loadingText:       { color: '#888', fontSize: '14px' },

  emptyBox:          { background: '#fff', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f0f0f0' },
  emptyIcon:         { fontSize: '48px', marginBottom: '16px' },
  emptyTitle:        { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '8px' },
  emptySub:          { fontSize: '14px', color: '#888' },

  outpassList:       { display: 'flex', flexDirection: 'column', gap: '12px' },
  outpassCard:       { background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  outpassTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' },
  outpassLeft:       { flex: 1 },
  outpassDest:       { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', margin: '0 0 4px' },
  outpassReason:     { fontSize: '13px', color: '#888', margin: 0 },
  outpassDates:      { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  dateItem:          { display: 'flex', flexDirection: 'column', gap: '2px' },
  dateLabel:         { fontSize: '11px', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateVal:           { fontSize: '13px', color: '#333', fontWeight: '500' },
  dateDivider:       { color: '#ccc', fontSize: '16px' },
  wardenNote:        { marginTop: '12px', background: '#f8f9ff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#555' }
}