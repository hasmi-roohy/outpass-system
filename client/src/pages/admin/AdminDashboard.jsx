import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getDashboardStatsApi } from '../../api/api'
import {
  Alert,
  AppPage,
  Button,
  Card,
  LoadingState,
  PageHeader,
  StatCard
} from '../../components/ui/UI'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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
    { label: 'Total Students', value: stats.totalStudents, icon: 'ST', tone: 'blue', path: '/admin/students' },
    { label: 'Total Outpasses', value: stats.totalOutpasses, icon: 'OP', tone: 'purple', path: '/admin/outpasses' },
    { label: 'Pending', value: stats.pending, icon: 'P', tone: 'orange', path: '/admin/outpasses' },
    { label: 'Approved', value: stats.approved, icon: 'A', tone: 'green', path: '/admin/outpasses' },
    { label: 'Currently Out', value: stats.currentlyOut, icon: 'OUT', tone: 'purple', path: '/admin/outpasses' },
    { label: 'Late Returns', value: stats.lateReturns, icon: '!', tone: 'orange', path: '/admin/outpasses' },
    { label: 'Failed Scans', value: stats.failedScans, icon: 'X', tone: 'red', path: '/admin/scanlogs' }
  ] : []

  const quickActions = [
    { label: 'Add Student', path: '/admin/students/add', tone: 'primary' },
    { label: 'Add Warden 1', path: '/admin/warden1s/add', tone: 'secondary' },
    { label: 'Add Warden 2', path: '/admin/warden2s/add', tone: 'secondary' }
  ]

  const missingAssignmentCount = (stats?.missingWarden1 || 0) + (stats?.missingWarden2 || 0)
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <>
      <Navbar />
      <AppPage>
        <PageHeader
          title='Admin Dashboard'
          subtitle='Overview of students, outpasses, approvals, and gate activity.'
          meta={today}
        />

        {loading ? (
          <LoadingState label='Loading dashboard...' />
        ) : (
          <div style={s.statsGrid}>
            {statCards.map(card => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
                onClick={() => navigate(card.path)}
              />
            ))}
          </div>
        )}

        {missingAssignmentCount > 0 && (
          <Alert
            variant='warning'
            action={<Button variant='warning' size='sm' onClick={() => navigate('/admin/students')}>Fix assignments</Button>}
          >
            <strong>Student warden assignment needed</strong>
            {stats.missingWarden1 || 0} missing Warden 1, {stats.missingWarden2 || 0} missing Gate Warden.
          </Alert>
        )}

        {missingAssignmentCount > 0 && stats?.studentsMissingWardens?.length > 0 && (
          <Card style={s.assignmentCard}>
            {(stats.studentsMissingWardens || []).map(student => (
              <div key={student._id} style={s.assignmentItem}>
                <div>
                  <strong style={s.assignmentName}>{student.name}</strong>
                  <span style={s.assignmentMeta}>
                    {student.rollNumber || 'No roll number'}{student.department ? ` - ${student.department}` : ''}
                  </span>
                </div>
                <div style={s.assignmentTags}>
                  {!student.warden1Id && <span style={s.assignmentTag}>No Warden 1</span>}
                  {!student.warden2Id && <span style={s.assignmentTag}>No Gate Warden</span>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {stats?.lateReturns > 0 && (
          <Alert
            variant='danger'
            action={<Button variant='danger' size='sm' onClick={() => navigate('/admin/outpasses')}>View</Button>}
          >
            <strong>{stats.lateReturns} late return{stats.lateReturns > 1 ? 's' : ''}</strong>
            Check the outpasses section and contact the assigned wardens.
          </Alert>
        )}

        <section style={s.section}>
          <PageHeader title='Quick Actions' subtitle='Create students and wardens from one place.' />
          <div style={s.actionGrid}>
            {quickActions.map(action => (
              <Button
                key={action.label}
                variant={action.tone}
                size='lg'
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      </AppPage>
    </>
  )
}

const s = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '14px',
    marginBottom: '22px'
  },
  assignmentCard: {
    padding: '12px',
    marginBottom: '20px',
    display: 'grid',
    gap: '8px'
  },
  assignmentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '11px 12px',
    borderRadius: '8px',
    background: '#fff7ed',
    border: '1px solid #fed7aa'
  },
  assignmentName: { display: 'block', color: '#172033', fontSize: '13px' },
  assignmentMeta: { display: 'block', color: '#64748b', fontSize: '12px', marginTop: '3px' },
  assignmentTags: { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  assignmentTag: {
    padding: '5px 8px',
    borderRadius: '999px',
    background: '#fed7aa',
    color: '#9a3412',
    fontSize: '11px',
    fontWeight: 900
  },
  section: { marginTop: '26px' },
  actionGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px' }
}
