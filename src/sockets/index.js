'use strict';

const { Server } = require('socket.io');
const { verifyToken } = require('../helpers/tokenHelper');
const { TOKEN_TYPE } = require('../constants');
const logger = require('../utils/logger');
const { orderSocket } = require('./orderSocket');

let io = null;

const initializeSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required.'));
      const payload = verifyToken(token, TOKEN_TYPE.ACCESS);
      socket.userId = payload.userId;
      socket.role = payload.role;
      next();
    } catch (err) {
      logger.warn('Socket auth failed:', err.message);
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join user-specific room for private notifications
    socket.join(`user:${socket.userId}`);

    // Register order events
    orderSocket(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info('✅ Socket.IO initialized.');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized.');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initializeSockets, getIO, emitToUser };
