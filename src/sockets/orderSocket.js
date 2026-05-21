'use strict';

const logger = require('../utils/logger');

/**
 * Handle order-related real-time events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
const orderSocket = (io, socket) => {
  // Subscribe to real-time tracking for a specific order
  socket.on('order:subscribe', (orderId) => {
    socket.join(`order:${orderId}`);
    logger.info(`Socket ${socket.id} subscribed to order:${orderId}`);
  });

  socket.on('order:unsubscribe', (orderId) => {
    socket.leave(`order:${orderId}`);
  });
};

/**
 * Broadcast order status update to all subscribers of that order
 * Called from orderService.updateOrderStatus()
 */
const emitOrderStatusUpdate = (io, orderId, status, data = {}) => {
  if (!io) return;
  io.to(`order:${orderId}`).emit('order:status_updated', {
    orderId,
    status,
    ...data,
    timestamp: new Date().toISOString(),
  });
  logger.info(`Emitted order:status_updated for order ${orderId} → ${status}`);
};

module.exports = { orderSocket, emitOrderStatusUpdate };
