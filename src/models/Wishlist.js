'use strict';

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true, toJSON: { versionKey: false } });

wishlistSchema.index({ user: 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
