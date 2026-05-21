'use strict';

const logger = require('../utils/logger');
const ApiError = require('../helpers/ApiError');
const { HTTP_STATUS, MESSAGES } = require('../constants');

/**
 * 404 Not Found handler — attach after all routes
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler — must have 4 arguments
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  let message = err.message || MESSAGES.INTERNAL_ERROR;
  let errors = err.errors || null;

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = MESSAGES.VALIDATION_ERROR;
  }

  // MongoDB Duplicate Key
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  }

  // JWT errors handled in tokenHelper already, but catch residual
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid or expired token.';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}`, {
      message: err.message,
      stack: err.stack,
      userId: req.user?.id,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
