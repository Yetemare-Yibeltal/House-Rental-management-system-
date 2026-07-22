// nestfind/nestfind/server/src/routes/notificationRoutes.js

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, notificationController.getNotifications);
router.get("/unread-count", protect, notificationController.getUnreadCount);
router.get(
  "/settings",
  protect,
  notificationController.getNotificationSettings,
);
router.patch("/mark-all-read", protect, notificationController.markAllAsRead);
router.patch("/archive-read", protect, notificationController.archiveAllRead);
router.patch("/:id/read", protect, notificationController.markAsRead);
router.patch(
  "/:id/archive",
  protect,
  notificationController.archiveNotification,
);
router.delete("/:id", protect, notificationController.deleteNotification);

module.exports = router;
