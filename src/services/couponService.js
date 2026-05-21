'use strict';

const { couponRepo } = require('../repositories');
const ApiError = require('../helpers/ApiError');
const { parsePagination, buildPaginationMeta } = require('../helpers/paginate');

class CouponService {
  async validateCoupon(code, userId, orderAmount) {
    const coupon = await couponRepo.findByCode(code);
    if (!coupon) throw ApiError.notFound('Coupon not found or inactive.');
    if (new Date() > coupon.endDate) throw ApiError.badRequest('Coupon has expired.');
    if (coupon.usageLimit !== null && coupon.totalUsed >= coupon.usageLimit) throw ApiError.badRequest('Coupon usage limit reached.');
    if (userId && coupon.usedBy.includes(userId)) throw ApiError.badRequest('You have already used this coupon.');
    if (orderAmount < (coupon.minOrderAmount || 0)) {
      throw ApiError.badRequest(`Minimum order amount ₹${coupon.minOrderAmount} required.`);
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity);
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, orderAmount);
    }

    return { coupon, discount: Math.round(discount) };
  }

  async createCoupon(data) {
    const exists = await couponRepo.findByCode(data.code);
    if (exists) throw ApiError.conflict('Coupon code already exists.');
    return couponRepo.create(data);
  }

  async listCoupons(queryParams) {
    const { page, limit, skip } = parsePagination(queryParams);
    const [coupons, total] = await Promise.all([
      couponRepo.findAll({}, { sort: { createdAt: -1 }, skip, limit }),
      couponRepo.count({}),
    ]);
    return { coupons, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateCoupon(id, data) {
    return couponRepo.updateById(id, data, { new: true });
  }

  async deleteCoupon(id) {
    return couponRepo.deleteById(id);
  }
}

module.exports = new CouponService();
