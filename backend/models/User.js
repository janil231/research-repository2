const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema for both Student and Admin
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // Student fields
  schoolId: { type: String, unique: true, sparse: true },
  department: { type: String },
  // Admin fields
  username: { type: String, unique: true, sparse: true },
  favoriteColor: { type: String }, // Deprecated - kept for backward compatibility
  auth_secret: { type: String }, // TOTP secret key for Google Authenticator
  totpAttempts: { type: Number, default: 0 }, // Track failed TOTP attempts
  totpLockedUntil: { type: Date }, // Lock account after too many failed attempts
  // Common fields
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], required: true, default: 'student' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);

