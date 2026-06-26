import './UI.css'

export function AppPage({ children, maxWidth = 1100, narrow = false }) {
  return (
    <div className='ui-page'>
      <div className='ui-container' style={{ maxWidth: narrow ? 760 : maxWidth }}>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, meta }) {
  return (
    <div className='ui-page-header'>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(actions || meta) && (
        <div className='ui-page-header-side'>
          {meta && <span className='ui-header-meta'>{meta}</span>}
          {actions}
        </div>
      )}
    </div>
  )
}

export function Card({ children, className = '', interactive = false, style, onClick }) {
  return (
    <div
      className={`ui-card ${interactive ? 'ui-card-interactive' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Alert({ children, variant = 'info', action }) {
  return (
    <div className={`ui-alert ui-alert-${variant}`}>
      <div className='ui-alert-body'>{children}</div>
      {action && <div className='ui-alert-action'>{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, tone = 'blue', icon, onClick }) {
  return (
    <Card interactive={Boolean(onClick)} onClick={onClick} className={`ui-stat-card ui-tone-${tone}`}>
      {icon && <div className='ui-stat-icon'>{icon}</div>}
      <div>
        <div className='ui-stat-value'>{value ?? '-'}</div>
        <div className='ui-stat-label'>{label}</div>
      </div>
    </Card>
  )
}

export function Toolbar({ children }) {
  return <div className='ui-toolbar'>{children}</div>
}

export function TextInput(props) {
  return <input className='ui-input' {...props} />
}

export function Select(props) {
  return <select className='ui-input ui-select' {...props} />
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className='ui-tabs'>
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`ui-tab ${active === tab.key ? 'active' : ''} ${tab.alert ? 'alert' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span>{tab.label}</span>
          {typeof tab.count !== 'undefined' && <span className='ui-tab-count'>{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function LoadingState({ label = 'Loading...' }) {
  return (
    <Card className='ui-state-card'>
      <div className='ui-spinner' />
      <p>{label}</p>
    </Card>
  )
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <Card className='ui-state-card'>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {action && <div className='ui-state-action'>{action}</div>}
    </Card>
  )
}

export function KeyValueGrid({ items }) {
  return (
    <div className='ui-kv-grid'>
      {items.map(item => (
        <div key={item.label} className='ui-kv-item'>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}
