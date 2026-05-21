'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { cache } = require('../middleware/cache');
const { productUpload, handleMulterError } = require('../middleware/upload');
const { CACHE_TTL, ROLES } = require('../constants');
const v = require('../validations/productValidation');

// Public routes
router.get('/', cache(CACHE_TTL.PRODUCT_LIST), validate(v.productQuery, 'query'), ctrl.listProducts);
router.get('/search', validate(v.productQuery, 'query'), ctrl.searchProducts);
router.get('/featured', cache(CACHE_TTL.PRODUCT_LIST), ctrl.getFeaturedProducts);
router.get('/:slug', cache(CACHE_TTL.PRODUCT_DETAIL), ctrl.getProduct);

// Admin routes
router.post('/', authenticate, authorize(ROLES.ADMIN), productUpload.array('images', 10), handleMulterError, validate(v.createProduct), ctrl.createProduct);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), productUpload.array('images', 10), handleMulterError, validate(v.updateProduct), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), ctrl.deleteProduct);
router.delete('/:id/images', authenticate, authorize(ROLES.ADMIN), ctrl.deleteProductImage);

module.exports = router;
