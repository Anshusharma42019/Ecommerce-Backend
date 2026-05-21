'use strict';

const crypto = require('crypto');

/**
 * Verify Razorpay payment signature
 * signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

/**
 * Verify Stripe webhook signature
 */
const verifyStripeWebhook = (rawBody, signature) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

/**
 * Generate a secure random hex token
 * @param {number} bytes - Number of random bytes (default 32)
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Compute HMAC-SHA256 hash
 */
const hmacSHA256 = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

module.exports = { verifyRazorpaySignature, verifyStripeWebhook, generateSecureToken, hmacSHA256 };
