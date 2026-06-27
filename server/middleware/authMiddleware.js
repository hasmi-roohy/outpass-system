const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    let token

    // Check if token exists in headers
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'Not authorized, account unavailable' })
      }

      next()
    } else {
      res.status(401).json({ message: 'Not authorized, no token' })
    }

  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

// Check specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role '${req.user.role}' is not allowed` 
      })
    }
    next()
  }
}

module.exports = { protect, authorizeRoles }
