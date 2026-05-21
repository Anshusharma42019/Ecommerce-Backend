'use strict';

const Joi = require('joi');

const register = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().allow('').pattern(/^[6-9]\d{9}$/).optional().messages({ 'string.pattern.base': 'Invalid Indian phone number.' }),
  password: Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({ 'string.pattern.base': 'Password must have uppercase, lowercase, and a number.' }),
  address: Joi.string().allow('').trim().optional(),
  pincode: Joi.string().allow('').trim().optional(),
  landmark: Joi.string().allow('').trim().optional(),
  city: Joi.string().allow('').trim().optional(),
  state: Joi.string().allow('').trim().optional(),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
});

const sendOTP = Joi.object({
  emailOrPhone: Joi.string().required(),
});

const verifyOTP = Joi.object({
  emailOrPhone: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, forgotPassword, resetPassword, sendOTP, verifyOTP, refreshToken };
