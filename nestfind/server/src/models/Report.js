const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // ── REPORTER ──────────────────────────────────────────────────────────────
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required"],
    },

    // ── REPORTED RESOURCE ─────────────────────────────────────────────────────
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      enum: {
        values: ["property", "user", "review", "message", "blog_post"],
        message: "Invalid resource type",
      },
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Resource ID is required"],
    },
    // Snapshot of reported resource for reference
    resourceSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── REPORT DETAILS ────────────────────────────────────────────────────────
    reportType: {
      type: String,
      required: [true, "Report type is required"],
      enum: {
        values: [
          "fake_listing",
          "scam",
          "wrong_information",
          "inappropriate_content",
          "harassment",
          "spam",
          "discrimination",
          "illegal_activity",
          "duplicate_listing",
          "overpriced",
          "unavailable_property",
          "fake_photos",
          "other",
        ],
        message: "Invalid report type",
      },
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // ── EVIDENCE ──────────────────────────────────────────────────────────────
    evidence: [
      {
        public_id: { type: String },
        url: { type: String },
        description: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "under_review",
          "resolved",
          "dismissed",
          "escalated",
        ],
        message: "Invalid report status",
      },
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: { type: String, trim: true },
      },
    ],

    // ── ADMIN RESOLUTION ──────────────────────────────────────────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolution: {
      action: {
        type: String,
        enum: [
          "no_action",
          "warning_issued",
          "content_removed",
          "user_suspended",
          "user_banned",
          "listing_removed",
          "listing_flagged",
          "other",
          null,
        ],
        default: null,
      },
      notes: { type: String, trim: true },
      resolvedAt: { type: Date, default: null },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // ── PRIORITY ──────────────────────────────────────────────────────────────
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI severity assessment
      severityScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI suggested priority
      suggestedPriority: {
        type: String,
        enum: ["low", "medium", "high", "urgent", null],
        default: null,
      },
      // AI suggested action
      suggestedAction: {
        type: String,
        default: null,
      },
      // AI detected similar reports
      similarReportsCount: {
        type: Number,
        default: 0,
      },
      // AI analysis summary
      aiAnalysis: {
        type: String,
        default: null,
      },
      // Whether AI auto-escalated this report
      isAutoEscalated: {
        type: Boolean,
        default: false,
      },
      analyzedAt: {
        type: Date,
        default: null,
      },
    },

    // ── REPORTER FEEDBACK ─────────────────────────────────────────────────────
    reporterNotified: {
      type: Boolean,
      default: false,
    },
    reporterNotifiedAt: {
      type: Date,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ resourceType: 1, resourceId: 1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
reportSchema.virtual("isPending").get(function () {
  return this.status === "pending";
});

reportSchema.virtual("isResolved").get(function () {
  return ["resolved", "dismissed"].includes(this.status);
});

reportSchema.virtual("daysSinceSubmitted").get(function () {
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Track status history
reportSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get pending reports for admin
reportSchema.statics.getPendingReports = function (page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({ status: { $in: ["pending", "under_review"] } })
    .populate("reportedBy", "firstName lastName avatar email")
    .populate("assignedTo", "firstName lastName avatar")
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Get reports for a specific resource
reportSchema.statics.getResourceReports = function (resourceType, resourceId) {
  return this.find({ resourceType, resourceId })
    .populate("reportedBy", "firstName lastName")
    .sort({ createdAt: -1 });
};

// Count reports for a resource
reportSchema.statics.countResourceReports = function (
  resourceType,
  resourceId,
) {
  return this.countDocuments({ resourceType, resourceId });
};

// Get platform report statistics
reportSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await this.aggregate([
    {
      $group: {
        _id: "$reportType",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const result = {
    total: 0,
    pending: 0,
    under_review: 0,
    resolved: 0,
    dismissed: 0,
    topReportTypes: typeStats,
  };

  stats.forEach((s) => {
    result.total += s.count;
    if (result[s._id] !== undefined) result[s._id] = s.count;
  });

  return result;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Assign report to admin
reportSchema.methods.assign = async function (adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  this.status = "under_review";
  this.statusHistory.push({
    status: "under_review",
    changedBy: adminId,
    changedAt: new Date(),
  });
  return await this.save();
};

// Resolve report
reportSchema.methods.resolve = async function (action, notes, resolvedByAdmin) {
  this.status = "resolved";
  this.resolution = {
    action,
    notes,
    resolvedAt: new Date(),
    resolvedBy: resolvedByAdmin,
  };
  this.statusHistory.push({
    status: "resolved",
    changedBy: resolvedByAdmin,
    changedAt: new Date(),
    note: notes,
  });
  return await this.save();
};

// Dismiss report
reportSchema.methods.dismiss = async function (notes, dismissedByAdmin) {
  this.status = "dismissed";
  this.resolution = {
    action: "no_action",
    notes,
    resolvedAt: new Date(),
    resolvedBy: dismissedByAdmin,
  };
  this.statusHistory.push({
    status: "dismissed",
    changedBy: dismissedByAdmin,
    changedAt: new Date(),
    note: notes,
  });
  return await this.save();
};

// Escalate report
reportSchema.methods.escalate = async function (reason, escalatedBy) {
  this.status = "escalated";
  this.priority = "urgent";
  this.statusHistory.push({
    status: "escalated",
    changedBy: escalatedBy,
    changedAt: new Date(),
    note: reason,
  });
  return await this.save();
};

// Save AI analysis
reportSchema.methods.saveAIAnalysis = async function (analysisData) {
  this.ai = { ...this.ai, ...analysisData, analyzedAt: new Date() };
  if (analysisData.suggestedPriority) {
    this.priority = analysisData.suggestedPriority;
  }
  return await this.save();
};

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
