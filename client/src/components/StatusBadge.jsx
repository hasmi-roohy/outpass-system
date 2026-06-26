export default function StatusBadge({ status }) {
  const config = {
    pending: { label: 'Pending', bg: '#fffbeb', color: '#b45309', dot: '#d97706', border: '#fde68a' },
    warden_forwarded: { label: 'Awaiting Parents', bg: '#ecfeff', color: '#0e7490', dot: '#0891b2', border: '#a5f3fc' },
    approved: { label: 'Approved', bg: '#ecfdf5', color: '#047857', dot: '#0f9f6e', border: '#bbf7d0' },
    rejected: { label: 'Rejected', bg: '#fef2f2', color: '#b91c1c', dot: '#dc2626', border: '#fecaca' },
    cancelled: { label: 'Cancelled', bg: '#f8fafc', color: '#64748b', dot: '#94a3b8', border: '#e2e8f0' },
    out: { label: 'Out of Campus', bg: '#f5f3ff', color: '#6d28d9', dot: '#7c3aed', border: '#ddd6fe' },
    returned: { label: 'Returned', bg: '#ecfdf5', color: '#047857', dot: '#0f9f6e', border: '#bbf7d0' },
    late_return: { label: 'Late Return', bg: '#fff7ed', color: '#c2410c', dot: '#ea580c', border: '#fed7aa' },
    expired: { label: 'Expired', bg: '#f1f5f9', color: '#475569', dot: '#64748b', border: '#cbd5e1' }
  }

  const cfg = config[status] || {
    label: status || 'Unknown',
    bg: '#f8fafc',
    color: '#64748b',
    dot: '#94a3b8',
    border: '#e2e8f0'
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '5px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0
      }} />
      {cfg.label}
    </span>
  )
}
