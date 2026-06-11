import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL
})

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// ─────────────────────────────────────
// AUTH
// ─────────────────────────────────────
export const loginApi    = (data) => api.post('/auth/login', data)
export const registerApi = (data) => api.post('/auth/register', data)

// ─────────────────────────────────────
// OUTPASS
// ─────────────────────────────────────
export const applyOutpassApi           = (data)       => api.post('/outpass/apply', data)
export const getMyOutpassesApi         = ()           => api.get('/outpass/my')
export const getPendingOutpassesApi    = ()           => api.get('/outpass/pending')
export const getRejectedParentsApi     = ()           => api.get('/outpass/rejected-parents')
export const forwardToParentsApi       = (id, data)   => api.put(`/outpass/${id}/forward`, data)
export const rejectOutpassApi          = (id, data)   => api.put(`/outpass/${id}/reject`, data)
export const callApproveApi            = (id, data)   => api.put(`/outpass/${id}/call-approve`, data)
export const cancelOutpassApi          = (id, data)   => api.put(`/outpass/${id}/cancel`, data)
export const getOutpassByTokenApi      = (token)      => api.get(`/outpass/parent/${token}`)
export const parentRespondApi          = (token, data)=> api.put(`/outpass/parent/${token}`, data)
export const getNoResponseOutpassesApi = ()           => api.get('/outpass/no-response')
export const getOutpassByRollNumberApi = (rollNumber) => api.get(`/outpass/by-rollnumber/${rollNumber}`)
export const getMyStudentsOutpassesApi = ()           => api.get('/outpass/my-students')

// ─────────────────────────────────────
// FACE
// ─────────────────────────────────────
export const verifyExitApi        = (data) => api.post('/face/verify-exit', data)
export const verifyReturnApi      = (data) => api.post('/face/verify-return', data)
export const manualOverrideApi    = (data) => api.post('/face/manual-override', data)
export const verifyParentFaceApi  = (data) => api.post('/face/verify-parent', data)

// ─────────────────────────────────────
// CHAT
// ─────────────────────────────────────
export const sendChatMessageApi = (data) => api.post('/chat', data)

// ─────────────────────────────────────
// ADMIN
// ─────────────────────────────────────
export const getDashboardStatsApi = () => api.get('/admin')
export const getAllOutpassesApi   = () => api.get('/admin/outpasses')
export const getAllScanLogsApi    = () => api.get('/admin/scanlogs')

// Students
export const getAllStudentsApi = ()         => api.get('/admin/students')
export const addStudentApi    = (data)     => api.post('/admin/students', data)
export const editStudentApi   = (id, data) => api.put(`/admin/students/${id}`, data)
export const deleteStudentApi = (id)       => api.delete(`/admin/students/${id}`)

// Student face registration
export const registerStudentFaceApi = (id, data) =>
  api.post(`/admin/students/${id}/register-face`, data)

export const registerParentFaceApi = (id, data) =>
  api.post(`/admin/students/${id}/register-parent-face`, data)

// Warden1s
export const getAllWarden1sApi = ()         => api.get('/admin/warden1s')
export const addWarden1Api    = (data)     => api.post('/admin/warden1s', data)
export const editWarden1Api   = (id, data) => api.put(`/admin/warden1s/${id}`, data)
export const deleteWarden1Api = (id)       => api.delete(`/admin/warden1s/${id}`)

// Warden2s
export const getAllWarden2sApi = ()         => api.get('/admin/warden2s')
export const addWarden2Api    = (data)     => api.post('/admin/warden2s', data)
export const editWarden2Api   = (id, data) => api.put(`/admin/warden2s/${id}`, data)
export const deleteWarden2Api = (id)       => api.delete(`/admin/warden2s/${id}`)

// Admins
export const getAllAdminsApi = ()         => api.get('/admin/admins')
export const addAdminApi    = (data)     => api.post('/admin/admins', data)
export const editAdminApi   = (id, data) => api.put(`/admin/admins/${id}`, data)
export const deleteAdminApi = (id)       => api.delete(`/admin/admins/${id}`)

export default api
