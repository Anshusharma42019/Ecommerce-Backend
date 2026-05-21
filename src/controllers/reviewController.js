'use strict';

const reviewService = require('../services/reviewService');
const { sendSuccess, sendPaginated } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES, HTTP_STATUS } = require('../constants');

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  sendSuccess(res, MESSAGES.CREATED, review, HTTP_STATUS.CREATED);
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.getProductReviews(req.params.productId, req.query);
  sendPaginated(res, MESSAGES.FETCHED, reviews, meta);
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user.id, req.body);
  sendSuccess(res, MESSAGES.UPDATED, review);
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, MESSAGES.DELETED);
});

const voteHelpful = asyncHandler(async (req, res) => {
  const review = await reviewService.voteHelpful(req.params.id, req.user.id, req.body.helpful);
  sendSuccess(res, 'Vote recorded.', review);
});

module.exports = { createReview, getProductReviews, updateReview, deleteReview, voteHelpful };
