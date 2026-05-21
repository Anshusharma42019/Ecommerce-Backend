'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId },  // variant _id
  variantDetails: {
    name: String,
    sku: String,
    color: String,
    size: String,
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true, min: 0 },          // Price at time of adding
  compareAtPrice: { type: Number, min: 0 },
  thumbnail: String,
  name: String,
  slug: String,
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  savedForLater: [cartItemSchema],  // "Save for Later" feature
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: user index created automatically by unique:true

// ─── Virtuals ─────────────────────────────────────────────────────────────────
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
