'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a numeric OTP
 * @param {number} length - OTP length (default 6)
 */
const generateOTP = (length = 6) => {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return String(crypto.randomInt(min, max));
};

/**
 * Hash OTP using bcrypt before storing
 * @param {string} otp - Plain OTP
 * @returns {Promise<string>} Hashed OTP
 */
const hashOTP = async (otp) => {
  return bcrypt.hash(otp, 10);
};

/**
 * Compare plain OTP against hashed OTP
 * @param {string} plain - Plain OTP from user
 * @param {string} hashed - Stored hashed OTP
 */
const compareOTP = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

module.exports = { generateOTP, hashOTP, compareOTP };
