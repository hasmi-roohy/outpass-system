import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getDashboardStatsApi } from '../../api/api'

export default function AdminDashboard() {
  const navigate      = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await getDashboardStatsApi()
      setStats(res.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = stats ? [
    {
      label:    'Total Students',
      value:    stats.totalStudents,
      icon:     '🎓',
      color:    '#4f46e5',
      bg:       '#f0f0ff',
      path:     '/admin/students'
    },
    {
      label:    'Warden 1s',
      value:    stats.totalWarden1s,
      icon:     '👨‍💼',
      color:    '#0891b2',
      bg:       '#e8f4fd',
      path:     '/admin/warden1s'
    },
    {
      label:    'Warden 2s',
      value:    stats.totalWarden2s,
      icon:     '🚪',
      color:    '#059669',
      bg:       '#f0fff4',
      path:     '/admin/warden2s'
    },
    {
      label:    'Total Outpasses',
      value:    stats.totalOutpasses,
      icon:     '📋',
      color:    '#7c3aed',
      bg:       '#fdf4ff',
      path:     '/admin/outpasses'
    },
    {
      label:    'Pending',
      value:    stats.pending,
      icon:     '⏳',
      color:    '#f59e0b',
      bg:       '#fff8e1',
      path:     '/admin/outpasses'
    },
    {
      label:    'Approved',
      value:    stats.approved,
      icon:     '✅',
      color:    '#16a34a',
      bg:       '#f0fff4',
      path:     '/admin/outpasses'
    },
    {
      label:    'Currently Out',
      value:    stats.currentlyOut,
      icon:     '🏃',
      color:    '#9333ea',
      bg:       '#fdf4ff',
      path:     '/admin/outpasses'
    },
    {
      label:    'Late Returns',
      value:    stats.lateReturns,
      icon:     '⚠️',
      color:    '#ea580c',
      bg:       '#fff8f0',
      path:     '/admin/outpasses'
    },
    {
      label:    'Failed Scans',
      value:    stats.failedScans,
      icon:     '❌',
      color:    '#dc2626',
      bg:       '#fff0f0',
      path:     '/admin/scanlogs'
    }
  ] : []

  const quickActions = [
    { label: 'Add Student',   icon: '➕', path: '/admin/students/add',  color: '#4f46e5' },
    { label: 'Add Warden 1',  icon: '➕', path: '/admin/warden1s/add', color: '#0891b2' },
    { label: 'Add Warden 2',  icon: '➕', path: '/admin/warden2s/add', color: '#059669' },
    { label: 'View Outpasses',icon: '📋', path: '/admin/outpasses',    color: '#7c3aed' },
    { label: 'Scan Logs',     icon: '🔍', path: '/admin/scanlogs',     color: '#dc2626' }
  ]

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Admin Dashboard</h1>
            <p style={s.pageSub}>Overview of the outpass management system</p>
          </div>
          <div style={s.headerDate}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric'
            })}
          </div>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div style={s.loadingGrid}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={s.skeletonCard} />
            ))}
          </div>
        ) : (
          <div style={s.statsGrid}>
            {statCards.map((card, i) => (
              <div
                key={i}
                style={s.statCard}
                onClick={() => navigate(card.path)}
              >
                <div style={{ ...s.statIcon, background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div style={s.statInfo}>
                  <div style={{ ...s.statValue, color: card.color }}>
                    {card.value ?? '—'}
                  </div>
                  <div style={s.statLabel}>{card.label}</div>
                </div>
                <div style={{ ...s.statArrow, color: card.color }}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* Alert if late returns */}
        {stats?.lateReturns > 0 && (
          <div style={s.alertBox}>
            <span style={s.alertIcon}>⚠️</span>
            <div>
              <strong style={s.alertTitle}>
                {stats.lateReturns} student{stats.lateReturns > 1 ? 's' : ''} have not returned on time!
              </strong>
              <p style={s.alertSub}>Check the outpasses section for details.</p>
            </div>
            <button
              style={s.alertBtn}
              onClick={() => navigate('/admin/outpasses')}
            >
              View →
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Quick Actions</h2>
          <div style={s.actionGrid}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                style={{ ...s.actionBtn, borderColor: action.color }}
                onClick={() => navigate(action.path)}
              >
                <span style={{ ...s.actionIcon, color: action.color }}>
                  {action.icon}
                </span>
                <span style={{ ...s.actionLabel, color: action.color }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manage section */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Manage</h2>
          <div style={s.manageGrid}>
            {[
              { title: 'Students',  sub: `${stats?.totalStudents || 0} registered`, icon: '🎓', path: '/admin/students',  color: '#4f46e5' },
              { title: 'Warden 1s', sub: `${stats?.totalWarden1s || 0} active`,     icon: '👨‍💼', path: '/admin/warden1s', color: '#0891b2' },
              { title: 'Warden 2s', sub: `${stats?.totalWarden2s || 0} active`,     icon: '🚪', path: '/admin/warden2s', color: '#059669' },
              { title: 'All Outpasses', sub: `${stats?.totalOutpasses || 0} total`, icon: '📋', path: '/admin/outpasses', color: '#7c3aed' },
              { title: 'Scan Logs',    sub: `${stats?.failedScans || 0} failed`,    icon: '🔍', path: '/admin/scanlogs',  color: '#dc2626' }
            ].map((item, i) => (
              <div
                key={i}
                style={s.manageCard}
                onClick={() => navigate(item.path)}
              >
                <div style={{ ...s.manageIcon, background: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <div style={s.manageInfo}>
                  <div style={s.manageTitle}>{item.title}</div>
                  <div style={s.manageSub}>{item.sub}</div>
                </div>
                <div style={{ ...s.manageArrow, color: item.color }}>›</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  page:          { background: '#f5f6fa', minHeight: '100vh' },
  container:     { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 60px' },

  pageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  pageTitle:     { fontSize: '26px', fontWeight: '800', color: '#1e1e2e', margin: '0 0 4px' },
  pageSub:       { fontSize: '14px', color: '#888', margin: 0 },
  headerDate:    { fontSize: '13px', color: '#aaa', background: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #f0f0f0' },

  loadingGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  skeletonCard:  { height: '100px', background: '#e8e8f0', borderRadius: '12px', animation: 'pulse 1.5s infinite' },

  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard:      { background: '#fff', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'transform 0.15s, box-shadow 0.15s', border: '1px solid #f0f0f0' },
  statIcon:      { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  statInfo:      { flex: 1 },
  statValue:     { fontSize: '28px', fontWeight: '800', lineHeight: 1, marginBottom: '4px' },
  statLabel:     { fontSize: '12px', color: '#888', fontWeight: '500' },
  statArrow:     { fontSize: '24px', fontWeight: '300', flexShrink: 0 },

  alertBox:      { background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' },
  alertIcon:     { fontSize: '24px', flexShrink: 0 },
  alertTitle:    { color: '#ea580c', fontSize: '14px', display: 'block', marginBottom: '2px' },
  alertSub:      { color: '#888', fontSize: '13px', margin: 0 },
  alertBtn:      { marginLeft: 'auto', background: '#ea580c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', flexShrink: 0 },

  section:       { marginBottom: '32px' },
  sectionTitle:  { fontSize: '16px', fontWeight: '700', color: '#1e1e2e', marginBottom: '16px' },

  actionGrid:    { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  actionBtn:     { background: '#fff', border: '1.5px solid', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  actionIcon:    { fontSize: '16px' },
  actionLabel:   { fontSize: '14px', fontWeight: '600' },

  manageGrid:    { display: 'flex', flexDirection: 'column', gap: '10px' },
  manageCard:    { background: '#fff', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', transition: 'transform 0.15s' },
  manageIcon:    { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  manageInfo:    { flex: 1 },
  manageTitle:   { fontSize: '15px', fontWeight: '700', color: '#1e1e2e', marginBottom: '2px' },
  manageSub:     { fontSize: '13px', color: '#888' },
  manageArrow:   { fontSize: '22px', fontWeight: '300', flexShrink: 0 }
}