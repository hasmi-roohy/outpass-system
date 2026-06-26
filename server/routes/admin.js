const express = require('express')
const router  = express.Router()
const {
  getAllStudents, getStudentById, addStudent, editStudent, deleteStudent,
  getAllWarden1s, addWarden1, editWarden1, deleteWarden1,
  getAllWarden2s, addWarden2, editWarden2, deleteWarden2,
  getAllAdmins,   addAdmin,   editAdmin,   deleteAdmin,
  getAllOutpasses, getAllScanLogs, getDashboardStats,
  registerStudentFace,
  registerParentFace
} = require('../controllers/adminController')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

const adminOnly = [protect, authorizeRoles('admin')]

// ─────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────
router.get('/', ...adminOnly, getDashboardStats)

// ─────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────
router.get('/students',                          ...adminOnly, getAllStudents)
router.get('/students/:id',                      ...adminOnly, getStudentById)
router.post('/students',                         ...adminOnly, addStudent)
router.put('/students/:id',                      ...adminOnly, editStudent)
router.delete('/students/:id',                   ...adminOnly, deleteStudent)
router.post('/students/:id/register-face',       ...adminOnly, registerStudentFace)
router.post('/students/:id/register-parent-face',...adminOnly, registerParentFace)

// ─────────────────────────────────────
// WARDEN1S
// ─────────────────────────────────────
router.get('/warden1s',        ...adminOnly, getAllWarden1s)
router.post('/warden1s',       ...adminOnly, addWarden1)
router.put('/warden1s/:id',    ...adminOnly, editWarden1)
router.delete('/warden1s/:id', ...adminOnly, deleteWarden1)

// ─────────────────────────────────────
// WARDEN2S
// ─────────────────────────────────────
router.get('/warden2s',        ...adminOnly, getAllWarden2s)
router.post('/warden2s',       ...adminOnly, addWarden2)
router.put('/warden2s/:id',    ...adminOnly, editWarden2)
router.delete('/warden2s/:id', ...adminOnly, deleteWarden2)

// ─────────────────────────────────────
// ADMINS
// ─────────────────────────────────────
router.get('/admins',        ...adminOnly, getAllAdmins)
router.post('/admins',       ...adminOnly, addAdmin)
router.put('/admins/:id',    ...adminOnly, editAdmin)
router.delete('/admins/:id', ...adminOnly, deleteAdmin)

// ─────────────────────────────────────
// VIEW ALL DATA
// ─────────────────────────────────────
router.get('/outpasses', ...adminOnly, getAllOutpasses)
router.get('/scanlogs',  ...adminOnly, getAllScanLogs)

module.exports = router
