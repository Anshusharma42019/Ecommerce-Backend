'use strict';

const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../constants');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },  // Extra payload (orderId, etc.)
  isRead: { type: Boolean, default: false },
  readAt: Date,
  icon: String,
  actionUrl: String,
}, { timestamps: true, toJSON: { versionKey: false } });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 }); // TTL 30 days

module.exports = mongoose.model('Notification', notificationSchema);
