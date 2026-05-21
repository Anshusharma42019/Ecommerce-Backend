'use strict';

const couponService = require('../services/couponService');
const { sendSuccess, sendPaginated } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES, HTTP_STATUS } = require('../constants');

const validateCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.validateCoupon(req.body.code, req.user?.id, req.body.orderAmount);
  sendSuccess(res, 'Coupon valid.', result);
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  sendSuccess(res, MESSAGES.CREATED, coupon, HTTP_STATUS.CREATED);
});

const listCoupons = asyncHandler(async (req, res) => {
  const { coupons, meta } = await couponService.listCoupons(req.query);
  sendPaginated(res, MESSAGES.FETCHED, coupons, meta);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  sendSuccess(res, MESSAGES.UPDATED, coupon);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  sendSuccess(res, MESSAGES.DELETED);
});

module.exports = { validateCoupon, createCoupon, listCoupons, updateCoupon, deleteCoupon };
