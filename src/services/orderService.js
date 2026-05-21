'use strict';

const orderRepo = require('../repositories/orderRepo');
const productRepo = require('../repositories/productRepo');
const cartService = require('./cartService');
const notificationService = require('./notificationService');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const ApiError = require('../helpers/ApiError');
const { parsePagination, buildPaginationMeta } = require('../helpers/paginate');
const { ORDER_STATUS, PAYMENT_METHOD, MESSAGES, NOTIFICATION_TYPE } = require('../constants');
const { uploadBuffer } = require('../config/cloudinary');

class OrderService {
  async placeOrder(userId, { items, shippingAddressId, paymentMethod, couponCode, customerNote }) {
    // Validate items & compute pricing
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      let product = null;
      // Only try to find by ID if it's a valid hex string
      if (/^[0-9a-fA-F]{24}$/.test(item.productId)) {
        product = await productRepo.findById(item.productId).catch(() => null);
      }
      
      // Fallback values if product doesn't exist in DB
      let price = product ? product.price : (item.price || 0);
      let name = product ? product.name : (item.name || 'Unknown Product');
      let variantDetails = null;

      if (product && item.variantId) {
        const variant = product.variants?.id(item.variantId);
        if (!variant) throw ApiError.badRequest('Variant not found.');
        price = variant.price;
        variantDetails = { name: variant.name, color: variant.attributes?.color, size: variant.attributes?.size };
      }

      const totalPrice = price * item.quantity;
      subtotal += totalPrice;
      orderItems.push({
        product: product ? product._id : null, // Allowed to be null now
        variant: item.variantId,
        name: name,
        slug: product ? product.slug : item.productId,
        thumbnail: product ? product.thumbnail?.url : null,
        sku: product ? product.sku : `SKU-${item.productId}`,
        variantDetails,
        quantity: item.quantity,
        price,
        compareAtPrice: product ? product.compareAtPrice : price,
        totalPrice,
      });
    }

    // Shipping & tax (simplified)
    const shippingCharge = subtotal >= 499 ? 0 : 49;
    const taxAmount = 0;
    const couponDiscount = 0; // Applied via cart service
    const totalAmount = subtotal + shippingCharge + taxAmount - couponDiscount;

    // Get user's shipping address
    const User = require('../models/User');
    const user = await User.findById(userId);
    const address = user.addresses.id(shippingAddressId);
    if (!address) throw ApiError.badRequest('Shipping address not found.');

    const order = await orderRepo.create({
      user: userId,
      items: orderItems,
      subtotal,
      shippingCharge,
      taxAmount,
      couponCode,
      couponDiscount,
      totalAmount,
      shippingAddress: address.toObject(),
      paymentMethod,
      status: paymentMethod === PAYMENT_METHOD.COD ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
      customerNote,
    });

    // Decrement stock for real products only
    for (const item of items) {
      if (/^[0-9a-fA-F]{24}$/.test(item.productId)) {
        await productRepo.decrementStock(item.productId, item.variantId, item.quantity).catch(() => {});
      }
    }

    // Clear cart
    await cartService.clearCart(userId);

    // Notify user
    await notificationService.createNotification(userId, {
      type: NOTIFICATION_TYPE.ORDER_PLACED,
      title: 'Order Placed!',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      data: { orderId: order._id },
    });

    return order;
  }

  async getUserOrders(userId, queryParams) {
    const { page, limit, skip } = parsePagination(queryParams);
    const [orders, total] = await Promise.all([
      orderRepo.findUserOrders(userId, skip, limit),
      orderRepo.count({ user: userId }),
    ]);
    return { orders, meta: buildPaginationMeta(total, page, limit) };
  }

  async getOrderById(orderId, userId, role) {
    const order = await orderRepo.findWithPayment(orderId);
    if (!order) throw ApiError.notFound('Order not found.');
    if (role !== 'admin' && order.user._id.toString() !== userId) throw ApiError.forbidden();
    return order;
  }

  async cancelOrder(orderId, userId, reason) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found.');
    if (order.user.toString() !== userId) throw ApiError.forbidden();

    const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
    if (!cancellable.includes(order.status)) throw ApiError.badRequest(MESSAGES.ORDER_CANCEL_FORBIDDEN);

    // Re-stock
    for (const item of order.items) {
      await productRepo.incrementStock(item.product, item.variant, item.quantity);
    }

    const updated = await orderRepo.addStatusHistory(orderId, ORDER_STATUS.CANCELLED, reason, userId);

    await notificationService.createNotification(userId, {
      type: NOTIFICATION_TYPE.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled.`,
      data: { orderId: order._id },
    });

    return updated;
  }

  async requestReturn(orderId, userId, reason) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found.');
    if (order.user.toString() !== userId) throw ApiError.forbidden();
    if (order.status !== ORDER_STATUS.DELIVERED) throw ApiError.badRequest('Only delivered orders can be returned.');

    return orderRepo.updateById(orderId, {
      status: ORDER_STATUS.RETURN_REQUESTED,
      returnReason: reason,
      returnRequestedAt: new Date(),
      $push: { statusHistory: { status: ORDER_STATUS.RETURN_REQUESTED, note: reason, updatedBy: userId } },
    }, { new: true });
  }

  async updateOrderStatus(orderId, status, note, adminId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found.');
    const updated = await orderRepo.addStatusHistory(orderId, status, note, adminId);

    await notificationService.createNotification(order.user.toString(), {
      type: NOTIFICATION_TYPE[`ORDER_${status.toUpperCase()}`] || NOTIFICATION_TYPE.SYSTEM,
      title: `Order ${status}`,
      message: `Your order #${order.orderNumber} status: ${status}.`,
      data: { orderId: order._id },
    });

    return updated;
  }

  async generateInvoice(orderId) {
    const order = await orderRepo.findWithPayment(orderId);
    if (!order) throw ApiError.notFound('Order not found.');

    const pdfBuffer = await generateInvoicePDF(order);
    const uploaded = await uploadBuffer(pdfBuffer, 'invoices', {
      public_id: `invoice_${order.orderNumber}`,
      format: 'pdf',
      resource_type: 'raw',
    });

    await orderRepo.updateById(orderId, { invoiceUrl: uploaded.secure_url, invoiceNumber: order.orderNumber });
    return { invoiceUrl: uploaded.secure_url };
  }
}

module.exports = new OrderService();
