'use strict';

const BaseRepository = require('./baseRepo');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() { super(Order); }

  async findUserOrders(userId, skip, limit) {
    return this.model.find({ user: userId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('items.product', 'name slug thumbnail')
      .lean();
  }

  async findWithPayment(orderId) {
    return this.model.findById(orderId).populate('payment').populate('user', 'firstName lastName email phone');
  }

  async addStatusHistory(orderId, status, note, updatedBy) {
    return this.model.findByIdAndUpdate(orderId,
      { $set: { status }, $push: { statusHistory: { status, note, updatedBy, timestamp: new Date() } } },
      { new: true }
    );
  }

  async getSalesReport(startDate, endDate) {
    return this.model.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['cancelled', 'failed'] } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      }},
      { $sort: { _id: 1 } },
    ]);
  }

  async getDashboardStats() {
    return this.model.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      }},
    ]);
  }
}

module.exports = new OrderRepository();
