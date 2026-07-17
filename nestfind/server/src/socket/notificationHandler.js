// nestfind/nestfind/server/src/socket/notificationHandler.js

const Notification = require("../models/Notification");
const logger = require("../utils/logger");

/**
 * Handle marking a single notification as read.
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Connected socket
 * @param {Object} data - { notificationId }
 */
const handleMarkRead = async (io, socket, data) => {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const { notificationId } = data;
    if (!notificationId) return;

    const notification = await Notification.markAsRead(notificationId, userId);

    if (notification) {
      // Get updated unread count
      const unreadCount = await Notification.countUnread(userId);

      socket.emit("notification_read", {
        notificationId,
        unreadCount,
      });
    }
  } catch (error) {
    logger.error(`Mark notification read error: ${error.message}`);
  }
};

/**
 * Handle marking all notifications as read for a user.
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Connected socket
 */
const handleMarkAllRead = async (io, socket) => {
  try {
    const userId = socket.userId;
    if (!userId) return;

    await Notification.markAllAsRead(userId);

    socket.emit("all_notifications_read", {
      unreadCount: 0,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Mark all notifications read error: ${error.message}`);
  }
};

/**
 * Send a real-time notification to a specific user.
 * Called by notification service when a new notification is created.
 *
 * @param {Object} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification document
 */
const sendRealTimeNotification = async (io, userId, notification) => {
  try {
    if (!io || !userId || !notification) return;

    // Get updated unread count
    const unreadCount = await Notification.countUnread(userId);

    // Emit to user's personal room
    io.to(`user_${userId}`).emit("notification", {
      notification,
      unreadCount,
    });
  } catch (error) {
    logger.error(`Real-time notification error: ${error.message}`);
  }
};

/**
 * Get and send initial notification data when user connects.
 *
 * @param {Object} socket - Connected socket
 * @param {string} userId - Connected user ID
 */
const sendInitialNotificationData = async (socket, userId) => {
  try {
    const unreadCount = await Notification.countUnread(userId);
    socket.emit("notification_count", { unreadCount });
  } catch (error) {
    logger.error(`Initial notification data error: ${error.message}`);
  }
};

module.exports = {
  handleMarkRead,
  handleMarkAllRead,
  sendRealTimeNotification,
  sendInitialNotificationData,
};
