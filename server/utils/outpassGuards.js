const isAssignedWarden = (outpass, userId) =>
  outpass.warden1Id?.toString() === userId?.toString()

const requireAssignedWarden = (outpass, req, res) => {
  if (!isAssignedWarden(outpass, req.user?._id)) {
    res.status(403).json({ message: 'This outpass is not assigned to you' })
    return false
  }
  return true
}

const requireAssignedGateWarden = (student, req, res) => {
  if (!student.warden2Id || student.warden2Id.toString() !== req.user?._id?.toString()) {
    res.status(403).json({ message: 'This student is not assigned to you' })
    return false
  }
  return true
}

const requireStatus = (outpass, allowedStatuses, res, message) => {
  if (!allowedStatuses.includes(outpass.status)) {
    res.status(409).json({
      message: message || `Action is not allowed while outpass is '${outpass.status}'`
    })
    return false
  }
  return true
}

module.exports = { requireAssignedWarden, requireAssignedGateWarden, requireStatus }
