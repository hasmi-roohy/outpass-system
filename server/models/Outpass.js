const mongoose = require('mongoose')

// ─────────────────────────────────────
// Parent Token Schema
// ─────────────────────────────────────
const parentTokenSchema = new mongoose.Schema({
  name:            { type: String },
  email:           { type: String },
  phone:           { type: String },
  relation:        { type: String },
  token:           { type: String },
  status:          { type: String, enum: ['pending', 'approved', 'rejected', 'deactivated'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  respondedAt:     { type: Date },
  expiresAt:       { type: Date },
  parentIndex:     { type: Number }
}, { _id: false })

// ─────────────────────────────────────
// Main Outpass Schema
// ─────────────────────────────────────
const outpassSchema = new mongoose.Schema({

  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  warden1Id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  reason:      { type: String, required: true },
  destination: { type: String, required: true },
  fromDate:    { type: Date,   required: true },
  toDate:      { type: Date,   required: true },
  fromTime:    { type: String },
  toTime:      { type: String },
  requestedAt: { type: Date,   default: Date.now },
  expiresAt:   { type: Date },

  // ── Stage 1: Warden ──
  wardenStatus:    { type: String, enum: ['pending', 'forwarded', 'rejected'], default: 'pending' },
  wardenNote:      { type: String, default: '' },
  wardenUpdatedAt: { type: Date },

  // ── Stage 2: Parents ──
  parentTokens: [parentTokenSchema],

  parentStatus:     { type: String, enum: ['pending', 'approved', 'rejected', 'call-approved'], default: 'pending' },
  parentApprovedBy: { type: String },
  parentApprovedAt: { type: Date },

  callOverride: {
    done:        { type: Boolean, default: false },
    wardenNote:  { type: String,  default: '' },
    overriddenAt:{ type: Date }
  },

  parentNoResponse: {
    alerted:   { type: Boolean, default: false },
    alertedAt: { type: Date }
  },

  wardenFinalDecision: {
    done:      { type: Boolean, default: false },
    decision:  { type: String,  default: '' },
    note:      { type: String,  default: '' },
    decidedAt: { type: Date }
  },

  // ── Stage 3: Gate Scans ──
  exitScan: {
    time:       { type: Date },
    matched:    { type: Boolean },
    confidence: { type: Number },
    snapshot:   { type: String }
  },

  returnScan: {
    time:       { type: Date },
    matched:    { type: Boolean },
    confidence: { type: Number },
    snapshot:   { type: String }
  },

  // ── Overall Status ──
  status: {
    type:    String,
    enum:    ['pending', 'warden_forwarded', 'approved', 'rejected', 'cancelled', 'out', 'returned', 'late_return', 'expired'],
    default: 'pending'
  }

}, { timestamps: true })

// ─────────────────────────────────────
// Indexes — speeds up frequent queries
// ─────────────────────────────────────
outpassSchema.index({ studentId: 1, status: 1 })
outpassSchema.index({ warden1Id: 1, status: 1 })
outpassSchema.index({ warden1Id: 1, wardenStatus: 1 })
outpassSchema.index({ 'parentTokens.token': 1 })
outpassSchema.index({ status: 1, expiresAt: 1 })
outpassSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Outpass', outpassSchema)
