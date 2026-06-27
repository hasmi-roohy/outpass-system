import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = {
    student: [
      { label: 'Dashboard', path: '/student' },
      { label: 'Apply', path: '/student/apply' },
      { label: 'My Outpasses', path: '/student/my-outpasses' }
    ],
    warden1: [
      { label: 'Dashboard', path: '/warden1' }
    ],
    warden2: [
      { label: 'Gate Scanner', path: '/warden2' }
    ],
    admin: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Students', path: '/admin/students' },
      { label: 'Warden 1s', path: '/admin/warden1s' },
      { label: 'Warden 2s', path: '/admin/warden2s' },
      { label: 'Outpasses', path: '/admin/outpasses' },
      { label: 'Scan Logs', path: '/admin/scanlogs' }
    ]
  }

  const roleColors = {
    student: '#2563eb',
    warden1: '#0891b2',
    warden2: '#0f9f6e',
    admin: '#dc2626'
  }

  const roleLabels = {
    student: 'Student',
    warden1: 'Warden 1',
    warden2: 'Warden 2',
    admin: 'Admin'
  }

  const links = navLinks[user?.role] || []
  const color = roleColors[user?.role] || '#2563eb'
  const roleLabel = roleLabels[user?.role] || 'User'
  const homePath = links[0]?.path || '/'
  const initials = (user?.name || roleLabel || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <button style={s.brand} onClick={() => navigate(homePath)} aria-label='Go to dashboard'>
          <span style={{ ...s.brandMark, background: color }}>OMS</span>
          <span style={s.brandText}>
            <strong style={s.brandName}>Outpass Management System</strong>
          </span>
        </button>

        <div style={s.links} aria-label='Primary navigation'>
          {links.map(link => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                style={{
                  ...s.link,
                  color: active ? color : '#475569',
                  background: active ? `${color}14` : 'transparent',
                  borderColor: active ? `${color}33` : 'transparent'
                }}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            )
          })}
        </div>

        <div style={s.right}>
          <div style={s.userInfo}>
            <span style={{ ...s.avatar, background: color }}>{initials}</span>
            <span style={s.userText}>
              <span style={s.userName}>{user?.name || 'User'}</span>
              <span style={{ ...s.roleTag, color, background: `${color}12` }}>{roleLabel}</span>
            </span>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </nav>
  )
}

const s = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid #e3e8f0',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
  },
  inner: {
    maxWidth: '1240px',
    minHeight: '68px',
    margin: '0 auto',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap'
  },
  brand: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    flexShrink: 0
  },
  brandMark: {
    width: '44px',
    height: '40px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: 0
  },
  brandText: { display: 'flex', alignItems: 'center', lineHeight: 1.1 },
  brandName: { fontSize: '16px', color: '#0f172a' },
  links: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflowX: 'auto',
    padding: '4px 0'
  },
  link: {
    border: '1px solid transparent',
    borderRadius: '8px',
    padding: '9px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 800,
    whiteSpace: 'nowrap'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    marginLeft: 'auto'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '5px 8px',
    borderRadius: '10px',
    background: '#f8fafc',
    border: '1px solid #e3e8f0'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 900
  },
  userText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  userName: { maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 800, color: '#172033' },
  roleTag: { width: 'fit-content', borderRadius: '999px', padding: '2px 7px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' },
  logoutBtn: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 800,
    whiteSpace: 'nowrap'
  }
}
