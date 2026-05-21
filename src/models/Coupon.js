'use strict';

const mongoose = require('mongoose');
const { COUPON_TYPE } = require('../constants');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: Object.values(COUPON_TYPE), required: true },
  value: { type: Number, required: true, min: 0 },  // % or flat ₹
  maxDiscount: Number,  // Cap for percentage coupons
  minOrderAmount: { type: Number, default: 0 },
  description: String,
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  usageLimit: { type: Number, default: null },  // null = unlimited
  usagePerUser: { type: Number, default: 1 },
  totalUsed: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  freeShipping: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { versionKey: false } });

// Note: code index created automatically by unique:true
couponSchema.index({ endDate: 1, isActive: 1 });

couponSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

couponSchema.virtual('isUsageLimitReached').get(function () {
  return this.usageLimit !== null && this.totalUsed >= this.usageLimit;
});

module.exports = mongoose.model('Coupon', couponSchema);
