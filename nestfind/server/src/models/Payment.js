const mongoose = require("mongoose");
const crypto = require("crypto");

const paymentSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payer reference is required"],
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for platform fees
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },

    // ── TRANSACTION IDENTIFIERS ───────────────────────────────────────────────
    transactionId: {
      type: String,
      unique: true,
    },
    externalTransactionId: {
      type: String,
      default: null,
      trim: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ── PAYMENT TYPE ──────────────────────────────────────────────────────────
    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: {
        values: [
          "monthly_rent",
          "security_deposit",
          "security_deposit_refund",
          "late_payment_fee",
          "early_termination_fee",
          "platform_service_fee",
          "featured_listing_fee",
          "kyc_verification_fee",
          "subscription_fee",
          "maintenance_fee",
          "other",
        ],
        message: "Invalid payment type",
      },
    },

    // ── AMOUNT ────────────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "ETB",
    },
    // Platform commission (5% of rent payments)
    platformCommission: {
      type: Number,
      default: 0,
    },
    platformCommissionRate: {
      type: Number,
      default: 0.05, // 5%
    },
    // Amount landlord actually receives after commission
    netAmount: {
      type: Number,
      default: 0,
    },
    // For refunds — original payment amount
    originalAmount: {
      type: Number,
      default: null,
    },

    // ── PAYMENT METHOD ────────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: [
          "cbe_transfer",
          "telebirr",
          "visa_debit",
          "mastercard",
          "amex",
          "cash",
          "bank_transfer",
          "other",
        ],
        message: "Invalid payment method",
      },
    },
    paymentMethodDetails: {
      bankName: { type: String, trim: true },
      accountLast4: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "pending",
          "processing",
          "completed",
          "failed",
          "refunded",
          "partially_refunded",
          "disputed",
          "cancelled",
        ],
        message: "Invalid payment status",
      },
      default: "pending",
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ── PAYMENT PERIOD ────────────────────────────────────────────────────────
    // For monthly rent — which month this payment covers
    paymentPeriod: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number },
      periodLabel: { type: String, trim: true }, // e.g. "January 2026"
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    daysLate: {
      type: Number,
      default: 0,
    },

    // ── REFUND ────────────────────────────────────────────────────────────────
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: null,
    },
    refundReason: {
      type: String,
      trim: true,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundTransactionId: {
      type: String,
      default: null,
    },

    // ── RECEIPT ───────────────────────────────────────────────────────────────
    receipt: {
      isGenerated: { type: Boolean, default: false },
      url: { type: String, default: null },
      public_id: { type: String, default: null },
      generatedAt: { type: Date, default: null },
    },
    receiptEmailSent: {
      type: Boolean,
      default: false,
    },
    receiptEmailSentAt: {
      type: Date,
      default: null,
    },

    // ── DISPUTE ───────────────────────────────────────────────────────────────
    isDisputed: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
      trim: true,
      default: null,
    },
    disputeRaisedAt: {
      type: Date,
      default: null,
    },
    disputeResolvedAt: {
      type: Date,
      default: null,
    },
    disputeResolution: {
      type: String,
      trim: true,
      default: null,
    },

    // ── NOTES ─────────────────────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    adminNotes: {
      type: String,
      trim: true,
    },

    // ── METADATA ──────────────────────────────────────────────────────────────
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["web", "mobile", "desktop", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ payee: 1, status: 1 });
paymentSchema.index({ rental: 1 });
paymentSchema.index({ property: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ "paymentPeriod.year": 1, "paymentPeriod.month": 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
paymentSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

paymentSchema.virtual("isPending").get(function () {
  return this.status === "pending" || this.status === "processing";
});

paymentSchema.virtual("formattedAmount").get(function () {
  return `ETB ${this.amount.toLocaleString()}`;
});

paymentSchema.virtual("formattedNetAmount").get(function () {
  return `ETB ${this.netAmount.toLocaleString()}`;
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Generate unique transaction ID
paymentSchema.pre("save", function (next) {
  if (this.isNew && !this.transactionId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  next();
});

// Calculate platform commission and net amount
paymentSchema.pre("save", function (next) {
  if (
    this.isModified("amount") ||
    this.isModified("platformCommissionRate") ||
    this.isNew
  ) {
    // Only charge commission on rent payments
    if (this.paymentType === "monthly_rent") {
      this.platformCommission = Math.round(
        this.amount * this.platformCommissionRate,
      );
      this.netAmount = this.amount - this.platformCommission;
    } else {
      this.platformCommission = 0;
      this.netAmount = this.amount;
    }
  }
  next();
});

// Generate receipt number when payment completes
paymentSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.receiptNumber
  ) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.receiptNumber = `RCP-${year}-${random}`;
    this.paidAt = new Date();
  }
  next();
});

// Track status history
paymentSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get payment history for a tenant
paymentSchema.statics.getTenantPayments = function (tenantId, filters = {}) {
  const query = { payer: tenantId, ...filters };
  return this.find(query)
    .populate("property", "title location coverImage")
    .populate("payee", "firstName lastName")
    .sort({ createdAt: -1 });
};

// Get payment history for a landlord
paymentSchema.statics.getLandlordPayments = function (
  landlordId,
  filters = {},
) {
  const query = { payee: landlordId, ...filters };
  return this.find(query)
    .populate("payer", "firstName lastName avatar")
    .populate("property", "title location")
    .sort({ createdAt: -1 });
};

// Get platform revenue statistics
paymentSchema.statics.getPlatformRevenue = async function (
  startDate = null,
  endDate = null,
) {
  const matchStage = { status: "completed" };
  if (startDate || endDate) {
    matchStage.paidAt = {};
    if (startDate) matchStage.paidAt.$gte = new Date(startDate);
    if (endDate) matchStage.paidAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$paymentType",
        totalAmount: { $sum: "$amount" },
        totalCommission: { $sum: "$platformCommission" },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalTransactions: 0,
    totalVolume: 0,
    totalCommission: 0,
    byType: {},
  };

  stats.forEach((stat) => {
    result.totalTransactions += stat.count;
    result.totalVolume += stat.totalAmount;
    result.totalCommission += stat.totalCommission;
    result.byType[stat._id] = {
      count: stat.count,
      amount: stat.totalAmount,
      commission: stat.totalCommission,
    };
  });

  return result;
};

// Get monthly revenue chart data
paymentSchema.statics.getMonthlyRevenue = async function (year) {
  const stats = await this.aggregate([
    {
      $match: {
        status: "completed",
        "paymentPeriod.year": year,
      },
    },
    {
      $group: {
        _id: "$paymentPeriod.month",
        totalAmount: { $sum: "$amount" },
        totalCommission: { $sum: "$platformCommission" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in missing months with zeros
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalAmount: 0,
    totalCommission: 0,
    count: 0,
  }));

  stats.forEach((stat) => {
    if (stat._id >= 1 && stat._id <= 12) {
      monthlyData[stat._id - 1] = {
        month: stat._id,
        totalAmount: stat.totalAmount,
        totalCommission: stat.totalCommission,
        count: stat.count,
      };
    }
  });

  return monthlyData;
};

// Check if rent is already paid for a specific period
paymentSchema.statics.isRentPaidForPeriod = async function (
  rentalId,
  month,
  year,
) {
  const payment = await this.findOne({
    rental: rentalId,
    paymentType: "monthly_rent",
    status: "completed",
    "paymentPeriod.month": month,
    "paymentPeriod.year": year,
  });
  return !!payment;
};

// Get overdue payments
paymentSchema.statics.getOverduePayments = function () {
  return this.find({
    status: "pending",
    dueDate: { $lt: new Date() },
  })
    .populate("payer", "firstName lastName email phone")
    .populate("payee", "firstName lastName email")
    .populate("property", "title location")
    .sort({ dueDate: 1 });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Mark payment as completed
paymentSchema.methods.markCompleted = async function (
  externalTransactionId = null,
) {
  this.status = "completed";
  this.paidAt = new Date();
  if (externalTransactionId) {
    this.externalTransactionId = externalTransactionId;
  }
  return await this.save();
};

// Mark payment as failed
paymentSchema.methods.markFailed = async function (reason = null) {
  this.status = "failed";
  this.failureReason = reason;
  return await this.save();
};

// Process refund
paymentSchema.methods.processRefund = async function (
  refundAmount,
  reason,
  refundTransactionId = null,
) {
  const isFullRefund = refundAmount >= this.amount;
  this.isRefunded = true;
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  this.status = isFullRefund ? "refunded" : "partially_refunded";
  if (refundTransactionId) this.refundTransactionId = refundTransactionId;
  return await this.save();
};

// Raise a dispute
paymentSchema.methods.raiseDispute = async function (reason) {
  this.isDisputed = true;
  this.disputeReason = reason;
  this.disputeRaisedAt = new Date();
  this.status = "disputed";
  return await this.save();
};

// Resolve a dispute
paymentSchema.methods.resolveDispute = async function (resolution) {
  this.disputeResolution = resolution;
  this.disputeResolvedAt = new Date();
  this.status = "completed";
  return await this.save();
};

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
