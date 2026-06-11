const Outpass = require('../models/Outpass')
const FaceScanLog = require('../models/FaceScanLog')
const { verifyFace } = require('../services/faceService')

// @route  POST /api/face/verify-exit
// @access Warden2
const verifyExit = async (req, res) => {
  try {
    const { image, outpassId } = req.body

    // Find outpass
    const outpass = await Outpass.findById(outpassId)
      .populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    // Check outpass is approved
    if (outpass.status !== 'approved') {
      return res.status(400).json({ message: 'Outpass is not approved yet' })
    }

    // Check outpass not expired
    if (new Date() > outpass.expiresAt) {
      return res.status(400).json({ message: 'Outpass has expired' })
    }

    const student = outpass.studentId

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
      snapshot:   image
    })

    // If face matched → update outpass
    if (result.matched) {
      outpass.exitScan = {
        time:       new Date(),
        matched:    true,
        confidence: result.confidence,
        snapshot:   image
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

    // Find outpass
    const outpass = await Outpass.findById(outpassId)
      .populate('studentId')

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    // Check student is currently out
    if (outpass.status !== 'out' && outpass.status !== 'late_return') {
      return res.status(400).json({ message: 'Student has not exited yet' })
    }

    const student = outpass.studentId

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
      snapshot:   image
    })

    // If face matched → update outpass
    if (result.matched) {
      outpass.returnScan = {
        time:       new Date(),
        matched:    true,
        confidence: result.confidence,
        snapshot:   image
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

    const outpass = await Outpass.findById(outpassId)

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found' })
    }

    // Update scan log with manual override
    await FaceScanLog.create({
      studentId:      outpass.studentId,
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
// @access Public (token based)
const verifyParentFace = async (req, res) => {
  try {
    const { image, studentId, parentIndex } = req.body

    const result = await verifyFace(image, studentId, 'parent', parentIndex)

    res.status(200).json(result)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Add to exports
module.exports = { verifyExit, verifyReturn, manualOverride, verifyParentFace }





