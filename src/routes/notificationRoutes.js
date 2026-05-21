'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
