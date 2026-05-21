'use strict';

const { reviewRepo } = require('../repositories');
const orderRepo = require('../repositories/orderRepo');
const ApiError = require('../helpers/ApiError');
const { parsePagination, buildPaginationMeta } = require('../helpers/paginate');

class ReviewService {
  async createReview(userId, { productId, orderId, rating, title, comment, images }) {
    const existing = await reviewRepo.findUserReview(productId, userId);
    if (existing) throw ApiError.conflict('You have already reviewed this product.');

    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await orderRepo.findOne({ _id: orderId, user: userId, status: 'delivered' });
      isVerifiedPurchase = !!order;
    }

    return reviewRepo.create({ product: productId, user: userId, order: orderId, rating, title, comment, images, isVerifiedPurchase });
  }

  async getProductReviews(productId, queryParams) {
    const { page, limit, skip } = parsePagination(queryParams);
    const [reviews, total] = await Promise.all([
      reviewRepo.findByProduct(productId, skip, limit),
      reviewRepo.count({ product: productId, isApproved: true }),
    ]);
    return { reviews, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateReview(reviewId, userId, updateData) {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw ApiError.notFound('Review not found.');
    if (review.user.toString() !== userId) throw ApiError.forbidden();
    return reviewRepo.updateById(reviewId, updateData, { new: true });
  }

  async deleteReview(reviewId, userId, role) {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw ApiError.notFound('Review not found.');
    if (role !== 'admin' && review.user.toString() !== userId) throw ApiError.forbidden();
    return reviewRepo.deleteById(reviewId);
  }

  async voteHelpful(reviewId, userId, helpful) {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw ApiError.notFound('Review not found.');
    if (review.votedBy.includes(userId)) throw ApiError.conflict('Already voted.');
    const inc = helpful ? { helpfulVotes: 1 } : {};
    return reviewRepo.updateById(reviewId, { $inc: inc, $addToSet: { votedBy: userId } }, { new: true });
  }
}

module.exports = new ReviewService();
