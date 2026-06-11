const express = require('express')
const router  = express.Router()
const {
  applyOutpass,
  getMyOutpasses,
  getPendingOutpasses,
  getRejectedByParents,
  getNoResponseOutpasses,
  getOutpassByRollNumber,
  getMyStudentsOutpasses,
  forwardToParents,
  rejectOutpass,
  getSingleOutpass, 
  cancelOutpass,
  getOutpassByToken,
  parentRespond,
  callApprove
} = require('../controllers/outpassController')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

// Student routes
router.post('/apply', protect, authorizeRoles('student'), applyOutpass)
router.get('/my',     protect, authorizeRoles('student'), getMyOutpasses)

// Warden1 routes
router.get('/pending',          protect, authorizeRoles('warden1'), getPendingOutpasses)
router.get('/rejected-parents', protect, authorizeRoles('warden1'), getRejectedByParents)
router.get('/no-response',      protect, authorizeRoles('warden1'), getNoResponseOutpasses)
router.get('/my-students',      protect, authorizeRoles('warden1'), getMyStudentsOutpasses)
router.put('/:id/forward',      protect, authorizeRoles('warden1'), forwardToParents)
router.put('/:id/reject',       protect, authorizeRoles('warden1'), rejectOutpass)
router.put('/:id/cancel',       protect, authorizeRoles('warden1'), cancelOutpass)
router.put('/:id/call-approve', protect, authorizeRoles('warden1'), callApprove)

// Warden2 routes
router.get('/by-rollnumber/:rollNumber', protect, authorizeRoles('warden2'), getOutpassByRollNumber)

// Parent routes (public - token based)
router.get('/parent/:token', getOutpassByToken)
router.put('/parent/:token', parentRespond)



// @route  GET /api/outpass/:id
// @access Warden1
router.get('/:id', protect, authorizeRoles('warden1', 'admin'), getSingleOutpass)


router.get('/my-students',      protect, authorizeRoles('warden1'),           getMyStudentsOutpasses)
router.get('/by-rollnumber/:rollNumber', protect, authorizeRoles('warden2'),  getOutpassByRollNumber)
router.get('/:id',              protect, authorizeRoles('warden1', 'admin'),  getSingleOutpass)
module.exports = router