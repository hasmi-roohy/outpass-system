import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  // Not logged in → go to login
  if (!user) {
    return <Navigate to='/login' />
  }

  // Wrong role → go to login
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to='/login' />
  }

  // Correct role → show page
  return children
}