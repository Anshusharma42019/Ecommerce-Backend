'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('../validations/orderValidation');

router.use(authenticate);

router.post('/', validate(v.placeOrder), ctrl.placeOrder);
router.get('/', ctrl.getUserOrders);
router.get('/:id', ctrl.getOrder);
router.post('/:id/cancel', validate(v.cancelOrder), ctrl.cancelOrder);
router.post('/:id/return', validate(v.returnOrder), ctrl.requestReturn);
router.get('/:id/invoice', ctrl.getInvoice);
router.post('/:id/cod-confirm', ctrl.confirmCodOrder);

module.exports = router;
