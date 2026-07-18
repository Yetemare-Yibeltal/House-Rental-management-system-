// nestfind/nestfind/server/src/controllers/notificationController.js

const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET USER NOTIFICATIONS ────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const userId = req.user._id;

  const notifications = await Notification.getUserNotifications(
    userId,
    Number(page),
    Number(limit),
    unreadOnly === "true",
  );

  const total = await Notification.countDocuments({
    recipient: userId,
    isArchived: false,
  });

  const unreadCount = await Notification.countUnread(userId);

  return sendPaginated(res, "Notifications retrieved.", notifications, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    unreadCount,
  });
});

// ── GET UNREAD COUNT ──────────────────────────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user._id);
  return sendSuccess(res, "Unread count retrieved.", { unreadCount });
});

// ── MARK AS READ ──────────────────────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await notificationService.markAsRead(id, userId);

  if (!notification) return sendError(res, "Notification not found.", 404);

  const unreadCount = await notificationService.getUnreadCount(userId);

  return sendSuccess(res, "Notification marked as read.", {
    notification,
    unreadCount,
  });
});

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  return sendSuccess(res, "All notifications marked as read.", {
    unreadCount: 0,
  });
});

// ── ARCHIVE NOTIFICATION ──────────────────────────────────────────────────────
const archiveNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: id,
    recipient: userId,
  });
  if (!notification) return sendError(res, "Notification not found.", 404);

  await notification.archive();

  return sendSuccess(res, "Notification archived.");
});

// ── ARCHIVE ALL READ NOTIFICATIONS ────────────────────────────────────────────
const archiveAllRead = asyncHandler(async (req, res) => {
  await Notification.archiveRead(req.user._id);
  return sendSuccess(res, "All read notifications archived.");
});

// ── DELETE NOTIFICATION ───────────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: userId,
  });

  if (!notification) return sendError(res, "Notification not found.", 404);

  return sendSuccess(res, "Notification deleted.");
});

// ── UPDATE NOTIFICATION PREFERENCES ──────────────────────────────────────────
const getNotificationSettings = asyncHandler(async (req, res) => {
  const user = req.user;
  return sendSuccess(res, "Notification settings retrieved.", {
    preferences: user.notificationPreferences,
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  archiveAllRead,
  deleteNotification,
  getNotificationSettings,
};
