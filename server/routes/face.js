const express = require('express')
const router  = express.Router()
const {
  verifyExit,
  verifyReturn,
  manualOverride
} = require('../controllers/faceController')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

// Warden2 only
router.post('/verify-exit',     protect, authorizeRoles('warden2'), verifyExit)
router.post('/verify-return',   protect, authorizeRoles('warden2'), verifyReturn)
router.post('/manual-override', protect, authorizeRoles('warden2'), manualOverride)

// Public — parent face verify (no login needed)
module.exports = router
