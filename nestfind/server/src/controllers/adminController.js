// nestfind/nestfind/server/src/controllers/adminController.js

const User = require("../models/User");
const Property = require("../models/Property");
const Rental = require("../models/Rental");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const AIConversation = require("../models/AIConversation");
const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// ── ADMIN DASHBOARD STATS ─────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    userStats,
    propertyStats,
    rentalStats,
    paymentStats,
    bookingStats,
    reportStats,
    aiStats,
    recentActivity,
  ] = await Promise.all([
    User.getPlatformStats(),
    Property.getPlatformStats(),
    Rental.getPlatformStats(),
    Payment.getPlatformRevenue(),
    Booking.getPlatformStats(),
    Report.getPlatformStats(),
    AIConversation.getUsageStats(),
    AuditLog.getPlatformStats(),
  ]);

  // Get new registrations this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersThisWeek = await User.countDocuments({
    createdAt: { $gte: weekAgo },
  });

  const newPropertiesThisWeek = await Property.countDocuments({
    createdAt: { $gte: weekAgo },
  });

  return sendSuccess(res, "Admin dashboard stats retrieved.", {
    users: { ...userStats, newThisWeek: newUsersThisWeek },
    properties: { ...propertyStats, newThisWeek: newPropertiesThisWeek },
    rentals: rentalStats,
    revenue: paymentStats,
    bookings: bookingStats,
    reports: reportStats,
    ai: aiStats,
    recentActivity,
  });
});

// ── GET PLATFORM OVERVIEW ─────────────────────────────────────────────────────
const getPlatformOverview = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const monthlyRevenue = await Payment.getMonthlyRevenue(Number(year));

  const topProperties = await Property.find({
    status: "active",
    isDeleted: false,
  })
    .sort({ "stats.totalViews": -1 })
    .limit(5)
    .select("title location stats pricing coverImage");

  const topLandlords = await User.aggregate([
    { $match: { role: "landlord", status: "active" } },
    {
      $lookup: {
        from: "properties",
        localField: "_id",
        foreignField: "landlord",
        as: "properties",
      },
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        avatar: 1,
        propertyCount: { $size: "$properties" },
        avgRating: "$landlordProfile.averageRating",
        totalRevenue: "$landlordProfile.totalTenants",
      },
    },
    { $sort: { propertyCount: -1 } },
    { $limit: 5 },
  ]);

  return sendSuccess(res, "Platform overview retrieved.", {
    monthlyRevenue,
    topProperties,
    topLandlords,
    year: Number(year),
  });
});

// ── SEND BROADCAST NOTIFICATION ───────────────────────────────────────────────
const sendBroadcast = asyncHandler(async (req, res) => {
  const { subject, message, targetRole = "all", channels } = req.body;

  if (!subject || !message) {
    return sendError(res, "Subject and message are required.", 400);
  }

  // Get target users
  const query = { status: "active", isDeleted: false };
  if (targetRole !== "all") query.role = targetRole;

  const users = await User.find(query).select(
    "_id firstName email phone notificationPreferences",
  );

  if (users.length === 0)
    return sendError(res, "No users found for this target.", 404);

  // Send in-app notifications
  const recipientIds = users.map((u) => u._id.toString());
  const broadcastResult = await notificationService.sendBulkNotifications(
    recipientIds,
    {
      type: "admin_announcement",
      data: { title: subject, message, actionUrl: "/" },
      channels: channels || { inApp: true },
    },
  );

  // Send email if requested
  let emailResult = null;
  if (channels?.email) {
    const emailService = require("../services/emailService");
    const recipients = users
      .filter((u) => u.notificationPreferences?.emailNotifications !== false)
      .map((u) => ({ email: u.email, firstName: u.firstName }));

    emailResult = await emailService.sendBroadcastEmail(
      recipients,
      subject,
      message,
    );
  }

  await AuditLog.logFromRequest(req, "admin_broadcast_sent", {
    description: `Broadcast sent to ${users.length} ${targetRole} users: ${subject}`,
  });

  return sendSuccess(res, `Broadcast sent to ${broadcastResult.sent} users.`, {
    sent: broadcastResult.sent,
    failed: broadcastResult.failed,
    total: users.length,
    emailResult,
  });
});

// ── GET AUDIT LOGS ────────────────────────────────────────────────────────────
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    action,
    userId,
    severity,
    startDate,
    endDate,
    resourceType,
  } = req.query;

  const logs = await AuditLog.getLogs(
    { action, userId, severity, startDate, endDate, resourceType },
    Number(page),
    Number(limit),
  );

  const total = await AuditLog.countDocuments();

  return sendSuccess(res, "Audit logs retrieved.", {
    logs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SECURITY ALERTS ───────────────────────────────────────────────────────
const getSecurityAlerts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const alerts = await AuditLog.getSecurityAlerts(Number(page), Number(limit));
  return sendSuccess(res, "Security alerts retrieved.", { alerts });
});

// ── GET AI USAGE STATS ────────────────────────────────────────────────────────
const getAIUsageStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const [conversationStats, auditStats] = await Promise.all([
    AIConversation.getUsageStats(startDate, endDate),
    AuditLog.getAIUsageStats(startDate, endDate),
  ]);

  return sendSuccess(res, "AI usage statistics retrieved.", {
    conversations: conversationStats,
    auditStats,
  });
});

// ── ENABLE MAINTENANCE MODE ───────────────────────────────────────────────────
const toggleMaintenanceMode = asyncHandler(async (req, res) => {
  const { enabled, message, estimatedEndTime } = req.body;
  const SystemSettings = require("../models/SystemSettings");

  if (enabled) {
    await SystemSettings.enableMaintenance(
      message,
      estimatedEndTime ? new Date(estimatedEndTime) : null,
    );
    await AuditLog.logFromRequest(req, "maintenance_mode_enabled", {
      description: `Maintenance mode enabled by admin`,
    });
    return sendSuccess(res, "Maintenance mode enabled.");
  } else {
    await SystemSettings.disableMaintenance();
    await AuditLog.logFromRequest(req, "maintenance_mode_disabled", {
      description: `Maintenance mode disabled by admin`,
    });
    return sendSuccess(res, "Maintenance mode disabled.");
  }
});

// ── GET PENDING REVIEWS FOR MODERATION ────────────────────────────────────────
const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.getPendingModeration();
  return sendSuccess(res, "Pending reviews retrieved.", { reviews });
});

// ── APPROVE / REJECT REVIEW ───────────────────────────────────────────────────
const moderateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  const review = await Review.findById(id);
  if (!review) return sendError(res, "Review not found.", 404);

  if (action === "approve") {
    await review.approve(req.user._id);
  } else if (action === "reject") {
    await review.reject(reason, req.user._id);
  } else if (action === "flag") {
    await review.flag(reason);
  } else {
    return sendError(res, "Invalid action.", 400);
  }

  await AuditLog.logFromRequest(req, "review_approved", {
    resourceType: "Review",
    resourceId: id,
    description: `Review ${action}d by admin`,
  });

  return sendSuccess(res, `Review ${action}d successfully.`, { review });
});

module.exports = {
  getDashboardStats,
  getPlatformOverview,
  sendBroadcast,
  getAuditLogs,
  getSecurityAlerts,
  getAIUsageStats,
  toggleMaintenanceMode,
  getPendingReviews,
  moderateReview,
};
