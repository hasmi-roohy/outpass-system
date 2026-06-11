const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const parentSchema = new mongoose.Schema({
  name:         { type: String },
  email:        { type: String },
  phone:        { type: String },
  relation:     { type: String, enum: ['Father', 'Mother', 'Guardian1', 'Guardian2'] },
  faceImageUrl: { type: String, default: '' },
  faceEncoding: { type: Array,  default: [] }
})

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone:    { type: String, required: true },
  role:     { type: String, enum: ['student', 'warden1', 'warden2', 'admin'], required: true },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNumber:   { type: String },
  department:   { type: String },
  year:         { type: String },
  warden1Id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warden2Id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  faceImageUrl: { type: String, default: '' },
  faceEncoding: { type: Array,  default: [] },
  parents:      [parentSchema],
  hostelBlock:  { type: String }
}, { timestamps: true })

// ✅ No next/done needed for async hooks
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)