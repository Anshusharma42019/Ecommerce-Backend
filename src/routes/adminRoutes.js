'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../constants');

// All admin routes require admin role
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get('/dashboard', ctrl.getDashboard);
router.get('/reports/sales', ctrl.getSalesReport);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.toggleUserStatus);
router.patch('/users/:id/role', ctrl.updateUserRole);

router.get('/products', ctrl.listProducts);

router.get('/orders', ctrl.listOrders);
router.patch('/orders/:id/status', ctrl.updateOrderStatus);

module.exports = router;
