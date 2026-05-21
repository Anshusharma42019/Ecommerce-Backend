'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../constants');

router.post('/validate', optionalAuth, ctrl.validateCoupon);

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/', ctrl.listCoupons);
router.post('/', ctrl.createCoupon);
router.put('/:id', ctrl.updateCoupon);
router.delete('/:id', ctrl.deleteCoupon);

module.exports = router;
