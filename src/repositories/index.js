'use strict';

const BaseRepository = require('./baseRepo');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');

// ─── Category Repo ────────────────────────────────────────────────────────────
class CategoryRepository extends BaseRepository {
  constructor() { super(Category); }
  async findRoots() { return this.model.find({ parent: null, isActive: true }).sort('sortOrder'); }
  async findChildren(parentId) { return this.model.find({ parent: parentId, isActive: true }); }
  async findWithDescendants(categoryId) {
    return this.model.find({ $or: [{ _id: categoryId }, { ancestors: categoryId }] });
  }
}

// ─── Cart Repo ────────────────────────────────────────────────────────────────
class CartRepository extends BaseRepository {
  constructor() { super(Cart); }
  async findByUser(userId) {
    return this.model.findOne({ user: userId }).populate({ path: 'items.product', select: 'name slug price stock isActive thumbnail images' });
  }
  async upsertCart(userId, data) {
    return this.model.findOneAndUpdate({ user: userId }, data, { new: true, upsert: true, runValidators: true });
  }
}

// ─── Payment Repo ─────────────────────────────────────────────────────────────
class PaymentRepository extends BaseRepository {
  constructor() { super(Payment); }
  async findByRazorpayOrderId(id) { return this.model.findOne({ razorpayOrderId: id }); }
  async findByStripeIntentId(id) { return this.model.findOne({ stripePaymentIntentId: id }); }
}

// ─── Review Repo ──────────────────────────────────────────────────────────────
class ReviewRepository extends BaseRepository {
  constructor() { super(Review); }
  async findByProduct(productId, skip, limit) {
    return this.model.find({ product: productId, isApproved: true })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('user', 'firstName lastName avatar').lean();
  }
  async findUserReview(productId, userId) {
    return this.model.findOne({ product: productId, user: userId });
  }
}

// ─── Coupon Repo ──────────────────────────────────────────────────────────────
class CouponRepository extends BaseRepository {
  constructor() { super(Coupon); }
  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase(), isActive: true });
  }
  async incrementUsage(couponId, userId) {
    return this.model.findByIdAndUpdate(couponId, {
      $inc: { totalUsed: 1 }, $addToSet: { usedBy: userId },
    });
  }
}

// ─── Notification Repo ────────────────────────────────────────────────────────
class NotificationRepository extends BaseRepository {
  constructor() { super(Notification); }
  async findUserNotifications(userId, skip, limit) {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }
  async markAllRead(userId) {
    return this.model.updateMany({ user: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  }
  async unreadCount(userId) {
    return this.model.countDocuments({ user: userId, isRead: false });
  }
}

module.exports = {
  categoryRepo: new CategoryRepository(),
  cartRepo: new CartRepository(),
  paymentRepo: new PaymentRepository(),
  reviewRepo: new ReviewRepository(),
  couponRepo: new CouponRepository(),
  notificationRepo: new NotificationRepository(),
};
