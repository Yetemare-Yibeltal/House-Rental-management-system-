const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ── RECIPIENT ─────────────────────────────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
    },

    // ── SENDER ────────────────────────────────────────────────────────────────
    // null for system/AI notifications
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── NOTIFICATION TYPE ─────────────────────────────────────────────────────
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          // Booking notifications
          "booking_received",
          "booking_approved",
          "booking_declined",
          "booking_cancelled",
          "booking_reminder",
          "booking_completed",
          // Rental notifications
          "rental_started",
          "rental_expiring_soon",
          "rental_expired",
          "rental_renewed",
          "rental_terminated",
          // Payment notifications
          "payment_received",
          "payment_due",
          "payment_overdue",
          "payment_failed",
          "payment_refunded",
          "security_deposit_returned",
          // Maintenance notifications
          "maintenance_submitted",
          "maintenance_acknowledged",
          "maintenance_in_progress",
          "maintenance_completed",
          "maintenance_rejected",
          "maintenance_overdue",
          // Contract notifications
          "contract_created",
          "contract_pending_signature",
          "contract_signed",
          "contract_activated",
          "contract_expiring_soon",
          "contract_terminated",
          // Message notifications
          "new_message",
          // Property notifications
          "property_approved",
          "property_rejected",
          "property_featured",
          "property_view_milestone",
          // Review notifications
          "review_received",
          "review_approved",
          // KYC notifications
          "kyc_submitted",
          "kyc_approved",
          "kyc_rejected",
          // AI notifications
          "ai_recommendation",
          "ai_price_suggestion",
          "ai_fraud_alert",
          "ai_lease_summary_ready",
          // Admin notifications
          "admin_announcement",
          "account_suspended",
          "account_reactivated",
          "subscription_expiring",
          "subscription_expired",
          // System notifications
          "system_maintenance",
          "welcome",
        ],
        message: "Invalid notification type",
      },
    },

    // ── CONTENT ───────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // ── ACTION LINK ───────────────────────────────────────────────────────────
    // Frontend route to navigate to when notification is clicked
    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },
    actionLabel: {
      type: String,
      trim: true,
      default: null,
    },

    // ── RELATED RESOURCES ─────────────────────────────────────────────────────
    relatedResource: {
      resourceType: {
        type: String,
        enum: [
          "Property",
          "Booking",
          "Rental",
          "Contract",
          "Payment",
          "MaintenanceRequest",
          "Conversation",
          "Review",
          "User",
          null,
        ],
        default: null,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },

    // ── DELIVERY ──────────────────────────────────────────────────────────────
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    smsSent: { type: Boolean, default: false },
    smsSentAt: { type: Date, default: null },
    pushSent: { type: Boolean, default: false },
    pushSentAt: { type: Date, default: null },

    // ── PRIORITY ──────────────────────────────────────────────────────────────
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // ── ICON / VISUAL ─────────────────────────────────────────────────────────
    icon: {
      type: String,
      default: null,
    },
    iconColor: {
      type: String,
      default: null,
    },

    // ── EXPIRY ────────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: null,
    },

    // ── METADATA ──────────────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

notificationSchema.virtual("timeAgo").get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = function (
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
) {
  const skip = (page - 1) * limit;
  const query = {
    recipient: userId,
    isArchived: false,
  };
  if (unreadOnly) query.isRead = false;

  return this.find(query)
    .populate("sender", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Count unread notifications for a user
notificationSchema.statics.countUnread = async function (userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false,
  });
};

// Create a notification
notificationSchema.statics.createNotification = async function ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  resourceType = null,
  resourceId = null,
  priority = "normal",
  channels = { inApp: true },
  metadata = {},
  expiresAt = null,
}) {
  return await this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    actionUrl,
    actionLabel,
    relatedResource: {
      resourceType,
      resourceId,
    },
    priority,
    channels,
    metadata,
    expiresAt,
  });
};

// Create bulk notifications (for admin broadcasts)
notificationSchema.statics.createBulkNotifications = async function (
  recipientIds,
  notificationData,
) {
  const notifications = recipientIds.map((recipientId) => ({
    ...notificationData,
    recipient: recipientId,
  }));
  return await this.insertMany(notifications);
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

// Mark specific notification as read
notificationSchema.statics.markAsRead = async function (
  notificationId,
  userId,
) {
  return await this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
};

// Archive all read notifications for a user
notificationSchema.statics.archiveRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, isRead: true },
    { isArchived: true, archivedAt: new Date() },
  );
};

// Delete old notifications (older than 90 days)
notificationSchema.statics.deleteOld = async function (daysOld = 90) {
  const threshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return await this.deleteMany({
    createdAt: { $lt: threshold },
    isRead: true,
  });
};

// Get notification statistics for admin
notificationSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: ["$isRead", 0, 1] },
        },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return stats;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Mark this notification as read
notificationSchema.methods.markRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Archive this notification
notificationSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
