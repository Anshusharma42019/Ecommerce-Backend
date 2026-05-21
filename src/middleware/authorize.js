'use strict';

const ApiError = require('../helpers/ApiError');

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin') or authorize('admin', 'vendor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access restricted to: ${roles.join(', ')}`));
    }
    next();
  };
};

module.exports = { authorize };
