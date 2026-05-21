'use strict';

const BaseRepository = require('./baseRepo');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() { super(User); }

  async findByEmail(email, includePassword = false) {
    let query = this.model.findOne({ email: email.toLowerCase() });
    if (includePassword) query = query.select('+password +otp +otpExpiry +refreshTokens +loginAttempts +lockUntil');
    return query;
  }

  async findByPhone(phone) {
    return this.model.findOne({ phone }).select('+otp +otpExpiry');
  }

  async addRefreshToken(userId, token) {
    return this.model.findByIdAndUpdate(userId, { $push: { refreshTokens: token } });
  }

  async removeRefreshToken(userId, token) {
    return this.model.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
  }

  async clearAllRefreshTokens(userId) {
    return this.model.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  }

  async addToWishlist(userId, productId) {
    return this.model.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } }, { new: true });
  }

  async removeFromWishlist(userId, productId) {
    return this.model.findByIdAndUpdate(userId, { $pull: { wishlist: productId } }, { new: true });
  }

  async updateLastLogin(userId) {
    return this.model.findByIdAndUpdate(userId, { $set: { lastLogin: new Date() } });
  }
}

module.exports = new UserRepository();
