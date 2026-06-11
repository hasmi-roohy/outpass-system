const User        = require('../models/User')
const Outpass     = require('../models/Outpass')
const FaceScanLog = require('../models/FaceScanLog')
const bcrypt      = require('bcryptjs')
const { registerFace } = require('../services/faceService')

// ─────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('warden1Id', 'name email')
      .populate('warden2Id', 'name email')
      .sort({ createdAt: -1 })
    res.status(200).json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addStudent = async (req, res) => {
  try {
    console.log('Add student body keys:', Object.keys(req.body))

    const {
      name, email, password, phone,
      rollNumber, department, year,
      warden1Id, warden2Id, hostelBlock,
      parents
    } = req.body

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password and phone are required' })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const studentData = {
      name, email, password, phone,
      role:      'student',
      createdBy: req.user._id
    }

    if (rollNumber)                       studentData.rollNumber  = rollNumber
    if (department)                       studentData.department  = department
    if (year)                             studentData.year        = year
    if (hostelBlock)                      studentData.hostelBlock = hostelBlock
    if (warden1Id && warden1Id !== '')    studentData.warden1Id   = warden1Id
    if (warden2Id && warden2Id !== '')    studentData.warden2Id   = warden2Id
    if (parents   && parents.length > 0) studentData.parents     = parents

    const student = await User.create(studentData)

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        _id:        student._id.toString(),
        name:       student.name,
        email:      student.email,
        rollNumber: student.rollNumber || '',
        role:       student.role
      }
    })

  } catch (error) {
    console.log('Add student error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

const editStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    const {
      name, email, phone, password,
      rollNumber, department, year,
      warden1Id, warden2Id, hostelBlock,
      parents, isActive
    } = req.body

    if (name)     student.name     = name
    if (email)    student.email    = email
    if (phone)    student.phone    = phone
    if (password) student.password = password

    if (rollNumber  !== undefined) student.rollNumber  = rollNumber
    if (department  !== undefined) student.department  = department
    if (year        !== undefined) student.year        = year
    if (hostelBlock !== undefined) student.hostelBlock = hostelBlock
    if (isActive    !== undefined) student.isActive    = isActive
    if (parents     !== undefined) student.parents     = parents

    if (warden1Id && warden1Id !== '') student.warden1Id = warden1Id
    if (warden2Id && warden2Id !== '') student.warden2Id = warden2Id

    await student.save()

    res.status(200).json({
      message: 'Student updated successfully',
      student
    })

  } catch (error) {
    console.log('Edit student error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }
    await student.deleteOne()
    res.status(200).json({ message: 'Student deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// FACE REGISTRATION
// ─────────────────────────────────────

const registerStudentFace = async (req, res) => {
  try {
    const { image } = req.body
    const studentId = req.params.id

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    const student = await User.findById(studentId)
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    const result = await registerFace(image, studentId, 'student')

    if (!result.success) {
      return res.status(400).json({ message: result.message || 'Face registration failed' })
    }

    await User.findByIdAndUpdate(studentId, {
      faceImageUrl: `known_faces/students/${studentId}/photo.jpg`
    })

    res.status(200).json({
      message: 'Student face registered successfully',
      result
    })

  } catch (error) {
    console.log('registerStudentFace error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

const registerParentFace = async (req, res) => {
  try {
    const { image, parentIndex } = req.body
    const studentId = req.params.id

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    if (parentIndex === undefined || parentIndex === null) {
      return res.status(400).json({ message: 'parentIndex is required' })
    }

    const student = await User.findById(studentId)
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    const result = await registerFace(image, studentId, 'parent', parentIndex)

    if (!result.success) {
      return res.status(400).json({ message: result.message || 'Parent face registration failed' })
    }

    res.status(200).json({
      message: `Parent ${parentIndex + 1} face registered successfully`,
      result
    })

  } catch (error) {
    console.log('registerParentFace error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// WARDEN1 MANAGEMENT
// ─────────────────────────────────────

const getAllWarden1s = async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden1' })
      .select('-password')
      .sort({ createdAt: -1 })
    res.status(200).json(wardens)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addWarden1 = async (req, res) => {
  try {
    const { name, email, password, phone, hostelBlock } = req.body
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    const warden = await User.create({
      name, email, password, phone,
      role: 'warden1',
      hostelBlock,
      createdBy: req.user._id
    })
    res.status(201).json({ message: 'Warden1 added successfully', warden })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const editWarden1 = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id)
    if (!warden || warden.role !== 'warden1') {
      return res.status(404).json({ message: 'Warden1 not found' })
    }
    const fields = ['name', 'email', 'phone', 'hostelBlock', 'isActive']
    fields.forEach(field => {
      if (req.body[field] !== undefined) warden[field] = req.body[field]
    })
    if (req.body.password) warden.password = req.body.password
    await warden.save()
    res.status(200).json({ message: 'Warden1 updated successfully', warden })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteWarden1 = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id)
    if (!warden || warden.role !== 'warden1') {
      return res.status(404).json({ message: 'Warden1 not found' })
    }
    await warden.deleteOne()
    res.status(200).json({ message: 'Warden1 deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// WARDEN2 MANAGEMENT
// ─────────────────────────────────────

const getAllWarden2s = async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden2' })
      .select('-password')
      .sort({ createdAt: -1 })
    res.status(200).json(wardens)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addWarden2 = async (req, res) => {
  try {
    const { name, email, password, phone, hostelBlock } = req.body
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    const warden = await User.create({
      name, email, password, phone,
      role: 'warden2',
      hostelBlock,
      createdBy: req.user._id
    })
    res.status(201).json({ message: 'Warden2 added successfully', warden })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const editWarden2 = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id)
    if (!warden || warden.role !== 'warden2') {
      return res.status(404).json({ message: 'Warden2 not found' })
    }
    const fields = ['name', 'email', 'phone', 'hostelBlock', 'isActive']
    fields.forEach(field => {
      if (req.body[field] !== undefined) warden[field] = req.body[field]
    })
    if (req.body.password) warden.password = req.body.password
    await warden.save()
    res.status(200).json({ message: 'Warden2 updated successfully', warden })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteWarden2 = async (req, res) => {
  try {
    const warden = await User.findById(req.params.id)
    if (!warden || warden.role !== 'warden2') {
      return res.status(404).json({ message: 'Warden2 not found' })
    }
    await warden.deleteOne()
    res.status(200).json({ message: 'Warden2 deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 })
    res.status(200).json(admins)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    const admin = await User.create({
      name, email, password, phone,
      role: 'admin',
      createdBy: req.user._id
    })
    res.status(201).json({ message: 'Admin added successfully', admin })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const editAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (!admin.createdBy) {
      return res.status(403).json({ message: 'Cannot edit super admin' })
    }
    const fields = ['name', 'email', 'phone', 'isActive']
    fields.forEach(field => {
      if (req.body[field] !== undefined) admin[field] = req.body[field]
    })
    if (req.body.password) admin.password = req.body.password
    await admin.save()
    res.status(200).json({ message: 'Admin updated successfully', admin })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (!admin.createdBy) {
      return res.status(403).json({ message: 'Cannot delete super admin' })
    }
    await admin.deleteOne()
    res.status(200).json({ message: 'Admin deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// VIEW ALL DATA
// ─────────────────────────────────────

const getAllOutpasses = async (req, res) => {
  try {
    const outpasses = await Outpass.find()
      .populate('studentId', 'name email rollNumber department')
      .populate('warden1Id', 'name email')
      .sort({ createdAt: -1 })
    res.status(200).json(outpasses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getAllScanLogs = async (req, res) => {
  try {
    const logs = await FaceScanLog.find()
      .populate('studentId', 'name email rollNumber')
      .populate('outpassId')
      .populate('scannedBy', 'name email')
      .sort({ scannedAt: -1 })
    res.status(200).json(logs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents  = await User.countDocuments({ role: 'student' })
    const totalWarden1s  = await User.countDocuments({ role: 'warden1' })
    const totalWarden2s  = await User.countDocuments({ role: 'warden2' })
    const totalOutpasses = await Outpass.countDocuments()
    const pending        = await Outpass.countDocuments({ status: 'pending' })
    const approved       = await Outpass.countDocuments({ status: 'approved' })
    const currentlyOut   = await Outpass.countDocuments({ status: 'out' })
    const lateReturns    = await Outpass.countDocuments({ status: 'late_return' })
    const failedScans    = await FaceScanLog.countDocuments({ matched: false })

    res.status(200).json({
      totalStudents, totalWarden1s, totalWarden2s,
      totalOutpasses, pending, approved,
      currentlyOut, lateReturns, failedScans
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────
module.exports = {
  getAllStudents,    addStudent,    editStudent,    deleteStudent,
  getAllWarden1s,    addWarden1,    editWarden1,    deleteWarden1,
  getAllWarden2s,    addWarden2,    editWarden2,    deleteWarden2,
  getAllAdmins,      addAdmin,      editAdmin,      deleteAdmin,
  getAllOutpasses,   getAllScanLogs, getDashboardStats,
  registerStudentFace,
  registerParentFace
}