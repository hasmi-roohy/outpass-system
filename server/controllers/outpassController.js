const Outpass = require('../models/Outpass')
const User    = require('../models/User')
const { v4: uuidv4 } = require('uuid')
const { sendOutpassMail, sendApprovalMailToStudent, sendRejectionMailToStudent } = require('../services/notificationService')
const { requireAssignedWarden, requireStatus } = require('../utils/outpassGuards')

const cleanText = value => typeof value === 'string' ? value.trim() : ''
const MONTHLY_LIMIT_STATUSES = ['out', 'returned', 'late_return']
const MONTHLY_USED_OUTPASS_LIMIT = 6
const runEmailInBackground = (label, task) => {
  Promise.resolve()
    .then(task)
    .then(result => {
      if (result) console.log(`${label}:`, result)
    })
    .catch(error => {
      console.log(`${label} failed:`, error.message)
    })
}

const getPagination = (req, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
  const requestedLimit = Number.parseInt(req.query.limit, 10) || defaultLimit
  const limit = Math.min(Math.max(requestedLimit, 1), maxLimit)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

const pagedResponse = (items, total, page, limit) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  }
})

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
      status: { $in: MONTHLY_LIMIT_STATUSES },
      'exitScan.time': { $gte: startOfMonth }
    })
    if (monthlyCount >= MONTHLY_USED_OUTPASS_LIMIT) {
      return res.status(400).json({
        message: `Monthly used-outpass limit reached (max ${MONTHLY_USED_OUTPASS_LIMIT})`
      })
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
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have an active outpass' })
    }
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/outpass/my
// @access Student
const getMyOutpasses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const query = { studentId: req.user._id }
    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Outpass.countDocuments(query)
    ])
    res.status(200).json(pagedResponse(outpasses, total, page, limit))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/student-cancel
// @access Student
const studentCancelOutpass = async (req, res) => {
  try {
    const outpass = await Outpass.findOne({
      _id: req.params.id,
      studentId: req.user._id
    })

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireStatus(outpass, ['pending', 'warden_forwarded', 'approved'], res)) return

    outpass.status = 'cancelled'
    outpass.wardenFinalDecision.done = true
    outpass.wardenFinalDecision.decision = 'student_cancelled'
    outpass.wardenFinalDecision.note = cleanText(req.body?.note) || 'Cancelled by student'
    outpass.wardenFinalDecision.decidedAt = new Date()

    outpass.parentTokens.forEach(parent => {
      if (parent.status === 'pending') {
        parent.status = 'deactivated'
      }
    })

    await outpass.save()

    res.status(200).json({
      message: 'Outpass cancelled. You can apply again if you are within your monthly used-outpass limit.',
      outpass
    })

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have an active outpass' })
    }
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

    runEmailInBackground('Parent email delivery', () => sendOutpassMail(student, outpass, parentTokens))

    res.status(200).json({
      message: `Outpass forwarded. ${parentTokens.length} parent email${parentTokens.length === 1 ? '' : 's'} are being sent in the background.`,
      outpass,
      emailDelivery: { status: 'sending', total: parentTokens.length }
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  POST /api/outpass/:id/resend-parent-emails
// @access Warden1
const resendParentEmails = async (req, res) => {
  try {
    const outpass = await Outpass.findById(req.params.id).populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireAssignedWarden(outpass, req, res)) return
    if (!requireStatus(outpass, ['warden_forwarded'], res)) return

    const pendingParents = outpass.parentTokens.filter(parent => parent.status === 'pending')
    if (pendingParents.length === 0) {
      return res.status(409).json({ message: 'No pending parent approval links are available to resend' })
    }

    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    pendingParents.forEach(parent => {
      parent.expiresAt = newExpiry
    })
    await outpass.save()

    runEmailInBackground('Parent email resend delivery', () => sendOutpassMail(outpass.studentId, outpass, pendingParents))
    const message = `${pendingParents.length} parent email${pendingParents.length === 1 ? '' : 's'} are being resent in the background`

    res.status(200).json({ message, emailDelivery: { status: 'sending', total: pendingParents.length } })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have an active outpass' })
    }
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
    const { status, rejectionReason } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Response must be approved or rejected' })
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
      runEmailInBackground('Student approval email', () => sendApprovalMailToStudent(student, outpass, `${parent.name} (${parent.relation})`))
    } else {
      runEmailInBackground('Student rejection email', () => sendRejectionMailToStudent(student, outpass, `${parent.name} (${parent.relation})`, rejectionReason))
    }


    res.status(200).json({ message: `Outpass ${status} by parent` })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const parentApproveDirect = async (req, res) => {
  try {
    const now = new Date()
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
      {
        $set: {
          'parentTokens.$.status': 'approved',
          'parentTokens.$.respondedAt': now,
          parentStatus: 'approved',
          status: 'approved',
          parentApprovedAt: now
        }
      },
      { new: true }
    )

    if (!outpass) {
      return res.status(409).send(parentActionPage({
        title: 'Request already closed',
        message: 'This approval link is expired, already used, or another guardian has responded.',
        tone: 'warning'
      }))
    }

    const parent = outpass.parentTokens.find(p => p.token === req.params.token)
    outpass.parentApprovedBy = parent?.email || ''
    await outpass.save()

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
    runEmailInBackground('Student approval email', () => sendApprovalMailToStudent(student, outpass, `${parent?.name || 'Parent'} (${parent?.relation || 'Guardian'})`))

    return res.status(200).send(parentActionPage({
      title: 'Outpass Approved',
      message: 'Thank you. The outpass has been approved successfully.',
      tone: 'success'
    }))
  } catch (error) {
    return res.status(500).send(parentActionPage({
      title: 'Approval failed',
      message: error.message || 'Please contact the warden.',
      tone: 'danger'
    }))
  }
}

