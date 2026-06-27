const User = require('../models/User')
const jwt = require('jsonwebtoken')

const cleanText = value => typeof value === 'string' ? value.trim() : ''
const cleanEmail = value => cleanText(value).toLowerCase()

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// @route  POST /api/auth/register
// @access Admin
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body
    const normalizedEmail = cleanEmail(email)

    if (!cleanText(name) || !normalizedEmail || !password || !cleanText(phone) || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = await User.create({
      name: cleanText(name),
      email: normalizedEmail,
      password,
      phone: cleanText(phone),
      role
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = cleanEmail(email)

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' })
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @route  GET /api/auth/me
// @access Authenticated
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('warden1Id', 'name email phone')
      .populate('warden2Id', 'name email phone')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { registerUser, loginUser, getMe }
