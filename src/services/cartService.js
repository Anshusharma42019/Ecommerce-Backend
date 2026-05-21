'use strict';

const { cartRepo } = require('../repositories');
const productRepo = require('../repositories/productRepo');
const { couponRepo } = require('../repositories');
const ApiError = require('../helpers/ApiError');
const { MESSAGES } = require('../constants');

class CartService {
  async getCart(userId) {
    let cart = await cartRepo.findByUser(userId);
    if (!cart) cart = await cartRepo.create({ user: userId, items: [] });
    return cart;
  }

  async addItem(userId, { productId, variantId, quantity }) {
    const product = await productRepo.findById(productId);
    if (!product || !product.isActive) throw ApiError.notFound(MESSAGES.PRODUCT_NOT_FOUND);

    let price = product.price;
    let compareAtPrice = product.compareAtPrice;
    let variantDetails = null;
    let stock = product.stock;

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant || !variant.isActive) throw ApiError.notFound('Variant not found.');
      price = variant.price;
      compareAtPrice = variant.compareAtPrice;
      stock = variant.stock;
      variantDetails = { name: variant.name, sku: variant.sku, color: variant.attributes?.color, size: variant.attributes?.size };
    }

    if (stock < quantity) throw ApiError.badRequest(MESSAGES.INSUFFICIENT_STOCK);

    let cart = await cartRepo.findByUser(userId);
    if (!cart) cart = await cartRepo.upsertCart(userId, { user: userId, items: [] });

    const existingIdx = cart.items.findIndex(
      (i) => i.product._id.toString() === productId && (!variantId || i.variant?.toString() === variantId)
    );

    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      if (stock < newQty) throw ApiError.badRequest(MESSAGES.INSUFFICIENT_STOCK);
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId || undefined,
        variantDetails,
        quantity,
        price,
        compareAtPrice,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail?.url || product.images?.[0]?.url,
      });
    }

    await cart.save();
    return cart;
  }

  async updateItem(userId, itemId, quantity) {
    const cart = await cartRepo.findByUser(userId);
    if (!cart) throw ApiError.notFound('Cart not found.');

    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Cart item not found.');

    if (quantity <= 0) {
      item.remove();
    } else {
      const product = await productRepo.findById(item.product._id || item.product);
      const stock = item.variant
        ? product?.variants?.id(item.variant)?.stock
        : product?.stock;
      if (stock < quantity) throw ApiError.badRequest(MESSAGES.INSUFFICIENT_STOCK);
      item.quantity = quantity;
    }

    await cart.save();
    return cart;
  }

  async removeItem(userId, itemId) {
    const cart = await cartRepo.findByUser(userId);
    if (!cart) throw ApiError.notFound('Cart not found.');
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();
    return cart;
  }

  async clearCart(userId) {
    return cartRepo.upsertCart(userId, { items: [], couponCode: null, couponDiscount: 0 });
  }

  async applyCoupon(userId, code) {
    const coupon = await couponRepo.findByCode(code);
    if (!coupon) throw ApiError.badRequest('Invalid coupon code.');
    if (coupon.isExpired || coupon.isUsageLimitReached) throw ApiError.badRequest('Coupon is expired or exhausted.');

    const cart = await cartRepo.findByUser(userId);
    if (!cart) throw ApiError.notFound('Cart not found.');

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (subtotal < (coupon.minOrderAmount || 0)) {
      throw ApiError.badRequest(`Minimum order amount of ₹${coupon.minOrderAmount} required.`);
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity);
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, subtotal);
    }

    cart.couponCode = coupon.code;
    cart.couponDiscount = Math.round(discount);
    await cart.save();
    return { cart, discount: cart.couponDiscount };
  }
}

module.exports = new CartService();
