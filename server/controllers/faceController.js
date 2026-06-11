const Outpass = require('../models/Outpass')
const FaceScanLog = require('../models/FaceScanLog')
const { verifyFace } = require('../services/faceService')
const { requireAssignedGateWarden, requireStatus } = require('../utils/outpassGuards')
const { createParentVerificationToken } = require('../utils/parentVerification')

// @route  POST /api/face/verify-exit
// @access Warden2
const verifyExit = async (req, res) => {
  try {
    const { image, outpassId } = req.body
    if (!image || !outpassId) {
      return res.status(400).json({ message: 'Image and outpassId are required' })
    }

    // Find outpass
    const outpass = await Outpass.findById(outpassId)
      .populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    // Check outpass is approved
    if (!requireStatus(outpass, ['approved'], res, 'Outpass is not approved for exit')) return

    // Check outpass not expired
    if (new Date() > outpass.expiresAt) {
      return res.status(400).json({ message: 'Outpass has expired' })
    }

    const student = outpass.studentId
    if (!requireAssignedGateWarden(student, req, res)) return

    // Call FastAPI face verification
    const result = await verifyFace(image, student._id.toString(), 'student')

    // Save scan log
    const scanLog = await FaceScanLog.create({
      studentId:  student._id,
      outpassId:  outpass._id,
      scannedBy:  req.user._id,
      type:       'exit',
      matched:    result.matched,
      confidence: result.confidence,
      snapshot:   ''
    })

    // If face matched → update outpass
    if (result.matched) {
      outpass.exitScan = {
        time:       new Date(),
        matched:    true,
        confidence: result.confidence,
        snapshot:   ''
      }
      outpass.status = 'out'
      await outpass.save()

      return res.status(200).json({
        message:    'Face matched! Student exit logged.',
        matched:    true,
        confidence: result.confidence,
        student:    student.name
      })
    }

    // Face did not match
    return res.status(200).json({
      message:    'Face did not match! Manual verification needed.',
      matched:    false,
      confidence: result.confidence,
      scanLogId:  scanLog._id
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  POST /api/face/verify-return
// @access Warden2
const verifyReturn = async (req, res) => {
  try {
    const { image, outpassId } = req.body
    if (!image || !outpassId) {
      return res.status(400).json({ message: 'Image and outpassId are required' })
    }

    // Find outpass
    const outpass = await Outpass.findById(outpassId)
      .populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    // Check student is currently out
    if (!requireStatus(outpass, ['out', 'late_return'], res, 'Student has not exited yet')) return

    const student = outpass.studentId
    if (!requireAssignedGateWarden(student, req, res)) return

    // Call FastAPI face verification
    const result = await verifyFace(image, student._id.toString(), 'student')

    // Save scan log
    const scanLog = await FaceScanLog.create({
      studentId:  student._id,
      outpassId:  outpass._id,
      scannedBy:  req.user._id,
      type:       'return',
      matched:    result.matched,
      confidence: result.confidence,
      snapshot:   ''
    })

    // If face matched → update outpass
    if (result.matched) {
      outpass.returnScan = {
        time:       new Date(),
        matched:    true,
        confidence: result.confidence,
        snapshot:   ''
      }
      outpass.status = 'returned'
      await outpass.save()

      return res.status(200).json({
        message:    'Face matched! Student return logged.',
        matched:    true,
        confidence: result.confidence,
        student:    student.name
      })
    }

    // Face did not match
    return res.status(200).json({
      message:    'Face did not match! Manual verification needed.',
      matched:    false,
      confidence: result.confidence,
      scanLogId:  scanLog._id
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  POST /api/face/manual-override
// @access Warden2
const manualOverride = async (req, res) => {
  try {
    const { outpassId, type, overrideNote } = req.body
    if (!outpassId || !['exit', 'return'].includes(type)) {
      return res.status(400).json({ message: 'Valid outpassId and override type are required' })
    }
    if (!overrideNote || !overrideNote.trim()) {
      return res.status(400).json({ message: 'A manual override reason is required' })
    }

    const outpass = await Outpass.findById(outpassId).populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }
    if (!requireAssignedGateWarden(outpass.studentId, req, res)) return
    if (type === 'exit' && !requireStatus(outpass, ['approved'], res)) return
    if (type === 'return' && !requireStatus(outpass, ['out', 'late_return'], res)) return
    if (type === 'exit' && new Date() > outpass.expiresAt) {
      return res.status(409).json({ message: 'Expired outpasses cannot be overridden for exit' })
    }

    const recentFailedScan = await FaceScanLog.findOne({
      outpassId: outpass._id,
      scannedBy: req.user._id,
      type,
      matched: false,
      manualOverride: false,
      scannedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    }).sort({ scannedAt: -1 })

    if (!recentFailedScan) {
      return res.status(409).json({
        message: 'A failed face scan from the last 10 minutes is required before manual override'
      })
    }

    // Update scan log with manual override
    await FaceScanLog.create({
      studentId:      outpass.studentId._id,
      outpassId:      outpass._id,
      scannedBy:      req.user._id,
      type,
      matched:        false,
      confidence:     0,
      manualOverride: true,
      overrideNote:   overrideNote || ''
    })

    // Update outpass status
    if (type === 'exit') {
      outpass.exitScan = {
        time:    new Date(),
        matched: false
      }
      outpass.status = 'out'
    }

    if (type === 'return') {
      outpass.returnScan = {
        time:    new Date(),
        matched: false
      }
      outpass.status = 'returned'
    }

    await outpass.save()

    res.status(200).json({
      message: `Manual override applied for ${type}`
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



// @route  POST /api/face/verify-parent
// @access Public (approval-link token based)
const verifyParentFace = async (req, res) => {
  try {
    const { image, token } = req.body
    if (!image || !token) {
      return res.status(400).json({ message: 'Image and approval token are required' })
    }

    const outpass = await Outpass.findOne({
      status: 'warden_forwarded',
      parentTokens: {
        $elemMatch: {
          token,
          status: 'pending',
          expiresAt: { $gt: new Date() }
        }
      }
    })

    if (!outpass) {
      return res.status(404).json({ message: 'Approval link is invalid, expired, or already used' })
    }

    const parent = outpass.parentTokens.find(p => p.token === token)
    const result = await verifyFace(
      image,
      outpass.studentId.toString(),
      'parent',
      parent.parentIndex ?? outpass.parentTokens.indexOf(parent)
    )

    if (!result.matched) {
      return res.status(200).json(result)
    }

    const verificationToken = createParentVerificationToken({
      parentToken: token,
      outpassId: outpass._id,
      secret: process.env.JWT_SECRET
    })

    res.status(200).json({ ...result, verificationToken })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Add to exports
module.exports = { verifyExit, verifyReturn, manualOverride, verifyParentFace }





