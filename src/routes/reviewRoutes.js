'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.get('/product/:productId', ctrl.getProductReviews);
router.post('/', authenticate, ctrl.createReview);
router.put('/:id', authenticate, ctrl.updateReview);
router.delete('/:id', authenticate, ctrl.deleteReview);
router.post('/:id/vote', authenticate, ctrl.voteHelpful);

module.exports = router;
