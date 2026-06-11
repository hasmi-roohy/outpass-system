import { createContext, useContext, useState } from 'react'

// Create context
const AuthContext = createContext()

// Provider — wraps entire app
export function AuthProvider({ children }) {

  // Get user from localStorage on refresh
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      localStorage.removeItem('user') // clear corrupted data
      return null
    }
  })

  // Login — save user to state + localStorage
  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // Logout — clear everything
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — easy access anywhere
export function useAuth() {
  return useContext(AuthContext)
}