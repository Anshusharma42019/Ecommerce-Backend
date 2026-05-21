'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const v = require('../validations/authValidation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

/** @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Registration successful }
 *       400: { description: Validation error }
 *       409: { description: Email already exists }
 */
router.post('/register', authLimiter, validate(v.register), ctrl.register);
router.post('/login', authLimiter, validate(v.login), ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.post('/refresh-token', ctrl.refreshToken);
router.get('/verify-email', ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), ctrl.resetPassword);
router.post('/send-otp', otpLimiter, validate(v.sendOTP), ctrl.sendOTP);
router.post('/verify-otp', validate(v.verifyOTP), ctrl.verifyOTP);

module.exports = router;
