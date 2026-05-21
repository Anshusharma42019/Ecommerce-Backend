'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
  },
  password: { type: String, minlength: 8, select: false },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER,
  },
  avatar: {
    url: String,
    publicId: String,
  },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // OTP fields (not stored in DB long-term — cleared after verify)
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },

  // Password reset
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },

  // Refresh token management
  refreshTokens: { type: [String], select: false },

  // OAuth
  googleId: { type: String, sparse: true },

  // Metadata
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email and phone indexes are created automatically by unique:true
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtual ──────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save: Hash Password ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  delete obj.refreshTokens;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
