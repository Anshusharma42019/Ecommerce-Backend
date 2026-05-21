'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { avatarUpload, handleMulterError } = require('../middleware/upload');
const v = require('../validations/userValidation');

// All user routes require authentication
router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.put('/profile', validate(v.updateProfile), ctrl.updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), handleMulterError, ctrl.uploadAvatar);

// Addresses
router.get('/addresses', ctrl.getAddresses);
router.post('/addresses', validate(v.addAddress), ctrl.addAddress);
router.put('/addresses/:addressId', validate(v.updateAddress), ctrl.updateAddress);
router.delete('/addresses/:addressId', ctrl.deleteAddress);
router.patch('/addresses/:addressId/default', ctrl.setDefaultAddress);

// Wishlist
router.get('/wishlist', ctrl.getWishlist);
router.post('/wishlist/:productId', ctrl.toggleWishlist);

module.exports = router;
