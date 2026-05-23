'use strict';

const paymentService = require('../services/paymentService');
const { sendSuccess } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES } = require('../constants');

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const result = await paymentService.createRazorpayOrder(req.params.orderId, req.user.id);
  sendSuccess(res, MESSAGES.PAYMENT_INITIATED, result);
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyRazorpayPayment(req.body);
  sendSuccess(res, result.message);
});

const createStripeIntent = asyncHandler(async (req, res) => {
  const result = await paymentService.createStripePaymentIntent(req.params.orderId, req.user.id);
  sendSuccess(res, MESSAGES.PAYMENT_INITIATED, result);
});

// Raw body required for webhook — set in route config
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  await paymentService.handleRazorpayWebhook(req.rawBody, signature);
  res.status(200).json({ received: true });
});

const initiateRefund = asyncHandler(async (req, res) => {
  const result = await paymentService.initiateRefund(req.params.paymentId, req.body.amount, req.body.reason);
  sendSuccess(res, result.message);
});

const failRazorpayPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.failPayment(req.params.orderId, req.body);
  sendSuccess(res, result.message);
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment, failRazorpayPayment, createStripeIntent, razorpayWebhook, initiateRefund };


