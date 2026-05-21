'use strict';

const { notificationRepo } = require('../repositories');
const { parsePagination, buildPaginationMeta } = require('../helpers/paginate');

class NotificationService {
  async createNotification(userId, { type, title, message, data, actionUrl }) {
    return notificationRepo.create({ user: userId, type, title, message, data, actionUrl });
  }

  async getUserNotifications(userId, queryParams) {
    const { page, limit, skip } = parsePagination(queryParams);
    const [notifications, total] = await Promise.all([
      notificationRepo.findUserNotifications(userId, skip, limit),
      notificationRepo.count({ user: userId }),
    ]);
    return { notifications, meta: buildPaginationMeta(total, page, limit) };
  }

  async markAsRead(userId, notificationId) {
    return notificationRepo.updateOne(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() }
    );
  }

  async markAllRead(userId) {
    return notificationRepo.markAllRead(userId);
  }

  async getUnreadCount(userId) {
    return notificationRepo.unreadCount(userId);
  }

  async deleteNotification(userId, notificationId) {
    return notificationRepo.deleteOne({ _id: notificationId, user: userId });
  }
}

module.exports = new NotificationService();
