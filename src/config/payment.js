'use strict';

const Razorpay = require('razorpay');
const Stripe = require('stripe');
const logger = require('../utils/logger');

// ─── Razorpay ─────────────────────────────────────────────────────────────────
let razorpayInstance = null;

const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay credentials not configured.');
    return null;
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  logger.info('✅ Razorpay initialized.');
  return razorpayInstance;
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
let stripeInstance = null;

const getStripe = () => {
  if (stripeInstance) return stripeInstance;

  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('Stripe secret key not configured.');
    return null;
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10',
  });

  logger.info('✅ Stripe initialized.');
  return stripeInstance;
};

module.exports = { getRazorpay, getStripe };
