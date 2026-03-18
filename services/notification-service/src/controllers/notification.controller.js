const Notification = require('../models/notification.model');

const getMyNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const notifications = await Notification.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
    const unread = await Notification.getUnreadCount(req.user.id);
    return res.status(200).json({ success: true, data: { notifications, unread_count: unread } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const readNotification = async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.status(200).json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const readAll = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.deleteById(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createInternal = async (req, res) => {
  try {
    const { user_id, type, title, message, metadata } = req.body;
    const notification = await Notification.create({ user_id, type, title, message, metadata });
    return res.status(201).json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getMyNotifications, readNotification, readAll, deleteNotification, createInternal };
