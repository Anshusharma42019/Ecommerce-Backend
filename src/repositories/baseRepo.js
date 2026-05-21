'use strict';

/**
 * Generic base repository with common CRUD operations.
 * All model-specific repos extend this class.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    const { populate = [], select = '' } = options;
    let query = this.model.findById(id);
    if (select) query = query.select(select);
    if (populate.length) query = query.populate(populate);
    return query.lean();
  }

  async findOne(filter, options = {}) {
    const { populate = [], select = '' } = options;
    let query = this.model.findOne(filter);
    if (select) query = query.select(select);
    if (populate.length) query = query.populate(populate);
    return query.lean();
  }

  async findAll(filter = {}, options = {}) {
    const { populate = [], select = '', sort = { createdAt: -1 }, skip = 0, limit = 20 } = options;
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    if (select) query = query.select(select);
    if (populate.length) query = query.populate(populate);
    return query.lean();
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async updateById(id, update, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  async updateOne(filter, update, options = { new: true, runValidators: true }) {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteOne(filter) {
    return this.model.findOneAndDelete(filter);
  }

  async exists(filter) {
    return !!(await this.model.exists(filter));
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  async bulkInsert(docs) {
    return this.model.insertMany(docs, { ordered: false });
  }
}

module.exports = BaseRepository;
