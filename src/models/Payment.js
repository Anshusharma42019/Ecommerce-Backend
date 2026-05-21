'use strict';

const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../constants');

const refundSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  reason: String,
  status: { type: String, default: 'pending', enum: ['pending', 'processed', 'failed'] },
  refundId: String,   // Gateway refund ID
  processedAt: Date,
}, { _id: true, timestamps: true });

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  provider: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },

  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  // Razorpay
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Stripe
  stripePaymentIntentId: String,
  stripeClientSecret: String,

  // Generic
  transactionId: String,
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },  // Raw gateway response

  // Refunds
  refunds: [refundSchema],
  totalRefunded: { type: Number, default: 0 },

  // Webhooks
  webhookEvents: [{
    event: String,
    payload: mongoose.Schema.Types.Mixed,
    receivedAt: { type: Date, default: Date.now },
  }],

  paidAt: Date,
  failedAt: Date,
  failureCode: String,
  failureMessage: String,
}, {
  timestamps: true,
  toJSON: { versionKey: false },
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
