'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 200 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  images: [{ url: String, publicId: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reply: {
    message: String,
    repliedAt: Date,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
}, { timestamps: true, toJSON: { virtuals: true, versionKey: false } });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

const updateProductRating = async (productId) => {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avgRating = 0, count = 0 } = stats[0] || {};
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    averageRating: Math.round(avgRating * 10) / 10,
    ratingCount: count,
  });
};

reviewSchema.post('save', function () { updateProductRating(this.product); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) updateProductRating(doc.product); });

module.exports = mongoose.model('Review', reviewSchema);
