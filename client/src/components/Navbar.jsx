import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = {
    student: [
      { label: 'Dashboard',   path: '/student' },
      { label: 'Apply',       path: '/student/apply' },
      { label: 'My Outpasses',path: '/student/my-outpasses' }
    ],
    warden1: [
      { label: 'Dashboard',   path: '/warden1' }
    ],
    warden2: [
      { label: 'Gate Scanner',path: '/warden2' }
    ],
    admin: [
      { label: 'Dashboard',   path: '/admin' },
      { label: 'Students',    path: '/admin/students' },
      { label: 'Warden 1s',   path: '/admin/warden1s' },
      { label: 'Warden 2s',   path: '/admin/warden2s' },
      { label: 'Outpasses',   path: '/admin/outpasses' },
      { label: 'Scan Logs',   path: '/admin/scanlogs' }
    ]
  }

  const roleColors = {
    student: '#4f46e5',
    warden1: '#0891b2',
    warden2: '#059669',
    admin:   '#dc2626'
  }

  const roleLabels = {
    student: 'Student',
    warden1: 'Warden 1',
    warden2: 'Warden 2',
    admin:   'Admin'
  }

  const links  = navLinks[user?.role] || []
  const color  = roleColors[user?.role] || '#4f46e5'
  const roleLabel = roleLabels[user?.role] || ''

  return (
    <nav style={s.nav}>
      <div style={s.inner}>

        {/* Brand */}
        <div style={s.brand} onClick={() => navigate(links[0]?.path || '/')}>
          <div style={{ ...s.brandIcon, background: color }}>🎓</div>
          <span style={s.brandName}>OutpassMS</span>
        </div>

        {/* Links */}
        <div style={s.links}>
          {links.map(link => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                style={{
                  ...s.link,
                  color:      active ? color      : '#666',
                  background: active ? `${color}12` : 'transparent',
                  fontWeight: active ? '700'      : '500',
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent'
                }}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            )
          })}
        </div>

        {/* User info + logout */}
        <div style={s.right}>
          <div style={s.userInfo}>
            <div style={{ ...s.avatar, background: color }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={s.userText}>
              <span style={s.userName}>{user?.name}</span>
              <span style={{ ...s.roleTag, background: `${color}18`, color }}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>

      </div>
    </nav>
  )
}

const s = {
  nav:      { background: '#fff', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 },
  inner:    { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '24px' },

  brand:    { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 },
  brandIcon:{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  brandName:{ fontSize: '18px', fontWeight: '800', color: '#1e1e2e' },

  links:    { display: 'flex', alignItems: 'center', gap: '4px', flex: 1 },
  link:     { padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s', background: 'transparent' },

  right:    { display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:   { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '15px', flexShrink: 0 },
  userText: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#1e1e2e', lineHeight: 1 },
  roleTag:  { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', lineHeight: 1 },

  logoutBtn:{ background: '#f5f5f5', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
}