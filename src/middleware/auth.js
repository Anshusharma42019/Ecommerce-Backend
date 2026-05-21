'use strict';

const { extractBearerToken, verifyToken } = require('../helpers/tokenHelper');
const userRepo = require('../repositories/userRepo');
const ApiError = require('../helpers/ApiError');
const { TOKEN_TYPE } = require('../constants');

/**
 * Authenticate JWT access token.
 * Attaches req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization)
      || req.cookies?.accessToken;

    if (!token) throw ApiError.unauthorized();

    const payload = verifyToken(token, TOKEN_TYPE.ACCESS);
    const user = await userRepo.findById(payload.userId);

    if (!user) throw ApiError.unauthorized('User no longer exists.');
    if (!user.isActive) throw ApiError.forbidden('Account is inactive.');

    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — sets req.user if token present, but doesn't fail if absent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token, TOKEN_TYPE.ACCESS);
      const user = await userRepo.findById(payload.userId);
      if (user && user.isActive) req.user = { id: user._id.toString(), role: user.role };
    }
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { authenticate, optionalAuth };
