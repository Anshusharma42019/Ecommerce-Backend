'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../constants');

// Webhook — raw body needed for signature verification
router.post('/webhook/razorpay',
  express.raw({ type: 'application/json' }),
  (req, res, next) => { req.rawBody = req.body; next(); },
  ctrl.razorpayWebhook
);

router.use(authenticate);

router.post('/razorpay/verify', paymentLimiter, ctrl.verifyRazorpayPayment);
router.post('/razorpay/fail/:orderId', paymentLimiter, ctrl.failRazorpayPayment);
router.post('/razorpay/:orderId', paymentLimiter, ctrl.createRazorpayOrder);
router.post('/stripe/:orderId', paymentLimiter, ctrl.createStripeIntent);
router.post('/refund/:paymentId', authorize(ROLES.ADMIN), ctrl.initiateRefund);

module.exports = router;
