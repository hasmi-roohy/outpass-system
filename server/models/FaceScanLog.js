
const mongoose = require('mongoose')

const faceScanLogSchema = new mongoose.Schema({

  // Who was scanned
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Which outpass this scan belongs to
  outpassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outpass', required: true },

  // Which warden2 did the scan
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Exit or return
  type: { type: String, enum: ['exit', 'return'], required: true },

  // Face match result
  matched:    { type: Boolean, required: true },
  confidence: { type: Number,  default: 0 },
  snapshot:   { type: String,  default: '' },

  // Manual override by warden2
  manualOverride: { type: Boolean, default: false },
  overrideNote:   { type: String,  default: '' },

  // When scan happened
  scannedAt: { type: Date, default: Date.now }

}, { timestamps: true })

faceScanLogSchema.index({ scannedAt: -1 })
faceScanLogSchema.index({ studentId: 1, scannedAt: -1 })
faceScanLogSchema.index({ type: 1, matched: 1, scannedAt: -1 })
faceScanLogSchema.index({ outpassId: 1, type: 1 })
faceScanLogSchema.index({ scannedBy: 1, scannedAt: -1 })

module.exports = mongoose.model('FaceScanLog', faceScanLogSchema)
