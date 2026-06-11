import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages
import Login from './pages/Login'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import ApplyOutpass from './pages/student/ApplyOutpass'
import MyOutpasses from './pages/student/MyOutpasses'

// Warden1
import Warden1Dashboard from './pages/warden1/Warden1Dashboard'
import OutpassDetail from './pages/warden1/OutpassDetail'

// Warden2
import GateScanner from './pages/warden2/GateScanner'

// Parent
import ParentApproval from './pages/parent/ParentApproval'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageStudents from './pages/admin/students/ManageStudents'
import AddStudent from './pages/admin/students/AddStudent'
import EditStudent from './pages/admin/students/EditStudent'
import ManageWarden1 from './pages/admin/wardens/ManageWarden1'
import AddWarden1 from './pages/admin/wardens/AddWarden1'
import EditWarden1 from './pages/admin/wardens/EditWarden1'
import ManageWarden2 from './pages/admin/wardens/ManageWarden2'
import AddWarden2 from './pages/admin/wardens/AddWarden2'
import EditWarden2 from './pages/admin/wardens/EditWarden2'
import AllOutpasses from './pages/admin/AllOutpasses'
import ScanLogs from './pages/admin/ScanLogs'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path='/login'          element={<Login />} />
        <Route path='/parent/approve' element={<ParentApproval />} />
        <Route path='/parent/reject'  element={<ParentApproval />} />

        {/* Student */}
        <Route path='/student' element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }/>
        <Route path='/student/apply' element={
          <ProtectedRoute allowedRoles={['student']}>
            <ApplyOutpass />
          </ProtectedRoute>
        }/>
        <Route path='/student/my-outpasses' element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyOutpasses />
          </ProtectedRoute>
        }/>

        {/* Warden1 */}
        <Route path='/warden1' element={
          <ProtectedRoute allowedRoles={['warden1']}>
            <Warden1Dashboard />
          </ProtectedRoute>
        }/>
        <Route path='/warden1/outpass/:id' element={
          <ProtectedRoute allowedRoles={['warden1']}>
            <OutpassDetail />
          </ProtectedRoute>
        }/>

        {/* Warden2 */}
        <Route path='/warden2' element={
          <ProtectedRoute allowedRoles={['warden2']}>
            <GateScanner />
          </ProtectedRoute>
        }/>

        {/* Admin */}
        <Route path='/admin' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }/>
        <Route path='/admin/students' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageStudents />
          </ProtectedRoute>
        }/>
        <Route path='/admin/students/add' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AddStudent />
          </ProtectedRoute>
        }/>
        <Route path='/admin/students/edit/:id' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EditStudent />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden1s' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageWarden1 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden1s/add' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AddWarden1 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden1s/edit/:id' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EditWarden1 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden2s' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageWarden2 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden2s/add' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AddWarden2 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/warden2s/edit/:id' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EditWarden2 />
          </ProtectedRoute>
        }/>
        <Route path='/admin/outpasses' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AllOutpasses />
          </ProtectedRoute>
        }/>
        <Route path='/admin/scanlogs' element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ScanLogs />
          </ProtectedRoute>
        }/>

        {/* Default */}
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='*' element={<Login />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App