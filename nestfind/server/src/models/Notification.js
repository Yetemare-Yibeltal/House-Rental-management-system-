const mongoose = require("mongoose");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_SEVERITY,
} = require("../config/constants");

// ─── Read receipt sub-schema ──────────────────────────────────
const readReceiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// ─── Main notification schema ─────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    // ── Branch scope ───────────────────────────────────────
    // null = system-wide notification (admin only)
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },

    // ── Notification type ──────────────────────────────────
    type: {
      type: String,
      required: true,
      enum: [
        ...Object.values(NOTIFICATION_TYPE),
        // Additional notification types
        "order-ready",
        "order-overdue",
        "new-registration",
        "account-approved",
        "account-rejected",
        "delivery-assigned",
        "delivery-completed",
        "payment-received",
        "loyalty-tier-upgrade",
        "ai-insight",
        "backup-complete",
        "backup-failed",
        "system-update",
        "branch-created",
        "new-staff",
        "audit",
      ],
      index: true,
    },

    // ── Content ────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    titleAmharic: {
      type: String,
      trim: true,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageAmharic: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Severity level ─────────────────────────────────────
    severity: {
      type: String,
      enum: Object.values(NOTIFICATION_SEVERITY),
      default: NOTIFICATION_SEVERITY.INFO,
      index: true,
    },

    // ── Associated data ────────────────────────────────────
    // Flexible object to store related IDs or extra context
    data: {
      // e.g. { orderId, tableNumber, itemName, stockLevel }
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Action link ────────────────────────────────────────
    // Frontend page to navigate to when notification clicked
    actionUrl: {
      type: String,
      default: null,
      trim: true,
    },
    actionLabel: {
      type: String,
      default: null,
      trim: true,
    },

    // ── Read tracking ──────────────────────────────────────
    readBy: {
      type: [readReceiptSchema],
      default: [],
    },

    // ── Target audience ────────────────────────────────────
    // null = broadcast to all users in branch
    // populated = only specific users see this
    targetUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    // ── Target roles ───────────────────────────────────────
    // Empty = all roles, populated = only specific roles
    targetRoles: {
      type: [String],
      default: [],
    },

    // ── Source ─────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isSystemGenerated: {
      type: Boolean,
      default: true,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    // ── Delivery status ────────────────────────────────────
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // ── Expiry ─────────────────────────────────────────────
    // MongoDB auto-deletes notification after 30 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    // ── Priority for sorting ───────────────────────────────
    priority: {
      type: Number,
      default: 0,
      // Higher = shown first
      // critical=100, error=75, warn=50, success=25, info=0
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────
notificationSchema.index({ branch: 1, createdAt: -1 });
notificationSchema.index({ type: 1, branch: 1 });
notificationSchema.index({ severity: 1, branch: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ "readBy.userId": 1 });

// ─── Virtual: total read count ────────────────────────────────
notificationSchema.virtual("readCount").get(function () {
  return this.readBy?.length || 0;
});

// ─── Virtual: is unread for a user ───────────────────────────
notificationSchema.virtual("isUnread").get(function () {
  // Set dynamically per user in service layer
  return true;
});

// ─── Pre-save: set priority from severity ─────────────────────
notificationSchema.pre("save", function (next) {
  const priorityMap = {
    [NOTIFICATION_SEVERITY.ERROR]: 100,
    [NOTIFICATION_SEVERITY.WARN]: 75,
    [NOTIFICATION_SEVERITY.SUCCESS]: 25,
    [NOTIFICATION_SEVERITY.INFO]: 0,
  };
  this.priority = priorityMap[this.severity] || 0;
  next();
});

// ─── Static: create and broadcast notification ────────────────
notificationSchema.statics.createAndBroadcast = async function (
  data,
  io = null,
) {
  const notification = await this.create(data);

  // Emit via Socket.io if available
  if (io) {
    const room = data.branch ? `branch_${data.branch}` : "all_branches";

    io.to(room).emit("notification-received", {
      notification: {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        data: notification.data,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        priority: notification.priority,
        isAIGenerated: notification.isAIGenerated,
        createdAt: notification.createdAt,
      },
      timestamp: new Date(),
    });

    notification.isDelivered = true;
    notification.deliveredAt = new Date();
    await notification.save();
  }

  return notification;
};

// ─── Static: get unread notifications for a user ─────────────
notificationSchema.statics.getUnreadForUser = async function (
  userId,
  branchId,
  userRole,
  limit = 20,
) {
  const query = {
    expiresAt: { $gt: new Date() },
    "readBy.userId": { $ne: userId },
    $or: [{ branch: branchId }, { branch: null }],
  };

  // Filter by target roles if specified
  if (userRole) {
    query.$and = [
      {
        $or: [{ targetRoles: { $size: 0 } }, { targetRoles: userRole }],
      },
    ];
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// ─── Static: get unread count for a user ─────────────────────
notificationSchema.statics.getUnreadCount = async function (userId, branchId) {
  return this.countDocuments({
    expiresAt: { $gt: new Date() },
    "readBy.userId": { $ne: userId },
    $or: [{ branch: branchId }, { branch: null }],
  });
};

// ─── Static: mark as read for a user ─────────────────────────
notificationSchema.statics.markAsRead = async function (
  notificationId,
  userId,
) {
  return this.findByIdAndUpdate(
    notificationId,
    {
      $addToSet: {
        readBy: { userId, readAt: new Date() },
      },
    },
    { new: true },
  );
};

// ─── Static: mark all as read for a user in branch ───────────
notificationSchema.statics.markAllAsRead = async function (userId, branchId) {
  const notifications = await this.find({
    "readBy.userId": { $ne: userId },
    $or: [{ branch: branchId }, { branch: null }],
  }).select("_id");

  const ids = notifications.map((n) => n._id);

  if (!ids.length) return 0;

  await this.updateMany(
    { _id: { $in: ids } },
    {
      $addToSet: {
        readBy: { userId, readAt: new Date() },
      },
    },
  );

  return ids.length;
};

// ─── Static: create low stock notification ───────────────────
notificationSchema.statics.createLowStockAlert = async function (
  item,
  branchId,
  io = null,
) {
  const isCritical = item.currentStock <= item.reorderThreshold * 0.5;

  return this.createAndBroadcast(
    {
      branch: branchId,
      type: isCritical ? "critical-stock" : "low-stock",
      title: isCritical ? "🚨 Critical Stock Alert" : "⚠️ Low Stock Alert",
      titleAmharic: isCritical ? "ወሳኝ የዕቃ ማስጠንቀቂያ" : "ዝቅተኛ ዕቃ ማስጠንቀቂያ",
      message: `${item.name} is ${isCritical ? "critically low" : "running low"}: ${item.currentStock} ${item.unit} remaining (threshold: ${item.reorderThreshold} ${item.unit})`,
      messageAmharic: `${item.name} ${isCritical ? "ወሳኝ ዝቅተኛ ደረጃ ላይ ነው" : "ዝቅተኛ ደረጃ ላይ ነው"}: ${item.currentStock} ${item.unit} ቀርቷል`,
      severity: isCritical
        ? NOTIFICATION_SEVERITY.ERROR
        : NOTIFICATION_SEVERITY.WARN,
      data: {
        itemId: item._id,
        itemName: item.name,
        currentStock: item.currentStock,
        reorderThreshold: item.reorderThreshold,
        unit: item.unit,
        supplierId: item.supplier,
      },
      actionUrl: "/inventory",
      actionLabel: "View Inventory",
      targetRoles: ["admin", "manager"],
      isSystemGenerated: true,
    },
    io,
  );
};

// ─── Static: create order overdue notification ────────────────
notificationSchema.statics.createOrderOverdueAlert = async function (
  order,
  branchId,
  io = null,
) {
  return this.createAndBroadcast(
    {
      branch: branchId,
      type: "order-overdue",
      title: "⏰ Order Overdue",
      message: `Table ${order.tableNumber} order has been waiting ${order.waitMinutes} minutes`,
      severity: NOTIFICATION_SEVERITY.WARN,
      data: {
        orderId: order._id,
        tableNumber: order.tableNumber,
        waitMinutes: order.waitMinutes,
        itemCount: order.itemCount,
      },
      actionUrl: "/kds",
      actionLabel: "View KDS",
      targetRoles: ["admin", "manager", "kitchen"],
      isSystemGenerated: true,
    },
    io,
  );
};

// ─── Static: create AI insight notification ───────────────────
notificationSchema.statics.createAIInsightNotification = async function (
  insight,
  branchId,
  io = null,
) {
  return this.createAndBroadcast(
    {
      branch: branchId,
      type: "ai-insight",
      title: `🤖 AI Insight: ${insight.title}`,
      message: insight.message,
      severity: insight.severity || NOTIFICATION_SEVERITY.INFO,
      data: insight.data || null,
      actionUrl: insight.actionUrl || "/dashboard",
      actionLabel: insight.actionLabel || "View Details",
      targetRoles: ["admin", "manager"],
      isSystemGenerated: true,
      isAIGenerated: true,
    },
    io,
  );
};

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
