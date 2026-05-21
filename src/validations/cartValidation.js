'use strict';

const Joi = require('joi');

const addToCart = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  variantId: Joi.string().hex().length(24).optional(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

const updateCartItem = Joi.object({
  quantity: Joi.number().integer().min(0).max(100).required(),
});

const applyCoupon = Joi.object({
  code: Joi.string().uppercase().trim().required(),
});

module.exports = { addToCart, updateCartItem, applyCoupon };
