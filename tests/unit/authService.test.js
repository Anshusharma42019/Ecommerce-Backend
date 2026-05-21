'use strict';

// Load env before requiring helpers
require('dotenv').config();
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32chars_minimum';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_minimum';
process.env.JWT_RESET_PASSWORD_SECRET = 'test_reset_secret';
process.env.JWT_EMAIL_VERIFY_SECRET = 'test_verify_secret';

const { generateOTP, hashOTP, compareOTP } = require('../../src/utils/otpUtils');
const { generateToken, verifyToken } = require('../../src/helpers/tokenHelper');
const { TOKEN_TYPE } = require('../../src/constants');

describe('OTP Utilities', () => {
  test('generateOTP returns a 6-digit string', () => {
    const otp = generateOTP(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  test('hashOTP and compareOTP work correctly', async () => {
    const otp = '123456';
    const hashed = await hashOTP(otp);
    expect(hashed).not.toBe(otp);
    const match = await compareOTP(otp, hashed);
    expect(match).toBe(true);
  });

  test('compareOTP returns false for wrong OTP', async () => {
    const hashed = await hashOTP('123456');
    const match = await compareOTP('654321', hashed);
    expect(match).toBe(false);
  });
});

describe('Token Helpers', () => {
  const payload = { userId: 'user123', role: 'user' };

  test('generates and verifies access token', () => {
    const token = generateToken(payload, TOKEN_TYPE.ACCESS);
    expect(token).toBeTruthy();
    const decoded = verifyToken(token, TOKEN_TYPE.ACCESS);
    expect(decoded.userId).toBe('user123');
    expect(decoded.role).toBe('user');
  });

  test('throws on invalid token', () => {
    expect(() => verifyToken('invalid_token', TOKEN_TYPE.ACCESS)).toThrow();
  });

  test('throws on wrong token type', () => {
    const token = generateToken(payload, TOKEN_TYPE.REFRESH);
    expect(() => verifyToken(token, TOKEN_TYPE.ACCESS)).toThrow();
  });
});
