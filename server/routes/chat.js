const express = require('express')
const router = express.Router()
const { sendMessage } = require('../controllers/chatController')
const { protect, authorizeRoles } = require('../middleware/authMiddleware')

// Only students can use chatbot
router.post('/', protect, authorizeRoles('student'), sendMessage)

module.exports = router