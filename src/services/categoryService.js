'use strict';

const { categoryRepo } = require('../repositories');
const { deleteCloudinaryResource } = require('../config/cloudinary');
const ApiError = require('../helpers/ApiError');
const cacheService = require('./cacheService');
const { CACHE_TTL } = require('../constants');

class CategoryService {
  async getAllCategories() {
    return cacheService.remember('categories:all', CACHE_TTL.CATEGORY_LIST, () =>
      categoryRepo.findAll({ isActive: true }, { sort: { sortOrder: 1, name: 1 } })
    );
  }

  async getCategoryTree() {
    const categories = await categoryRepo.findAll({ isActive: true }, { sort: { sortOrder: 1 } });
    const map = {};
    categories.forEach((c) => { map[c._id] = { ...c, children: [] }; });
    const tree = [];
    categories.forEach((c) => {
      if (c.parent && map[c.parent]) map[c.parent].children.push(map[c._id]);
      else tree.push(map[c._id]);
    });
    return tree;
  }

  async getCategoryBySlug(slug) {
    const cat = await categoryRepo.findOne({ slug, isActive: true });
    if (!cat) throw ApiError.notFound('Category not found.');
    return cat;
  }

  async createCategory(data, file) {
    if (file) data.image = { url: file.path, publicId: file.filename };
    const cat = await categoryRepo.create(data);
    await cacheService.invalidatePattern('categories:*');
    return cat;
  }

  async updateCategory(id, data, file) {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw ApiError.notFound('Category not found.');
    if (file) {
      if (cat.image?.publicId) await deleteCloudinaryResource(cat.image.publicId).catch(() => {});
      data.image = { url: file.path, publicId: file.filename };
    }
    const updated = await categoryRepo.updateById(id, data, { new: true });
    await cacheService.invalidatePattern('categories:*');
    return updated;
  }

  async deleteCategory(id) {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw ApiError.notFound('Category not found.');
    if (cat.image?.publicId) await deleteCloudinaryResource(cat.image.publicId).catch(() => {});
    await categoryRepo.deleteById(id);
    await cacheService.invalidatePattern('categories:*');
    return { message: 'Category deleted.' };
  }
}

module.exports = new CategoryService();
