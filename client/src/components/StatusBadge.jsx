export default function StatusBadge({ status }) {
  const config = {
    pending:          { label: 'Pending',          bg: '#fff8e1', color: '#f59e0b', dot: '#f59e0b' },
    warden_forwarded: { label: 'Awaiting Parents', bg: '#e8f4fd', color: '#0891b2', dot: '#0891b2' },
    approved:         { label: 'Approved',         bg: '#f0fff4', color: '#16a34a', dot: '#16a34a' },
    rejected:         { label: 'Rejected',         bg: '#fff0f0', color: '#dc2626', dot: '#dc2626' },
    cancelled:        { label: 'Cancelled',        bg: '#f5f5f5', color: '#888',    dot: '#888'    },
    out:              { label: 'Out of Campus',    bg: '#fdf4ff', color: '#9333ea', dot: '#9333ea' },
    returned:         { label: 'Returned',         bg: '#f0fff4', color: '#16a34a', dot: '#16a34a' },
    late_return:      { label: 'Late Return',      bg: '#fff8f0', color: '#ea580c', dot: '#ea580c' },
    expired:          { label: 'Expired',          bg: '#f5f5f5', color: '#888',    dot: '#888'    }
  }

  const cfg = config[status] || { label: status, bg: '#f5f5f5', color: '#888', dot: '#888' }

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '6px',
      background:   cfg.bg,
      color:        cfg.color,
      padding:      '4px 12px',
      borderRadius: '20px',
      fontSize:     '12px',
      fontWeight:   '600',
      whiteSpace:   'nowrap'
    }}>
      <span style={{
        width:        '6px',
        height:       '6px',
        borderRadius: '50%',
        background:   cfg.dot,
        flexShrink:   0
      }} />
      {cfg.label}
    </span>
  )
}