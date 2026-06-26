const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const parentSchema = new mongoose.Schema({
  name:         { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  relation:     { type: String, enum: ['Father', 'Mother', 'Guardian1', 'Guardian2'] },
  faceImageUrl: { type: String, default: '' },
  faceEncoding: { type: Array,  default: [] }
})

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone:    { type: String, required: true, trim: true },
  role:     { type: String, enum: ['student', 'warden1', 'warden2', 'admin'], required: true },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNumber:   { type: String, trim: true },
  department:   { type: String, trim: true },
  year:         { type: String, trim: true },
  warden1Id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warden2Id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  faceImageUrl: { type: String, default: '' },
  faceEncoding: { type: Array,  default: [] },
  parents:      [parentSchema],
  hostelBlock:  { type: String, trim: true }
}, { timestamps: true })

// ✅ No next/done needed for async hooks
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const removeSensitiveFields = (doc, ret) => {
  delete ret.password
  return ret
}

userSchema.set('toJSON', { transform: removeSensitiveFields })
userSchema.set('toObject', { transform: removeSensitiveFields })

userSchema.index({ role: 1, createdAt: -1 })
userSchema.index({ role: 1, isActive: 1, createdAt: -1 })
userSchema.index({ role: 1, rollNumber: 1 })
userSchema.index({ warden1Id: 1 })
userSchema.index({ warden2Id: 1 })

module.exports = mongoose.model('User', userSchema)
