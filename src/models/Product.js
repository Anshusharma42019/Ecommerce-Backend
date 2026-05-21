'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g., "100ml", "Red - L"
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  attributes: {
    color: String,
    size: String,
    weight: String,
    volume: String,
    material: String,
  },
  images: [{ url: String, publicId: String }],
  isActive: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 300 },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 500 },
  brand: { type: String, trim: true },

  // Pricing (base product price — overridden per variant)
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0, select: false },

  // Variants
  hasVariants: { type: Boolean, default: false },
  variants: [variantSchema],

  // Category
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String, lowercase: true }],

  // Images
  images: [{ url: { type: String, required: true }, publicId: String, alt: String }],
  thumbnail: { url: String, publicId: String },

  // Inventory
  sku: { type: String, unique: true, sparse: true },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true },

  // Ratings
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },

  // Flags
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDigital: { type: Boolean, default: false },

  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],

  // Shipping
  weight: Number,   // in grams
  dimensions: {
    length: Number, // cm
    width: Number,
    height: Number,
  },

  // Related
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Vendor (optional multi-vendor)
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: slug index created automatically by unique:true
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1, averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

productSchema.virtual('inStock').get(function () {
  if (this.hasVariants) return this.variants.some((v) => v.stock > 0 && v.isActive);
  return this.stock > 0;
});

productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ─── Pre-save: Generate slug ──────────────────────────────────────────────────
productSchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let slug = slugify(this.name, { lower: true, strict: true });
    const exists = await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } });
    if (exists) slug = `${slug}-${Date.now()}`;
    this.slug = slug;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
