const express = require('express')
const router  = express.Router()
const {
  applyOutpass,
  getMyOutpasses,
  studentCancelOutpass,
  getPendingOutpasses,
  getRejectedByParents,
  getNoResponseOutpasses,
  getOutpassByRollNumber,
  getMyStudentsOutpasses,
  forwardToParents,
  resendParentEmails,
  rejectOutpass,
  getSingleOutpass, 
  cancelOutpass,
  getOutpassByToken,
  parentRespond,
  parentApproveDirect,
  parentRejectDirect,
  callApprove,
  adminEmergencyApprove
} = require('../controllers/outpassController')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

// Student routes
router.post('/apply', protect, authorizeRoles('student'), applyOutpass)
router.get('/my',     protect, authorizeRoles('student'), getMyOutpasses)
router.put('/:id/student-cancel', protect, authorizeRoles('student'), studentCancelOutpass)

// Warden1 routes
router.get('/pending',          protect, authorizeRoles('warden1'), getPendingOutpasses)
router.get('/rejected-parents', protect, authorizeRoles('warden1'), getRejectedByParents)
router.get('/no-response',      protect, authorizeRoles('warden1'), getNoResponseOutpasses)
router.get('/my-students',      protect, authorizeRoles('warden1'), getMyStudentsOutpasses)
router.put('/:id/forward',      protect, authorizeRoles('warden1'), forwardToParents)
router.post('/:id/resend-parent-emails', protect, authorizeRoles('warden1'), resendParentEmails)
router.put('/:id/reject',       protect, authorizeRoles('warden1'), rejectOutpass)
router.put('/:id/cancel',       protect, authorizeRoles('warden1'), cancelOutpass)
router.put('/:id/call-approve', protect, authorizeRoles('warden1'), callApprove)
router.put('/:id/admin-emergency-approve', protect, authorizeRoles('admin'), adminEmergencyApprove)

// Warden2 routes
router.get('/by-rollnumber/:rollNumber', protect, authorizeRoles('warden2'), getOutpassByRollNumber)

// Parent routes (public - token based)
router.get('/parent/:token', getOutpassByToken)
router.put('/parent/:token', parentRespond)
router.get('/parent/:token/approve-direct', parentApproveDirect)
router.get('/parent/:token/reject-direct', parentRejectDirect)



// @route  GET /api/outpass/:id
// @access Warden1
router.get('/:id', protect, authorizeRoles('warden1', 'admin'), getSingleOutpass)


module.exports = router
