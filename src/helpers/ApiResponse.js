'use strict';

const { HTTP_STATUS } = require('../constants');

/**
 * Standard API success response wrapper
 * @param {object} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status code
 * @param {object} meta - Optional pagination / extra metadata
 */
const sendSuccess = (res, message = 'Success', data = null, statusCode = HTTP_STATUS.OK, meta = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Standard API error response wrapper
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Validation errors or extra error details
 */
const sendError = (res, message = 'Error', statusCode = HTTP_STATUS.INTERNAL_ERROR, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated list response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Array of results
 * @param {object} pagination - { page, limit, total, totalPages }
 */
const sendPaginated = (res, message, data, pagination) => {
  return sendSuccess(res, message, data, HTTP_STATUS.OK, { pagination });
};

module.exports = { sendSuccess, sendError, sendPaginated };
