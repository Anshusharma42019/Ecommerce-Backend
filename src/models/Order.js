'use strict';

const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  slug: String,
  thumbnail: String,
  sku: String,
  variantDetails: { name: String, color: String, size: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },      // Price at order time
  compareAtPrice: Number,
  totalPrice: { type: Number, required: true },  // price * qty
}, { _id: true });

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String },
  location: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },  // e.g., TRV-20240101-0001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [orderItemSchema],

  // Pricing breakdown
  subtotal: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // Shipping address (snapshot)
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },

  // Payment
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // Status
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],

  // Tracking
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    events: [trackingEventSchema],
  },

  // Invoice
  invoiceNumber: String,
  invoiceUrl: String,

  // Notes
  customerNote: String,
  adminNote: String,

  // Return / Cancel
  cancellationReason: String,
  returnReason: String,
  returnRequestedAt: Date,
  cancelledAt: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
// Note: orderNumber index created automatically by unique:true
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

// ─── Pre-save: auto-generate order number ─────────────────────────────────────
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.orderNumber = `TRV-${date}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
