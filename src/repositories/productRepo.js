'use strict';

const BaseRepository = require('./baseRepo');
const Product = require('../models/Product');

class ProductRepository extends BaseRepository {
  constructor() { super(Product); }

  async search(query, filters = {}, sort = { score: { $meta: 'textScore' } }, skip = 0, limit = 20) {
    const filter = { isActive: true, ...filters };
    if (query) filter.$text = { $search: query };
    return this.model.find(filter, query ? { score: { $meta: 'textScore' } } : {})
      .sort(sort).skip(skip).limit(limit).populate('category', 'name slug').lean();
  }

  async buildFilter(queryParams) {
    const filter = { isActive: true };
    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.brand) filter.brand = new RegExp(queryParams.brand, 'i');
    if (queryParams.minPrice || queryParams.maxPrice) {
      filter.price = {};
      if (queryParams.minPrice) filter.price.$gte = Number(queryParams.minPrice);
      if (queryParams.maxPrice) filter.price.$lte = Number(queryParams.maxPrice);
    }
    if (queryParams.minRating) filter.averageRating = { $gte: Number(queryParams.minRating) };
    if (queryParams.inStock === 'true') filter.stock = { $gt: 0 };
    if (queryParams.isFeatured === 'true') filter.isFeatured = true;
    if (queryParams.tags) filter.tags = { $in: queryParams.tags.split(',') };
    return filter;
  }

  async decrementStock(productId, variantId, quantity) {
    if (variantId) {
      return this.model.findOneAndUpdate(
        { _id: productId, 'variants._id': variantId, 'variants.stock': { $gte: quantity } },
        { $inc: { 'variants.$.stock': -quantity, totalSold: quantity } },
        { new: true }
      );
    }
    return this.model.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity, totalSold: quantity } },
      { new: true }
    );
  }

  async incrementStock(productId, variantId, quantity) {
    if (variantId) {
      return this.model.findOneAndUpdate(
        { _id: productId, 'variants._id': variantId },
        { $inc: { 'variants.$.stock': quantity } },
        { new: true }
      );
    }
    return this.model.findOneAndUpdate({ _id: productId }, { $inc: { stock: quantity } }, { new: true });
  }
}

module.exports = new ProductRepository();
