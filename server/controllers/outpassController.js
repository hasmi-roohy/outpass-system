const Outpass = require('../models/Outpass')
const User    = require('../models/User')
const { v4: uuidv4 } = require('uuid')
const { sendOutpassMail, sendApprovalMailToStudent, sendRejectionMailToStudent } = require('../services/notificationService')
const { requireAssignedWarden, requireStatus } = require('../utils/outpassGuards')
const { verifyParentVerificationToken } = require('../utils/parentVerification')

const cleanText = value => typeof value === 'string' ? value.trim() : ''

// @route  POST /api/outpass/apply
// @access Student
const applyOutpass = async (req, res) => {
  try {
    const reason = cleanText(req.body.reason)
    const destination = cleanText(req.body.destination)
    const { fromDate, toDate, fromTime, toTime } = req.body
    const studentId = req.user._id

    const departure = new Date(fromDate)
    const returnDate = new Date(toDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!reason || !destination || !fromDate || !toDate) {
      return res.status(400).json({ message: 'Reason, destination, and dates are required' })
    }
    if (Number.isNaN(departure.getTime()) || Number.isNaN(returnDate.getTime())) {
      return res.status(400).json({ message: 'Invalid departure or return date' })
    }
    if (departure < today || returnDate < departure) {
      return res.status(400).json({ message: 'Outpass dates are invalid' })
    }

    // Check active outpass
   const activeOutpass = await Outpass.findOne({
  studentId,
  status: { $in: ['pending', 'warden_forwarded', 'approved', 'out', 'late_return'] }
})
if (activeOutpass) {
  return res.status(400).json({ message: 'You already have an active outpass' })
}

    // Check monthly limit
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthlyCount = await Outpass.countDocuments({
      studentId,
      requestedAt: { $gte: startOfMonth }
    })
    if (monthlyCount >= 2) {
      return res.status(400).json({ message: 'Monthly outpass limit reached (max 2)' })
    }

    // Get student
    const student = await User.findById(studentId)

    // ← ADD THIS CHECK
    if (!student.warden1Id) {
      return res.status(400).json({
        message: 'No warden assigned to you. Contact admin.'
      })
    }

    // Set expiry
    const expiresAt = new Date(toDate)
    expiresAt.setHours(23, 59, 59, 999)

    // Create outpass
    const outpass = await Outpass.create({
      studentId,
      reason,
      destination,
      fromDate,
      toDate,
      fromTime,
      toTime,
      expiresAt,
      warden1Id: student.warden1Id  // ← correctly assigned
    })

    res.status(201).json({
      message: 'Outpass applied successfully',
      outpass
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/my
// @access Student
const getMyOutpasses = async (req, res) => {
  try {
    const outpasses = await Outpass.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
    res.status(200).json(outpasses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/pending
// @access Warden1
const getPendingOutpasses = async (req, res) => {
  try {
    const outpasses = await Outpass.find({
      warden1Id:    req.user._id,
      wardenStatus: 'pending'
    }).populate('studentId', 'name email rollNumber department phone')
      .sort({ createdAt: -1 })
    res.status(200).json(outpasses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/rejected-parents
// @access Warden1
const getRejectedByParents = async (req, res) => {
  try {
    const outpasses = await Outpass.find({
      warden1Id:             req.user._id,
      wardenStatus:          'forwarded',
      'parentTokens.status': 'rejected'
    }).populate('studentId', 'name email rollNumber department phone')
      .sort({ createdAt: -1 })
    res.status(200).json(outpasses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/no-response
// @access Warden1
const getNoResponseOutpasses = async (req, res) => {
  try {
    const outpasses = await Outpass.find({
      warden1Id:                      req.user._id,
      status:                         'warden_forwarded',
      'parentNoResponse.alerted':     true,
      'wardenFinalDecision.done':     false
    }).populate('studentId', 'name email rollNumber department phone')
      .sort({ createdAt: -1 })
    res.status(200).json(outpasses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/forward
// @access Warden1
const forwardToParents = async (req, res) => {
  try {
    const { wardenNote } = req.body
    const outpass = await Outpass.findById(req.params.id)
      .populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const student      = outpass.studentId
    if (!requireAssignedWarden(outpass, req, res)) return
    if (!requireStatus(outpass, ['pending'], res)) return

    const parentTokens = student.parents.map((parent, parentIndex) => ({
      name:     parent.name,
      email:    parent.email,
      phone:    parent.phone,
      relation: parent.relation,
      token:    uuidv4(),
      status:   'pending',
      expiresAt: tokenExpiresAt,
      parentIndex
    }))

    if (parentTokens.length === 0) {
      return res.status(400).json({ message: 'No parents are registered for this student' })
    }

    outpass.wardenStatus    = 'forwarded'
    outpass.wardenNote      = wardenNote || ''
    outpass.wardenUpdatedAt = new Date()
    outpass.parentTokens    = parentTokens
    outpass.status          = 'warden_forwarded'
    await outpass.save()

    await sendOutpassMail(student, outpass, parentTokens)

    res.status(200).json({
      message: 'Outpass forwarded to parents',
      outpass
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/reject
// @access Warden1
const rejectOutpass = async (req, res) => {
  try {
    const { wardenNote } = req.body
    const outpass = await Outpass.findById(req.params.id)

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireAssignedWarden(outpass, req, res)) return
    if (!requireStatus(outpass, ['pending'], res)) return

    outpass.wardenStatus    = 'rejected'
    outpass.wardenNote      = wardenNote || ''
    outpass.wardenUpdatedAt = new Date()
    outpass.status          = 'rejected'
    await outpass.save()

    res.status(200).json({ message: 'Outpass rejected', outpass })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/cancel
// @access Warden1
const cancelOutpass = async (req, res) => {
  try {
    const { wardenNote } = req.body
    const outpass = await Outpass.findById(req.params.id)

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireAssignedWarden(outpass, req, res)) return
    if (!requireStatus(outpass, ['warden_forwarded', 'approved'], res)) return

    outpass.status                       = 'cancelled'
    outpass.wardenFinalDecision.done     = true
    outpass.wardenFinalDecision.decision = 'cancelled'
    outpass.wardenFinalDecision.note     = wardenNote || ''
    outpass.wardenFinalDecision.decidedAt = new Date()
    await outpass.save()

    res.status(200).json({ message: 'Outpass cancelled', outpass })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/parent/:token
// @access Public
const getOutpassByToken = async (req, res) => {
  try {
    const outpass = await Outpass.findOne({
      status: 'warden_forwarded',
      'parentTokens.token': req.params.token
    }).populate('studentId', 'name rollNumber department')

    if (!outpass) {
      return res.status(404).json({ message: 'Invalid or expired token' })
    }

    const parent = outpass.parentTokens.find(p => p.token === req.params.token)

    if (parent.status === 'approved' || parent.status === 'rejected') {
      return res.status(400).json({ message: 'You have already responded' })
    }

    if (parent.status === 'deactivated') {
      return res.status(400).json({
        message: 'Another guardian has already responded to this request.'
      })
    }
    // Check token not expired
   if (parent.expiresAt && new Date() > parent.expiresAt) {
  return res.status(400).json({
    message: 'This approval link has expired. Please contact the warden.'
  })
}
    const safeOutpass = outpass.toObject()
    delete safeOutpass.parentTokens
    res.status(200).json(safeOutpass)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/parent/:token
// @access Public
const parentRespond = async (req, res) => {
  try {
    const { status, rejectionReason, verificationToken } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Response must be approved or rejected' })
    }
    if (!verificationToken) {
      return res.status(401).json({ message: 'Face verification is required' })
    }

    try {
      verifyParentVerificationToken({
        verificationToken,
        parentToken: req.params.token,
        secret: process.env.JWT_SECRET
      })
    } catch {
      return res.status(401).json({ message: 'Face verification expired. Please scan again.' })
    }
    const now = new Date()
    const responseUpdate = {
      'parentTokens.$.status': status,
      'parentTokens.$.rejectionReason': cleanText(rejectionReason),
      'parentTokens.$.respondedAt': now,
      parentStatus: status,
      status
    }

    if (status === 'approved') {
      responseUpdate.parentApprovedAt = now
    }

    // The status filter makes the first valid parent response win atomically.
    const outpass = await Outpass.findOneAndUpdate(
      {
        status: 'warden_forwarded',
        parentTokens: {
          $elemMatch: {
            token: req.params.token,
            status: 'pending',
            expiresAt: { $gt: now }
          }
        }
      },
      { $set: responseUpdate },
      { new: true }
    )

    if (!outpass) {
      return res.status(409).json({
        message: 'This link is expired, already used, or another guardian has responded'
      })
    }

    const parent = outpass.parentTokens.find(p => p.token === req.params.token)
    if (status === 'approved') {
      outpass.parentApprovedBy = parent.email
      await outpass.save()
    }

    await Outpass.updateOne(
      { _id: outpass._id },
      { $set: { 'parentTokens.$[other].status': 'deactivated' } },
      {
        arrayFilters: [{
          'other.status': 'pending',
          'other.token': { $ne: req.params.token }
        }]
      }
    )

    const student = await User.findById(outpass.studentId).select('name email')
    if (status === 'approved') {
      await sendApprovalMailToStudent(student, outpass, `${parent.name} (${parent.relation})`)
    } else {
      await sendRejectionMailToStudent(student, outpass, `${parent.name} (${parent.relation})`, rejectionReason)
    }


    res.status(200).json({ message: `Outpass ${status} by parent` })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/call-approve
// @access Warden1
const callApprove = async (req, res) => {
  try {
    const { wardenNote } = req.body
    const outpass = await Outpass.findById(req.params.id)

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireAssignedWarden(outpass, req, res)) return
    if (!requireStatus(outpass, ['warden_forwarded'], res)) return

    outpass.parentStatus              = 'call-approved'
    outpass.status                    = 'approved'
    outpass.callOverride.done         = true
    outpass.callOverride.wardenNote   = wardenNote || ''
    outpass.callOverride.overriddenAt = new Date()

    outpass.wardenFinalDecision.done      = true
    outpass.wardenFinalDecision.decision  = 'approved'
    outpass.wardenFinalDecision.note      = wardenNote || ''
    outpass.wardenFinalDecision.decidedAt = new Date()

    await outpass.save()

    const student = await User.findById(outpass.studentId).select('name email')
await sendApprovalMailToStudent(student, outpass, 'Warden (Call Approved)')

    res.status(200).json({ message: 'Outpass approved via call', outpass })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



// @route  GET /api/outpass/by-rollnumber/:rollNumber
// @access Warden2
const getOutpassByRollNumber = async (req, res) => {
  try {
    const student = await User.findOne({
      rollNumber: req.params.rollNumber,
      role:       'student',
      warden2Id:  req.user._id
    })

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // ← Find approved OR out (for return scan)
    const outpass = await Outpass.findOne({
      studentId: student._id,
      status:    { $in: ['approved', 'out', 'late_return'] }
    }).populate('studentId', 'name rollNumber department phone faceImageUrl')

    if (!outpass) {
      return res.status(404).json({
        message: 'No active outpass found for this student'
      })
    }

    res.status(200).json({ outpass, student })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/my-students
// @access Warden1
const getMyStudentsOutpasses = async (req, res) => {
  try {
    const outpasses = await Outpass.find({
      warden1Id: req.user._id
    })
    .populate('studentId', 'name email rollNumber department phone')
    .sort({ createdAt: -1 })

    res.status(200).json(outpasses)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}




// @route  GET /api/outpass/:id
// @access Warden1 + Admin
const getSingleOutpass = async (req, res) => {
  try {
    const outpass = await Outpass.findById(req.params.id)
      .populate('studentId', 'name email rollNumber department phone parents')
      .populate('warden1Id', 'name email')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    if (req.user.role === 'warden1' && !requireAssignedWarden(outpass, req, res)) return

    res.status(200).json(outpass)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  applyOutpass,
  getMyOutpasses,
  getPendingOutpasses,
  getRejectedByParents,
  getNoResponseOutpasses,
  forwardToParents,
  rejectOutpass,
  cancelOutpass,
  getOutpassByToken,
  parentRespond,
  callApprove,
  getOutpassByRollNumber,   // ← ADD
  getMyStudentsOutpasses, 
  getSingleOutpass
}
