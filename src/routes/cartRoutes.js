'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('../validations/cartValidation');

router.use(authenticate);

router.get('/', ctrl.getCart);
router.post('/items', validate(v.addToCart), ctrl.addItem);
router.put('/items/:itemId', validate(v.updateCartItem), ctrl.updateItem);
router.delete('/items/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);
router.post('/coupon', validate(v.applyCoupon), ctrl.applyCoupon);

module.exports = router;
