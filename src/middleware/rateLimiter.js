'use strict';

const rateLimit = require('express-rate-limit');
const { MESSAGES, HTTP_STATUS } = require('../constants');

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: MESSAGES.RATE_LIMIT,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    ...options,
  });

// General API rate limiter
const generalLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: MESSAGES.RATE_LIMIT,
});

// Strict auth limiter (login, register, forgot-password)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  skipSuccessfulRequests: true,
});

// OTP limiter
const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

// Payment limiter
const paymentLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
});

module.exports = { generalLimiter, authLimiter, otpLimiter, paymentLimiter };
