'use strict';

const { getRazorpay, getStripe } = require('../config/payment');
const { paymentRepo } = require('../repositories');
const orderRepo = require('../repositories/orderRepo');
const notificationService = require('./notificationService');
const { verifyRazorpaySignature, verifyStripeWebhook } = require('../utils/cryptoUtils');
const ApiError = require('../helpers/ApiError');
const { PAYMENT_STATUS, PAYMENT_METHOD, ORDER_STATUS, NOTIFICATION_TYPE, MESSAGES } = require('../constants');

class PaymentService {
  async createRazorpayOrder(orderId, userId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found.');
    if (order.user.toString() !== userId) throw ApiError.forbidden();

    const razorpay = getRazorpay();
    if (!razorpay) throw ApiError.internal('Razorpay not configured.');

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: orderId.toString(), userId },
    });

    const payment = await paymentRepo.create({
      order: orderId, user: userId,
      provider: PAYMENT_METHOD.RAZORPAY,
      amount: order.totalAmount,
      currency: 'INR',
      razorpayOrderId: rzpOrder.id,
      status: PAYMENT_STATUS.CREATED,
    });

    await orderRepo.updateById(orderId, { payment: payment._id });
    return { razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, paymentId: payment._id };
  }

  async verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }) {
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) throw ApiError.badRequest(MESSAGES.INVALID_SIGNATURE);

    const payment = await paymentRepo.findByRazorpayOrderId(razorpayOrderId);
    if (!payment) throw ApiError.notFound('Payment record not found.');

    await paymentRepo.updateById(payment._id, {
      razorpayPaymentId,
      razorpaySignature,
      status: PAYMENT_STATUS.CAPTURED,
      paidAt: new Date(),
    });

    await orderRepo.addStatusHistory(orderId, ORDER_STATUS.CONFIRMED, 'Payment captured', null);
    await orderRepo.updateById(orderId, { paymentStatus: PAYMENT_STATUS.PAID });

    await notificationService.createNotification(payment.user.toString(), {
      type: NOTIFICATION_TYPE.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Payment of ₹${payment.amount} received for your order.`,
      data: { orderId, paymentId: payment._id },
    });

    return { message: MESSAGES.PAYMENT_SUCCESS };
  }

  async createStripePaymentIntent(orderId, userId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found.');

    const stripe = getStripe();
    if (!stripe) throw ApiError.internal('Stripe not configured.');

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'inr',
      metadata: { orderId: orderId.toString(), userId },
    });

    const payment = await paymentRepo.create({
      order: orderId, user: userId,
      provider: PAYMENT_METHOD.STRIPE,
      amount: order.totalAmount,
      currency: 'INR',
      stripePaymentIntentId: intent.id,
      stripeClientSecret: intent.client_secret,
      status: PAYMENT_STATUS.CREATED,
    });

    await orderRepo.updateById(orderId, { payment: payment._id });
    return { clientSecret: intent.client_secret, paymentId: payment._id };
  }

  async handleRazorpayWebhook(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature) throw ApiError.unauthorized('Invalid webhook signature.');

    const event = JSON.parse(rawBody);
    const payment = await paymentRepo.findByRazorpayOrderId(event.payload?.payment?.entity?.order_id);
    if (payment) {
      await paymentRepo.updateById(payment._id, {
        $push: { webhookEvents: { event: event.event, payload: event.payload, receivedAt: new Date() } },
      });
    }
    return { received: true };
  }

  async initiateRefund(paymentId, amount, reason) {
    const payment = await paymentRepo.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found.');

    let refundId;
    if (payment.provider === PAYMENT_METHOD.RAZORPAY) {
      const razorpay = getRazorpay();
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(amount * 100),
        notes: { reason },
      });
      refundId = refund.id;
    }

    await paymentRepo.updateById(paymentId, {
      $push: { refunds: { amount, reason, refundId, status: 'processed', processedAt: new Date() } },
      $inc: { totalRefunded: amount },
    });

    return { message: MESSAGES.REFUND_INITIATED, refundId };
  }
}

module.exports = new PaymentService();
