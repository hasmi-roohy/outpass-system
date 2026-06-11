const User = require('../models/User')
const jwt = require('jsonwebtoken')

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    console.log('Register body:', req.body) // ← ADD THIS

    const { name, email, password, phone, role } = req.body

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role
    })

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id, user.role)
    })

  } catch (error) {
    console.log('Register error:', error) // ← ADD THIS
    res.status(500).json({ message: error.message })
  }
}

// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })

    // Check user exists + password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' })
    }

    // Return user + token
    res.status(200).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id, user.role)
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { registerUser, loginUser }