const parentRejectDirect = async (req, res) => {
  try {
    const now = new Date()
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
      {
        $set: {
          'parentTokens.$.status': 'rejected',
          'parentTokens.$.rejectionReason': 'Declined from email',
          'parentTokens.$.respondedAt': now,
          parentStatus: 'rejected',
          status: 'rejected'
        }
      },
      { new: true }
    )

    if (!outpass) {
      return res.status(409).send(parentActionPage({
        title: 'Request already closed',
        message: 'This decline link is expired, already used, or another guardian has responded.',
        tone: 'warning'
      }))
    }

    const parent = outpass.parentTokens.find(p => p.token === req.params.token)

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
    runEmailInBackground('Student rejection email', () => sendRejectionMailToStudent(
      student,
      outpass,
      `${parent?.name || 'Parent'} (${parent?.relation || 'Guardian'})`,
      'Declined from email'
    ))

    return res.status(200).send(parentActionPage({
      title: 'Outpass Declined',
      message: 'Thank you. The outpass request has been declined.',
      tone: 'danger'
    }))
  } catch (error) {
    return res.status(500).send(parentActionPage({
      title: 'Decline failed',
      message: error.message || 'Please contact the warden.',
      tone: 'danger'
    }))
  }
}

const parentActionPage = ({ title, message, tone }) => {
  const color = tone === 'success' ? '#16a34a' : tone === 'danger' ? '#dc2626' : '#d97706'
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;color:#172033;">
        <main style="min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box;">
          <section style="width:100%;max-width:420px;background:#fff;border:1px solid #e3e8f0;border-radius:12px;padding:30px;text-align:center;box-shadow:0 18px 48px rgba(15,23,42,.10);">
            <div style="width:52px;height:52px;border-radius:12px;background:${color};margin:0 auto 18px;"></div>
            <h1 style="margin:0 0 10px;font-size:24px;color:${color};">${title}</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">${message}</p>
            <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;">You can close this page now.</p>
          </section>
        </main>
      </body>
    </html>
  `
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
    runEmailInBackground('Student approval email', () => sendApprovalMailToStudent(student, outpass, 'Warden (Call Approved)'))

    res.status(200).json({ message: 'Outpass approved via call', outpass })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  PUT /api/outpass/:id/admin-emergency-approve
// @access Admin
const adminEmergencyApprove = async (req, res) => {
  try {
    const note = cleanText(req.body?.note)
    if (!note) {
      return res.status(400).json({ message: 'Emergency approval reason is required' })
    }

    const outpass = await Outpass.findById(req.params.id)

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireStatus(outpass, ['pending', 'warden_forwarded'], res)) return

    outpass.parentStatus = 'call-approved'
    outpass.status = 'approved'
    outpass.callOverride.done = true
    outpass.callOverride.wardenNote = `Admin emergency approval by ${req.user.name}: ${note}`
    outpass.callOverride.overriddenAt = new Date()

    outpass.wardenFinalDecision.done = true
    outpass.wardenFinalDecision.decision = 'admin_emergency_approved'
    outpass.wardenFinalDecision.note = note
    outpass.wardenFinalDecision.decidedAt = new Date()

    outpass.parentTokens.forEach(parent => {
      if (parent.status === 'pending') {
        parent.status = 'deactivated'
      }
    })

    await outpass.save()

    const student = await User.findById(outpass.studentId).select('name email')
    runEmailInBackground('Student approval email', () => sendApprovalMailToStudent(student, outpass, `Admin Emergency Approval (${req.user.name})`))

    res.status(200).json({
      message: 'Outpass approved by admin emergency override',
      outpass
    })

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
    const { page, limit, skip } = getPagination(req)
    const { search = '', status = 'all' } = req.query
    const query = {
      warden1Id: req.user._id
    }

    if (status !== 'all') query.status = status

    if (search) {
      const term = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const studentIds = await User.find({
        role: 'student',
        $or: [
          { name: term },
          { rollNumber: term },
          { email: term },
          { department: term }
        ]
      }).distinct('_id')

      query.$or = [
        { destination: term },
        { reason: term },
        { studentId: { $in: studentIds } }
      ]
    }

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .populate('studentId', 'name email rollNumber department phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Outpass.countDocuments(query)
    ])

    res.status(200).json(pagedResponse(outpasses, total, page, limit))

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
  studentCancelOutpass,
  getPendingOutpasses,
  getRejectedByParents,
  getNoResponseOutpasses,
  forwardToParents,
  resendParentEmails,
  rejectOutpass,
  cancelOutpass,
  getOutpassByToken,
  parentRespond,
  parentApproveDirect,
  parentRejectDirect,
  callApprove,
  adminEmergencyApprove,
  getOutpassByRollNumber,   // ← ADD
  getMyStudentsOutpasses, 
  getSingleOutpass
}
