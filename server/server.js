const express    = require('express')
const mongoose   = require('mongoose')
const cors       = require('cors')
const dotenv     = require('dotenv')
const cron       = require('node-cron')
const rateLimit  = require('express-rate-limit')
const Outpass    = require('./models/Outpass')

dotenv.config()

// ─────────────────────────────────────
// ENV Validation
// ─────────────────────────────────────
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'AI_SERVICE_URL',
  'CLIENT_URL',
  'EMAIL_USER',
  'EMAIL_PASS'
]

requiredEnvVars.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`)
    process.exit(1)
  }
})

console.log('✅ Environment variables validated')

const app = express()
app.set('trust proxy', 1)

// ─────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────

// General API limit — 100 requests per 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false
})

// Auth limit — 10 attempts per 15 min (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false
})

// Face scan limit — 20 per 5 min (prevent abuse)
const faceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max:      20,
  message:  { message: 'Too many face scan requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false
})

// ─────────────────────────────────────
// Middleware
// ─────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Apply rate limiters
app.use('/api/',       generalLimiter)
app.use('/api/auth',   authLimiter)
app.use('/api/face',   faceLimiter)

// ─────────────────────────────────────
// Routes
// ─────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'))
app.use('/api/outpass', require('./routes/outpass'))
app.use('/api/admin',   require('./routes/admin'))
app.use('/api/face',    require('./routes/face'))
app.use('/api/chat',    require('./routes/chat'))

// ─────────────────────────────────────
// Health check
// ─────────────────────────────────────
app.get('/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1

  res.status(databaseConnected ? 200 : 503).json({
    status:  databaseConnected ? 'ok' : 'degraded',
    service: 'Outpass Management API',
    database: databaseConnected ? 'connected' : 'disconnected',
    time:    new Date().toISOString()
  })
})

// ─────────────────────────────────────
// Global error handler
// ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

// ─────────────────────────────────────
// CRON JOB 1 — No Parent Response Alert
// Runs every 5 minutes
// ─────────────────────────────────────
cron.schedule('*/5 * * * *', async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const outpasses = await Outpass.find({
      status:                     'warden_forwarded',
      wardenUpdatedAt:            { $lte: oneHourAgo },
      'parentNoResponse.alerted': false
    })

    for (const outpass of outpasses) {
      const allPending = outpass.parentTokens.every(
        p => p.status === 'pending'
      )

      if (allPending) {
        outpass.parentNoResponse.alerted   = true
        outpass.parentNoResponse.alertedAt = new Date()
        await outpass.save()
        console.log(`⚠️ No parent response alert: ${outpass._id}`)
      }
    }

    // Close parent-forwarded requests after all pending parent links expire.
    const now = new Date()
    const staleParentOutpasses = await Outpass.find({
      status: 'warden_forwarded',
      parentTokens: { $ne: [] }
    })

    for (const outpass of staleParentOutpasses) {
      const pendingParents = outpass.parentTokens.filter(parent => parent.status === 'pending')
      const allPendingLinksExpired = pendingParents.length > 0 && pendingParents.every(
        parent => parent.expiresAt && parent.expiresAt < now
      )

      if (allPendingLinksExpired) {
        outpass.status = 'expired'
        outpass.parentNoResponse.alerted = true
        outpass.parentNoResponse.alertedAt = outpass.parentNoResponse.alertedAt || now
        outpass.wardenFinalDecision.done = true
        outpass.wardenFinalDecision.decision = 'parent_link_expired'
        outpass.wardenFinalDecision.note = 'Parent approval links expired before any response'
        outpass.wardenFinalDecision.decidedAt = now
        await outpass.save()
        console.log(`Auto-expired stale parent approval links for outpass: ${outpass._id}`)
      }
    }

  } catch (error) {
    console.log('Cron error (no response):', error.message)
  }
})

// ─────────────────────────────────────
// CRON JOB 2 — Late Returns + Expiry
// Runs every 30 minutes
// ─────────────────────────────────────
cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date()

    // Mark late returns
    const lateOutpasses = await Outpass.find({
      status:    'out',
      expiresAt: { $lt: now }
    })
    for (const outpass of lateOutpasses) {
      outpass.status = 'late_return'
      await outpass.save()
      console.log(`⚠️ Late return marked: ${outpass._id}`)
    }

    // Mark expired approved outpasses
    const expiredOutpasses = await Outpass.find({
      status:    'approved',
      expiresAt: { $lt: now }
    })
    for (const outpass of expiredOutpasses) {
      outpass.status = 'expired'
      await outpass.save()
      console.log(`⚠️ Outpass expired: ${outpass._id}`)
    }

  } catch (error) {
    console.log('Cron error (30min):', error.message)
  }
})

// ─────────────────────────────────────
// Start Server
// ─────────────────────────────────────
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
