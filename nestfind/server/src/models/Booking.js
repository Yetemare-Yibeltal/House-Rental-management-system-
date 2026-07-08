const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant reference is required"],
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Landlord reference is required"],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },

    // ── VISIT DETAILS ─────────────────────────────────────────────────────────
    preferredDate: {
      type: Date,
      required: [true, "Preferred visit date is required"],
    },
    preferredTime: {
      type: String,
      required: [true, "Preferred visit time is required"],
      trim: true,
    },
    alternativeDate: {
      type: Date,
      default: null,
    },
    alternativeTime: {
      type: String,
      trim: true,
      default: null,
    },
    // Final confirmed date after landlord approves
    confirmedDate: {
      type: Date,
      default: null,
    },
    confirmedTime: {
      type: String,
      trim: true,
      default: null,
    },
    visitDurationMinutes: {
      type: Number,
      default: 60,
    },

    // ── MESSAGES ──────────────────────────────────────────────────────────────
    tenantMessage: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    landlordResponse: {
      type: String,
      trim: true,
      maxlength: [1000, "Response cannot exceed 1000 characters"],
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "pending", // Tenant submitted, waiting for landlord
          "approved", // Landlord approved the visit
          "declined", // Landlord declined the visit
          "cancelled", // Tenant or landlord cancelled
          "completed", // Visit happened successfully
          "no_show", // Tenant did not show up
          "rescheduled", // Landlord or tenant requested reschedule
        ],
        message: "Invalid booking status",
      },
      default: "pending",
    },
    // Full status history for audit trail
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "approved",
            "declined",
            "cancelled",
            "completed",
            "no_show",
            "rescheduled",
          ],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: { type: String, trim: true },
      },
    ],

    // ── OUTCOME ───────────────────────────────────────────────────────────────
    // What happened after the visit
    outcome: {
      type: String,
      enum: [
        "not_decided",
        "interested",
        "not_interested",
        "signed_lease",
        "pending_decision",
      ],
      default: "not_decided",
    },
    // If visit led to a rental
    resultedInRental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },

    // ── REMINDERS ─────────────────────────────────────────────────────────────
    reminderSentToTenant: {
      type: Boolean,
      default: false,
    },
    reminderSentToLandlord: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI compatibility score between tenant and property (0-100)
      tenantCompatibilityScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI recommendation to landlord
      aiRecommendation: {
        type: String,
        enum: [
          "highly_recommended",
          "recommended",
          "neutral",
          "not_recommended",
          null,
        ],
        default: null,
      },
      // Reasons for AI recommendation
      aiRecommendationReasons: [{ type: String }],
      // Whether AI flagged this booking as suspicious
      isFlagged: {
        type: Boolean,
        default: false,
      },
      flagReason: {
        type: String,
        default: null,
      },
    },

    // ── TIMESTAMPS ────────────────────────────────────────────────────────────
    approvedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
bookingSchema.index({ tenant: 1, status: 1 });
bookingSchema.index({ landlord: 1, status: 1 });
bookingSchema.index({ property: 1, status: 1 });
bookingSchema.index({ preferredDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
bookingSchema.virtual("isPending").get(function () {
  return this.status === "pending";
});

bookingSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

bookingSchema.virtual("isUpcoming").get(function () {
  return (
    this.status === "approved" &&
    this.confirmedDate &&
    this.confirmedDate > new Date()
  );
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Add to status history whenever status changes
bookingSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    // Set timestamp for each status
    const now = new Date();
    if (this.status === "approved") this.approvedAt = now;
    if (this.status === "declined") this.declinedAt = now;
    if (this.status === "cancelled") this.cancelledAt = now;
    if (this.status === "completed") this.completedAt = now;
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get pending bookings for a landlord
bookingSchema.statics.getPendingForLandlord = function (landlordId) {
  return this.find({ landlord: landlordId, status: "pending" })
    .populate(
      "tenant",
      "firstName lastName avatar phone email tenantProfile isKYCVerified",
    )
    .populate("property", "title location coverImage pricing")
    .sort({ createdAt: -1 });
};

// Get all bookings for a tenant
bookingSchema.statics.getTenantBookings = function (tenantId, status = null) {
  const query = { tenant: tenantId };
  if (status) query.status = status;
  return this.find(query)
    .populate("property", "title location coverImage pricing propertyType")
    .populate("landlord", "firstName lastName avatar phone")
    .sort({ createdAt: -1 });
};

// Check if tenant already has pending booking for this property
bookingSchema.statics.hasPendingBooking = async function (
  tenantId,
  propertyId,
) {
  const existing = await this.findOne({
    tenant: tenantId,
    property: propertyId,
    status: { $in: ["pending", "approved"] },
  });
  return !!existing;
};

// Get booking statistics for admin dashboard
bookingSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0,
    completed: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    if (result[stat._id] !== undefined) {
      result[stat._id] = stat.count;
    }
  });

  return result;
};

// Get upcoming visits for a landlord (next 7 days)
bookingSchema.statics.getUpcomingVisits = function (landlordId) {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return this.find({
    landlord: landlordId,
    status: "approved",
    confirmedDate: { $gte: now, $lte: nextWeek },
  })
    .populate("tenant", "firstName lastName avatar phone")
    .populate("property", "title location")
    .sort({ confirmedDate: 1 });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Approve a booking
bookingSchema.methods.approve = async function (
  confirmedDate,
  confirmedTime,
  response = null,
  approvedByUser = null,
) {
  this.status = "approved";
  this.confirmedDate = confirmedDate;
  this.confirmedTime = confirmedTime;
  this.approvedAt = new Date();
  if (response) this.landlordResponse = response;
  this.statusHistory.push({
    status: "approved",
    changedBy: approvedByUser,
    changedAt: new Date(),
    note: response,
  });
  return await this.save();
};

// Decline a booking
bookingSchema.methods.decline = async function (
  reason = null,
  declinedByUser = null,
) {
  this.status = "declined";
  this.declinedAt = new Date();
  if (reason) this.landlordResponse = reason;
  this.statusHistory.push({
    status: "declined",
    changedBy: declinedByUser,
    changedAt: new Date(),
    note: reason,
  });
  return await this.save();
};

// Cancel a booking
bookingSchema.methods.cancel = async function (
  reason = null,
  cancelledByUser = null,
) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledByUser;
  if (reason) this.cancellationReason = reason;
  this.statusHistory.push({
    status: "cancelled",
    changedBy: cancelledByUser,
    changedAt: new Date(),
    note: reason,
  });
  return await this.save();
};

// Mark as completed after visit
bookingSchema.methods.complete = async function (
  outcome = "not_decided",
  completedByUser = null,
) {
  this.status = "completed";
  this.completedAt = new Date();
  this.outcome = outcome;
  this.statusHistory.push({
    status: "completed",
    changedBy: completedByUser,
    changedAt: new Date(),
  });
  return await this.save();
};

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
