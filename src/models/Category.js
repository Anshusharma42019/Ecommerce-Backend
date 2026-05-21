'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, maxlength: 500 },
  image: { url: String, publicId: String },

  // Hierarchy support
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  level: { type: Number, default: 0 },  // 0 = root, 1 = sub, 2 = sub-sub

  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },

  // SEO
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
});

// Note: slug index created automatically by unique:true
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ ancestors: 1 });

// ─── Virtual: product count (populated externally) ────────────────────────────
categorySchema.virtual('productCount');

// ─── Pre-save: slug + ancestors ───────────────────────────────────────────────
categorySchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let slug = slugify(this.name, { lower: true, strict: true });
    const exists = await mongoose.model('Category').findOne({ slug, _id: { $ne: this._id } });
    if (exists) slug = `${slug}-${Date.now()}`;
    this.slug = slug;
  }

  if (this.isModified('parent') && this.parent) {
    const parentDoc = await mongoose.model('Category').findById(this.parent).select('ancestors level');
    if (parentDoc) {
      this.ancestors = [...parentDoc.ancestors, parentDoc._id];
      this.level = parentDoc.level + 1;
    }
  } else if (!this.parent) {
    this.ancestors = [];
    this.level = 0;
  }

  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
