import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import ChatWindow from '../../components/ChatWindow'
import { getMeApi, getMyOutpassesApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import {
  Alert,
  AppPage,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Tabs
} from '../../components/ui/UI'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [outpasses, setOutpasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => { fetchOutpasses() }, [])

  const fetchOutpasses = async () => {
    try {
      const [outpassRes, profileRes] = await Promise.all([
        getMyOutpassesApi({ page: 1, limit: 100 }),
        getMeApi()
      ])
      setOutpasses(outpassRes.data.items || outpassRes.data)
      setProfile(profileRes.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const activeStatuses = ['pending', 'warden_forwarded', 'approved', 'out', 'late_return']
  const inactiveStatuses = ['returned', 'rejected', 'cancelled', 'expired']

  const activeOutpasses = outpasses.filter(o => activeStatuses.includes(o.status))
  const historyOutpasses = outpasses.filter(o => inactiveStatuses.includes(o.status))
  const hasActiveOutpass = activeOutpasses.length > 0
  const monthlyLimit = 6

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const usedStatuses = ['out', 'returned', 'late_return']
  const monthlyCount = outpasses.filter(
    o => usedStatuses.includes(o.status) &&
      o.exitScan?.time &&
      new Date(o.exitScan.time) >= startOfMonth
  ).length

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Waiting for warden review',
      warden_forwarded: 'Sent to parents for approval',
      approved: 'Approved. Report to the gate before expiry.',
      out: 'You are currently out of campus',
      late_return: 'You are overdue. Return immediately.'
    }
    return messages[status] || ''
  }

  const displayed = activeTab === 'active' ? activeOutpasses : historyOutpasses
  const warden1 = profile?.warden1Id
  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <>
      <Navbar />
      <AppPage narrow>
        <Card style={s.welcomeCard}>
          <div style={s.welcomeLeft}>
            <div style={s.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <h1 style={s.welcomeTitle}>Welcome back, {firstName}</h1>
              <p style={s.welcomeSub}>
                {[user?.rollNumber, user?.department, user?.year ? `Year ${user.year}` : null].filter(Boolean).join(' - ')}
              </p>
            </div>
          </div>
          <div style={s.welcomeStats}>
            <div>
              <strong>{monthlyCount}</strong>
              <span>This month</span>
            </div>
            <div>
              <strong style={{ color: monthlyCount >= monthlyLimit ? '#dc2626' : '#0f9f6e' }}>
                {Math.max(monthlyLimit - monthlyCount, 0)}
              </strong>
              <span>Remaining</span>
            </div>
          </div>
        </Card>

        <Card style={s.contactCard}>
          <div>
            <span style={s.eyebrow}>Assigned Warden 1</span>
            {warden1 ? (
              <>
                <h2 style={s.contactName}>{warden1.name}</h2>
                <p style={s.contactMeta}>{warden1.email}</p>
                <p style={s.contactMeta}>{warden1.phone}</p>
              </>
            ) : (
              <>
                <h2 style={s.contactName}>Not assigned</h2>
                <p style={s.contactMeta}>Contact admin before applying for an outpass.</p>
              </>
            )}
          </div>
          {warden1?.phone && (
            <div style={s.contactActions}>
              <Button variant='success' size='sm' onClick={() => window.location.href = `tel:${warden1.phone}`}>Call</Button>
              {warden1.email && (
                <Button variant='secondary' size='sm' onClick={() => window.location.href = `mailto:${warden1.email}`}>Email</Button>
              )}
            </div>
          )}
        </Card>

        {activeOutpasses.length > 0 && (
          <Alert
            variant={activeOutpasses[0].status === 'late_return' ? 'danger' : activeOutpasses[0].status === 'approved' ? 'success' : 'info'}
            action={<Button size='sm' onClick={() => navigate('/student/my-outpasses')}>View</Button>}
          >
            <StatusBadge status={activeOutpasses[0].status} />
            <div style={{ marginTop: 8 }}>
              <strong>{getStatusMessage(activeOutpasses[0].status)}</strong>
              Destination: {activeOutpasses[0].destination}
            </div>
          </Alert>
        )}

        <div style={s.applySection}>
          {!hasActiveOutpass && monthlyCount < monthlyLimit ? (
            <Button size='lg' className='student-apply-btn' onClick={() => navigate('/student/apply')}>
              Apply for Outpass
            </Button>
          ) : (
            <Alert variant='warning'>
              <strong>{hasActiveOutpass ? 'You have an active outpass' : 'Monthly limit reached'}</strong>
              {hasActiveOutpass
                ? 'Complete or cancel your current outpass before applying again.'
                : `You have used all ${monthlyLimit} outpasses for this month.`}
            </Alert>
          )}
        </div>

        <PageHeader title='My Outpasses' subtitle='Track active requests and previous outpasses.' />
        <Tabs
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'active', label: 'Active', count: activeOutpasses.length },
            { key: 'history', label: 'History', count: historyOutpasses.length }
          ]}
        />

        {loading ? (
          <LoadingState label='Loading outpasses...' />
        ) : displayed.length === 0 ? (
          <EmptyState
            title={activeTab === 'active' ? 'No active outpasses' : 'No outpass history'}
            subtitle={activeTab === 'active' ? 'Apply for an outpass when you need campus permission.' : 'Completed outpasses will appear here.'}
            action={activeTab === 'active' && !hasActiveOutpass ? (
              <Button onClick={() => navigate('/student/apply')}>Apply now</Button>
            ) : null}
          />
        ) : (
          <div style={s.outpassList}>
            {displayed.map(outpass => (
              <Card key={outpass._id} style={s.outpassCard}>
                <div style={s.outpassTop}>
                  <div>
                    <h3 style={s.outpassDest}>{outpass.destination}</h3>
                    <p style={s.outpassReason}>{outpass.reason}</p>
                  </div>
                  <StatusBadge status={outpass.status} />
                </div>

                <div style={s.outpassDates}>
                  <Info label='From' value={new Date(outpass.fromDate).toDateString()} />
                  <Info label='To' value={new Date(outpass.toDate).toDateString()} />
                  <Info label='Applied' value={new Date(outpass.requestedAt).toLocaleDateString()} />
                </div>

                {outpass.wardenNote && (
                  <div style={s.wardenNote}>
                    <strong>Warden note:</strong> {outpass.wardenNote}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </AppPage>
      <ChatWindow />
    </>
  )
}

function Info({ label, value }) {
  return (
    <div style={s.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const s = {
  welcomeCard: {
    padding: '22px',
    marginBottom: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    background: '#0f172a',
    color: '#fff'
  },
  welcomeLeft: { display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.14)',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 900,
    flexShrink: 0
  },
  welcomeTitle: { margin: '0 0 5px', fontSize: '21px', lineHeight: 1.2, color: '#fff' },
  welcomeSub: { margin: 0, color: '#cbd5e1', fontSize: '13px' },
  welcomeStats: { display: 'flex', gap: '18px', padding: '13px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)' },
  contactCard: { padding: '17px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' },
  eyebrow: { display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' },
  contactName: { margin: '0 0 4px', color: '#172033', fontSize: '17px' },
  contactMeta: { margin: '2px 0', color: '#64748b', fontSize: '13px' },
  contactActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  applySection: { marginBottom: '24px' },
  outpassList: { display: 'grid', gap: '12px' },
  outpassCard: { padding: '18px' },
  outpassTop: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' },
  outpassDest: { margin: '0 0 5px', color: '#172033', fontSize: '16px' },
  outpassReason: { margin: 0, color: '#64748b', fontSize: '13px' },
  outpassDates: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' },
  infoItem: { padding: '11px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e3e8f0' },
  wardenNote: { marginTop: '12px', padding: '11px', borderRadius: '8px', background: '#eff6ff', color: '#334155', fontSize: '13px' }
}
