const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // ── ACTOR ─────────────────────────────────────────────────────────────────
    // Who performed the action
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      email: { type: String, trim: true, default: null },
      role: {
        type: String,
        enum: ["tenant", "landlord", "admin", "system", "ai"],
        default: "system",
      },
      name: { type: String, trim: true, default: null },
    },

    // ── ACTION ────────────────────────────────────────────────────────────────
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: {
        values: [
          // Auth actions
          "user_registered",
          "user_logged_in",
          "user_logged_out",
          "user_login_failed",
          "user_account_locked",
          "password_reset_requested",
          "password_reset_completed",
          "email_verified",
          "phone_verified",
          "token_refreshed",
          // User management
          "user_created",
          "user_updated",
          "user_deleted",
          "user_suspended",
          "user_reactivated",
          "user_role_changed",
          "user_kyc_submitted",
          "user_kyc_approved",
          "user_kyc_rejected",
          // Property actions
          "property_created",
          "property_updated",
          "property_deleted",
          "property_approved",
          "property_rejected",
          "property_featured",
          "property_unfeatured",
          "property_images_uploaded",
          "property_images_deleted",
          // Booking actions
          "booking_created",
          "booking_approved",
          "booking_declined",
          "booking_cancelled",
          "booking_completed",
          // Rental actions
          "rental_created",
          "rental_updated",
          "rental_terminated",
          "rental_renewed",
          // Contract actions
          "contract_created",
          "contract_signed_landlord",
          "contract_signed_tenant",
          "contract_activated",
          "contract_terminated",
          // Payment actions
          "payment_initiated",
          "payment_completed",
          "payment_failed",
          "payment_refunded",
          "payment_disputed",
          // Maintenance actions
          "maintenance_submitted",
          "maintenance_acknowledged",
          "maintenance_completed",
          "maintenance_rejected",
          // Review actions
          "review_submitted",
          "review_approved",
          "review_rejected",
          "review_deleted",
          // Report actions
          "report_submitted",
          "report_resolved",
          "report_dismissed",
          // Admin actions
          "admin_settings_updated",
          "admin_broadcast_sent",
          "admin_user_impersonated",
          "maintenance_mode_enabled",
          "maintenance_mode_disabled",
          // AI actions
          "ai_chat_initiated",
          "ai_search_performed",
          "ai_recommendation_generated",
          "ai_fraud_detected",
          "ai_lease_explained",
          "ai_maintenance_diagnosed",
          "ai_description_generated",
          "ai_rent_advised",
          // System actions
          "system_backup_created",
          "system_error_logged",
          "api_key_created",
          "api_key_revoked",
        ],
        message: "Invalid audit log action",
      },
    },

    // ── RESOURCE ──────────────────────────────────────────────────────────────
    resource: {
      resourceType: {
        type: String,
        enum: [
          "User",
          "Property",
          "Booking",
          "Rental",
          "Contract",
          "Payment",
          "MaintenanceRequest",
          "Review",
          "Report",
          "BlogPost",
          "FAQ",
          "SystemSettings",
          "Conversation",
          "Message",
          "AIConversation",
          null,
        ],
        default: null,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      resourceName: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ── CHANGES ───────────────────────────────────────────────────────────────
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      fields: [{ type: String }],
    },

    // ── RESULT ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["success", "failure", "partial"],
      default: "success",
    },
    errorMessage: {
      type: String,
      trim: true,
      default: null,
    },

    // ── REQUEST METADATA ──────────────────────────────────────────────────────
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", null],
      default: null,
    },
    requestUrl: {
      type: String,
      trim: true,
      default: null,
    },
    sessionId: {
      type: String,
      trim: true,
      default: null,
    },

    // ── DESCRIPTION ───────────────────────────────────────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // ── SEVERITY ──────────────────────────────────────────────────────────────
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
    },

    // ── AI CONTEXT ────────────────────────────────────────────────────────────
    aiContext: {
      isAIAction: { type: Boolean, default: false },
      aiFeature: { type: String, default: null },
      tokensUsed: { type: Number, default: null },
      modelUsed: { type: String, default: null },
      responseTimeMs: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
auditLogSchema.index({ "actor.userId": 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ "resource.resourceType": 1, "resource.resourceId": 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1 });
// TTL index — auto-delete logs older than 1 year
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
);

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Create a new audit log entry
auditLogSchema.statics.log = async function ({
  actorId = null,
  actorEmail = null,
  actorRole = "system",
  actorName = null,
  action,
  resourceType = null,
  resourceId = null,
  resourceName = null,
  changesBefore = null,
  changesAfter = null,
  changedFields = [],
  status = "success",
  errorMessage = null,
  ipAddress = null,
  userAgent = null,
  requestMethod = null,
  requestUrl = null,
  description = null,
  severity = "info",
  aiContext = null,
}) {
  try {
    return await this.create({
      actor: {
        userId: actorId,
        email: actorEmail,
        role: actorRole,
        name: actorName,
      },
      action,
      resource: {
        resourceType,
        resourceId,
        resourceName,
      },
      changes: {
        before: changesBefore,
        after: changesAfter,
        fields: changedFields,
      },
      status,
      errorMessage,
      ipAddress,
      userAgent,
      requestMethod,
      requestUrl,
      description,
      severity,
      aiContext: aiContext || { isAIAction: false },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error.message);
    return null;
  }
};

// Log from Express request object
auditLogSchema.statics.logFromRequest = async function (
  req,
  action,
  data = {},
) {
  return await this.log({
    actorId: req.user?._id || null,
    actorEmail: req.user?.email || null,
    actorRole: req.user?.role || "system",
    actorName: req.user ? `${req.user.firstName} ${req.user.lastName}` : null,
    action,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
    requestMethod: req.method,
    requestUrl: req.originalUrl,
    ...data,
  });
};

// Get audit logs with filters
auditLogSchema.statics.getLogs = function (filters = {}, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.userId) query["actor.userId"] = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.resourceType)
    query["resource.resourceType"] = filters.resourceType;
  if (filters.severity) query.severity = filters.severity;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.ipAddress) query.ipAddress = filters.ipAddress;

  return this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

// Get security alerts (failed logins, locked accounts)
auditLogSchema.statics.getSecurityAlerts = function (page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({
    $or: [
      { action: "user_login_failed" },
      { action: "user_account_locked" },
      { severity: { $in: ["warning", "error", "critical"] } },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Get AI usage statistics
auditLogSchema.statics.getAIUsageStats = async function (
  startDate = null,
  endDate = null,
) {
  const match = { "aiContext.isAIAction": true };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$aiContext.aiFeature",
        count: { $sum: 1 },
        totalTokens: { $sum: "$aiContext.tokensUsed" },
        avgResponseTime: { $avg: "$aiContext.responseTimeMs" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Get platform statistics summary
auditLogSchema.statics.getPlatformStats = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    {
      $facet: {
        todayTotal: [
          { $match: { createdAt: { $gte: today } } },
          { $count: "count" },
        ],
        bySeverity: [
          {
            $group: {
              _id: "$severity",
              count: { $sum: 1 },
            },
          },
        ],
        recentErrors: [
          {
            $match: {
              severity: { $in: ["error", "critical"] },
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          },
          { $count: "count" },
        ],
        aiActions: [
          { $match: { "aiContext.isAIAction": true } },
          { $count: "count" },
        ],
      },
    },
  ]);

  return stats[0];
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
