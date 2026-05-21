'use strict';

const notificationService = require('../services/notificationService');
const { sendSuccess, sendPaginated } = require('../helpers/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MESSAGES } = require('../constants');

const getNotifications = asyncHandler(async (req, res) => {
  const { notifications, meta } = await notificationService.getUserNotifications(req.user.id, req.query);
  sendPaginated(res, MESSAGES.FETCHED, notifications, meta);
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user.id, req.params.id);
  sendSuccess(res, 'Notification marked as read.');
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  sendSuccess(res, 'All notifications marked as read.');
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  sendSuccess(res, MESSAGES.FETCHED, { unreadCount: count });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, req.params.id);
  sendSuccess(res, MESSAGES.DELETED);
});

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount, deleteNotification };
