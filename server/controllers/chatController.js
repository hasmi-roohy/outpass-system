const axios = require('axios')
const Outpass = require('../models/Outpass')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL

// @route  POST /api/chat
// @access Student
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body
    const studentId = req.user._id

    // Send message to FastAPI chatbot
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
      message,
      studentId: studentId.toString()
    })

    const { intent, reply } = response.data

    // Handle special intents that need DB
    if (intent === 'check_status') {
      // Fetch latest outpass from DB
      const latestOutpass = await Outpass.findOne({ studentId })
        .sort({ createdAt: -1 })

      if (!latestOutpass) {
        return res.status(200).json({
          reply: 'You have no outpass requests yet.'
        })
      }

      const statusMessages = {
        pending:          'Your outpass is pending. Waiting for warden review.',
        warden_forwarded: 'Your outpass has been forwarded to your parents for approval.',
        approved:         'Your outpass is approved! You can proceed to the gate.',
        rejected:         'Your outpass has been rejected. Contact your warden for details.',
        out:              'You are currently outside campus.',
        returned:         'Your last outpass is completed. Welcome back!',
        late_return:      'You have a late return! Please contact your warden immediately.',
        expired:          'Your outpass has expired.'
      }

      return res.status(200).json({
        reply: statusMessages[latestOutpass.status] || 'Status unknown.'
      })
    }

    // Handle message warden intent
    if (intent === 'message_warden') {
      return res.status(200).json({
        reply: 'Your message has been noted. Please contact your warden directly or apply for an outpass through the system.'
      })
    }

    // All other intents → return FastAPI reply
    res.status(200).json({ reply })

  } catch (error) {
    res.status(500).json({
      reply: 'Sorry, I am having trouble responding right now. Please try again.'
    })
  }
}

module.exports = { sendMessage }