const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
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
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // ── RENTAL PERIOD ─────────────────────────────────────────────────────────
    startDate: {
      type: Date,
      required: [true, "Rental start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Rental end date is required"],
    },
    originalEndDate: {
      type: Date, // Kept for tracking renewals and extensions
    },

    // ── FINANCIAL DETAILS ─────────────────────────────────────────────────────
    monthlyRent: {
      type: Number,
      required: [true, "Monthly rent is required"],
      min: [0, "Monthly rent cannot be negative"],
    },
    currency: {
      type: String,
      default: "ETB",
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },
    securityDepositStatus: {
      type: String,
      enum: ["held", "returned", "partially_returned", "forfeited"],
      default: "held",
    },
    securityDepositReturnedAt: {
      type: Date,
      default: null,
    },
    securityDepositReturnAmount: {
      type: Number,
      default: null,
    },
    securityDepositDeductions: [
      {
        reason: { type: String, trim: true },
        amount: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ],

    // ── PAYMENT SCHEDULE ──────────────────────────────────────────────────────
    paymentDueDay: {
      type: Number,
      default: 1, // Day of month rent is due (1-28)
      min: 1,
      max: 28,
    },
    gracePeriodDays: {
      type: Number,
      default: 5, // Days after due date before late fee applies
    },
    latePaymentFee: {
      type: Number,
      default: 0,
    },
    latePaymentFeeType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "percentage",
    },
    utilityBillsIncluded: {
      type: Boolean,
      default: false,
    },
    totalRentPaid: {
      type: Number,
      default: 0,
    },
    totalMonthsPaid: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    nextPaymentDue: {
      type: Date,
      default: null,
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "active",
          "expired",
          "terminated_early",
          "renewed",
          "pending_renewal",
          "pending_start",
        ],
        message: "Invalid rental status",
      },
      default: "pending_start",
    },

    // ── MOVE IN / MOVE OUT ────────────────────────────────────────────────────
    moveInDate: {
      type: Date,
      default: null,
    },
    moveInCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: null,
    },
    moveInNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Move-in notes cannot exceed 1000 characters"],
    },
    moveInPhotos: [
      {
        public_id: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    moveOutDate: {
      type: Date,
      default: null,
    },
    moveOutCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: null,
    },
    moveOutNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Move-out notes cannot exceed 1000 characters"],
    },
    moveOutPhotos: [
      {
        public_id: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── RENEWAL ───────────────────────────────────────────────────────────────
    isRenewed: {
      type: Boolean,
      default: false,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
    renewedRentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    previousRentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    renewalNotificationSent: {
      type: Boolean,
      default: false,
    },
    renewalNotificationSentAt: {
      type: Date,
      default: null,
    },

    // ── EARLY TERMINATION ─────────────────────────────────────────────────────
    isTerminatedEarly: {
      type: Boolean,
      default: false,
    },
    terminationDate: {
      type: Date,
      default: null,
    },
    terminationReason: {
      type: String,
      trim: true,
      default: null,
    },
    terminationInitiatedBy: {
      type: String,
      enum: ["tenant", "landlord", "admin", null],
      default: null,
    },
    earlyTerminationFee: {
      type: Number,
      default: 0,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
    },
    noticeGivenDate: {
      type: Date,
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI payment behavior score (0-100, higher = better payment history)
      tenantPaymentScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      // AI predicted renewal probability (0-100)
      renewalProbability: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI risk assessment
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", null],
        default: null,
      },
      // AI-generated rental summary
      aiSummary: {
        type: String,
        default: null,
      },
      lastAIAssessmentAt: {
        type: Date,
        default: null,
      },
    },

    // ── NOTES ─────────────────────────────────────────────────────────────────
    landlordNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
rentalSchema.index({ tenant: 1, status: 1 });
rentalSchema.index({ landlord: 1, status: 1 });
rentalSchema.index({ property: 1, status: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ endDate: 1 });
rentalSchema.index({ nextPaymentDue: 1 });
rentalSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
rentalSchema.virtual("durationMonths").get(function () {
  if (!this.startDate || !this.endDate) return null;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return months;
});

rentalSchema.virtual("remainingDays").get(function () {
  if (!this.endDate || this.status !== "active") return null;
  const remaining = this.endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
});

rentalSchema.virtual("isExpiringSoon").get(function () {
  return this.remainingDays !== null && this.remainingDays <= 60;
});

rentalSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

rentalSchema.virtual("totalRentValue").get(function () {
  if (!this.monthlyRent || !this.durationMonths) return null;
  return this.monthlyRent * this.durationMonths;
});

rentalSchema.virtual("payments", {
  ref: "Payment",
  localField: "_id",
  foreignField: "rental",
});

rentalSchema.virtual("maintenanceRequests", {
  ref: "MaintenanceRequest",
  localField: "_id",
  foreignField: "rental",
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Calculate next payment due date
rentalSchema.pre("save", function (next) {
  if (this.isModified("startDate") || this.isModified("paymentDueDay")) {
    if (this.startDate) {
      const nextDue = new Date(this.startDate);
      nextDue.setDate(this.paymentDueDay);
      // If due day already passed this month, move to next month
      if (nextDue < this.startDate) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      this.nextPaymentDue = nextDue;
    }
  }
  // Keep original end date
  if (this.isNew && this.endDate) {
    this.originalEndDate = this.endDate;
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get active rental for a tenant
rentalSchema.statics.getActiveTenantRental = function (tenantId) {
  return this.findOne({ tenant: tenantId, status: "active" })
    .populate("property", "title location coverImage pricing amenities")
    .populate("landlord", "firstName lastName avatar phone email")
    .populate("contract");
};

// Get all active rentals for a landlord
rentalSchema.statics.getActiveLandlordRentals = function (landlordId) {
  return this.find({ landlord: landlordId, status: "active" })
    .populate("tenant", "firstName lastName avatar phone email tenantProfile")
    .populate("property", "title location coverImage")
    .sort({ startDate: -1 });
};

// Get rentals expiring soon (within 60 days) — for renewal notifications
rentalSchema.statics.getExpiringSoon = function (daysThreshold = 60) {
  const thresholdDate = new Date(
    Date.now() + daysThreshold * 24 * 60 * 60 * 1000,
  );
  return this.find({
    status: "active",
    endDate: { $lte: thresholdDate, $gte: new Date() },
    renewalNotificationSent: false,
  })
    .populate("tenant", "firstName lastName email phone")
    .populate("landlord", "firstName lastName email phone")
    .populate("property", "title location");
};

// Get platform rental statistics
rentalSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalRentPaid" },
        avgMonthlyRent: { $avg: "$monthlyRent" },
      },
    },
  ]);

  const result = {
    total: 0,
    active: 0,
    expired: 0,
    terminated: 0,
    totalRevenue: 0,
    avgMonthlyRent: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    result.totalRevenue += stat.totalRevenue || 0;
    if (stat._id === "active") {
      result.active = stat.count;
      result.avgMonthlyRent = Math.round(stat.avgMonthlyRent || 0);
    }
    if (stat._id === "expired") result.expired = stat.count;
    if (stat._id === "terminated_early") result.terminated = stat.count;
  });

  return result;
};

// Update payment totals after a payment is made
rentalSchema.statics.recordPayment = async function (rentalId, amount) {
  const rental = await this.findById(rentalId);
  if (!rental) return null;

  rental.totalRentPaid += amount;
  rental.totalMonthsPaid += 1;
  rental.lastPaymentDate = new Date();

  // Calculate next payment due
  const nextDue = new Date(rental.nextPaymentDue);
  nextDue.setMonth(nextDue.getMonth() + 1);
  rental.nextPaymentDue = nextDue;

  return await rental.save();
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Terminate rental early
rentalSchema.methods.terminateEarly = async function (
  reason,
  initiatedBy,
  terminationDate = new Date(),
) {
  this.status = "terminated_early";
  this.isTerminatedEarly = true;
  this.terminationDate = terminationDate;
  this.terminationReason = reason;
  this.terminationInitiatedBy = initiatedBy;
  return await this.save();
};

// Renew rental
rentalSchema.methods.renew = async function (
  newEndDate,
  newMonthlyRent = null,
) {
  this.status = "renewed";
  this.isRenewed = true;
  this.renewalCount += 1;
  this.endDate = newEndDate;
  if (newMonthlyRent) this.monthlyRent = newMonthlyRent;
  this.status = "active";
  return await this.save();
};

// Check if rent payment is overdue
rentalSchema.methods.isPaymentOverdue = function () {
  if (!this.nextPaymentDue) return false;
  const gracePeriodEnd = new Date(this.nextPaymentDue);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.gracePeriodDays);
  return Date.now() > gracePeriodEnd.getTime();
};

const Rental = mongoose.model("Rental", rentalSchema);

module.exports = Rental;
