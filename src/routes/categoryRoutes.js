'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { cache } = require('../middleware/cache');
const { categoryUpload, handleMulterError } = require('../middleware/upload');
const { CACHE_TTL, ROLES } = require('../constants');

router.get('/', cache(CACHE_TTL.CATEGORY_LIST), ctrl.getAllCategories);
router.get('/tree', cache(CACHE_TTL.CATEGORY_LIST), ctrl.getCategoryTree);
router.get('/:slug', ctrl.getCategoryBySlug);

router.post('/', authenticate, authorize(ROLES.ADMIN), categoryUpload.single('image'), handleMulterError, ctrl.createCategory);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), categoryUpload.single('image'), handleMulterError, ctrl.updateCategory);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deleteCategory);

module.exports = router;
