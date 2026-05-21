'use strict';

const adminService = require('../services/adminService');
const orderService = require('../services/orderService');
const { sendSuccess, sendPaginated } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES } = require('../constants');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, MESSAGES.FETCHED, stats);
});

const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await adminService.getSalesReport(startDate, endDate);
  sendSuccess(res, MESSAGES.FETCHED, report);
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.listUsers(req.query);
  sendPaginated(res, MESSAGES.FETCHED, users, meta);
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.toggleUserStatus(req.params.id);
  sendSuccess(res, MESSAGES.UPDATED, user);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body.role);
  sendSuccess(res, MESSAGES.UPDATED, user);
});

const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await adminService.listProducts(req.query);
  sendPaginated(res, MESSAGES.FETCHED, products, meta);
});

const listOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await adminService.listOrders(req.query);
  sendPaginated(res, MESSAGES.FETCHED, orders, meta);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.note, req.user.id);
  sendSuccess(res, MESSAGES.UPDATED, order);
});

module.exports = { getDashboard, getSalesReport, listUsers, toggleUserStatus, updateUserRole, listProducts, listOrders, updateOrderStatus };
