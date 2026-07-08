const mongoose = require("mongoose");
const crypto = require("crypto");

const contractSchema = new mongoose.Schema(
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
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // ── CONTRACT ID ───────────────────────────────────────────────────────────
    contractNumber: {
      type: String,
      unique: true,
    },

    // ── LEASE TERMS ───────────────────────────────────────────────────────────
    terms: {
      startDate: {
        type: Date,
        required: [true, "Lease start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "Lease end date is required"],
      },
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
      },
      paymentDueDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 28,
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
      gracePeriodDays: {
        type: Number,
        default: 5,
      },
      noticePeriodDays: {
        type: Number,
        default: 30,
      },
      utilityBillsIncluded: {
        type: Boolean,
        default: false,
      },
      minimumLeaseDuration: {
        type: Number,
        default: 6,
      },
      minimumLeaseDurationUnit: {
        type: String,
        enum: ["months", "years"],
        default: "months",
      },
      renewalOption: {
        type: Boolean,
        default: true,
      },
      earlyTerminationFee: {
        type: Number,
        default: 0,
      },
      petPolicy: {
        type: String,
        enum: ["allowed", "not_allowed", "negotiable"],
        default: "not_allowed",
      },
      smokingPolicy: {
        type: String,
        enum: ["allowed", "not_allowed", "outside_only"],
        default: "not_allowed",
      },
      guestPolicy: {
        type: String,
        trim: true,
      },
      maintenanceResponsibility: {
        type: String,
        trim: true,
      },
      additionalTerms: {
        type: String,
        trim: true,
        maxlength: [5000, "Additional terms cannot exceed 5000 characters"],
      },
    },

    // ── CONTRACT BODY ─────────────────────────────────────────────────────────
    // Full contract text generated from template
    contractBody: {
      type: String,
      trim: true,
    },

    // ── E-SIGNATURES ──────────────────────────────────────────────────────────
    landlordSignature: {
      isSigned: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
      signatureData: { type: String, default: null }, // Base64 signature image
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
      signatureHash: { type: String, default: null, select: false },
    },
    tenantSignature: {
      isSigned: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
      signatureData: { type: String, default: null },
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
      signatureHash: { type: String, default: null, select: false },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "pending_landlord_signature",
          "pending_tenant_signature",
          "active",
          "expired",
          "terminated",
          "renewed",
          "cancelled",
        ],
        message: "Invalid contract status",
      },
      default: "draft",
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

    // ── PDF DOCUMENT ──────────────────────────────────────────────────────────
    pdfDocument: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
      generatedAt: { type: Date, default: null },
    },

    // ── RENEWAL ───────────────────────────────────────────────────────────────
    isRenewal: {
      type: Boolean,
      default: false,
    },
    renewedFromContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },

    // ── VERIFICATION ──────────────────────────────────────────────────────────
    // Unique hash to verify contract authenticity
    verificationHash: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI plain-language summary for tenants
      plainLanguageSummary: {
        type: String,
        default: null,
      },
      // Key obligations extracted by AI
      keyObligations: {
        tenant: [{ type: String }],
        landlord: [{ type: String }],
      },
      // Important dates extracted by AI
      keyDates: [
        {
          date: { type: Date },
          description: { type: String },
          importance: {
            type: String,
            enum: ["low", "medium", "high"],
          },
        },
      ],
      // AI-flagged risky clauses
      riskyClause: [
        {
          clause: { type: String },
          risk: { type: String },
          severity: {
            type: String,
            enum: ["low", "medium", "high"],
          },
        },
      ],
      // AI explanation language
      summaryLanguage: {
        type: String,
        enum: ["en", "am"],
        default: "en",
      },
      summaryGeneratedAt: {
        type: Date,
        default: null,
      },
    },

    // ── TIMESTAMPS ────────────────────────────────────────────────────────────
    activatedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    terminatedAt: { type: Date, default: null },
    sentToTenantAt: { type: Date, default: null },
    viewedByTenantAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
contractSchema.index({ tenant: 1, status: 1 });
contractSchema.index({ landlord: 1, status: 1 });
contractSchema.index({ property: 1 });
contractSchema.index({ contractNumber: 1 }, { unique: true });
contractSchema.index({ status: 1 });
contractSchema.index({ "terms.endDate": 1 });
contractSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
contractSchema.virtual("isBothSigned").get(function () {
  return this.landlordSignature.isSigned && this.tenantSignature.isSigned;
});

contractSchema.virtual("isLandlordSigned").get(function () {
  return this.landlordSignature.isSigned;
});

contractSchema.virtual("isTenantSigned").get(function () {
  return this.tenantSignature.isSigned;
});

contractSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.terms.endDate || this.status !== "active") return null;
  const remaining = this.terms.endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
});

contractSchema.virtual("isExpiringSoon").get(function () {
  return this.daysUntilExpiry !== null && this.daysUntilExpiry <= 60;
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Generate unique contract number
contractSchema.pre("save", async function (next) {
  if (this.isNew && !this.contractNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Contract").countDocuments();
    this.contractNumber = `CTR-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Generate verification hash when both parties sign
contractSchema.pre("save", function (next) {
  if (
    this.isModified("landlordSignature.isSigned") ||
    this.isModified("tenantSignature.isSigned")
  ) {
    if (this.landlordSignature.isSigned && this.tenantSignature.isSigned) {
      // Create verification hash from contract data
      const hashData = `${this.contractNumber}-${this.tenant}-${this.landlord}-${this.terms.startDate}-${this.terms.endDate}-${this.terms.monthlyRent}`;
      this.verificationHash = crypto
        .createHash("sha256")
        .update(hashData)
        .digest("hex");
      this.status = "active";
      this.activatedAt = new Date();
    }
  }
  next();
});

// Track status history
contractSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get contracts pending tenant signature
contractSchema.statics.getPendingTenantSignature = function (tenantId) {
  return this.find({
    tenant: tenantId,
    status: "pending_tenant_signature",
  })
    .populate("property", "title location coverImage pricing")
    .populate("landlord", "firstName lastName avatar")
    .sort({ createdAt: -1 });
};

// Get all contracts for a tenant
contractSchema.statics.getTenantContracts = function (tenantId) {
  return this.find({ tenant: tenantId })
    .populate("property", "title location coverImage pricing")
    .populate("landlord", "firstName lastName avatar phone")
    .sort({ createdAt: -1 });
};

// Get all contracts for a landlord
contractSchema.statics.getLandlordContracts = function (landlordId) {
  return this.find({ landlord: landlordId })
    .populate("tenant", "firstName lastName avatar phone email")
    .populate("property", "title location coverImage")
    .sort({ createdAt: -1 });
};

// Get contracts expiring soon
contractSchema.statics.getExpiringSoon = function (daysThreshold = 60) {
  const thresholdDate = new Date(
    Date.now() + daysThreshold * 24 * 60 * 60 * 1000,
  );
  return this.find({
    status: "active",
    "terms.endDate": { $lte: thresholdDate, $gte: new Date() },
  })
    .populate("tenant", "firstName lastName email phone")
    .populate("landlord", "firstName lastName email phone")
    .populate("property", "title location");
};

// Verify contract authenticity by hash
contractSchema.statics.verifyContract = async function (
  contractNumber,
  verificationHash,
) {
  const contract = await this.findOne({ contractNumber, verificationHash });
  return !!contract;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Sign contract as landlord
contractSchema.methods.signAsLandlord = async function (
  signatureData,
  ipAddress,
  userAgent,
) {
  this.landlordSignature = {
    isSigned: true,
    signedAt: new Date(),
    signatureData,
    ipAddress,
    userAgent,
    signatureHash: crypto
      .createHash("sha256")
      .update(`${this._id}-landlord-${Date.now()}`)
      .digest("hex"),
  };

  // Update status based on tenant signature
  if (this.tenantSignature.isSigned) {
    this.status = "active";
  } else {
    this.status = "pending_tenant_signature";
    this.sentToTenantAt = new Date();
  }

  return await this.save();
};

// Sign contract as tenant
contractSchema.methods.signAsTenant = async function (
  signatureData,
  ipAddress,
  userAgent,
) {
  this.tenantSignature = {
    isSigned: true,
    signedAt: new Date(),
    signatureData,
    ipAddress,
    userAgent,
    signatureHash: crypto
      .createHash("sha256")
      .update(`${this._id}-tenant-${Date.now()}`)
      .digest("hex"),
  };

  // If landlord already signed, activate contract
  if (this.landlordSignature.isSigned) {
    this.status = "active";
    this.activatedAt = new Date();
  }

  return await this.save();
};

// Terminate contract
contractSchema.methods.terminate = async function (reason, terminatedBy) {
  this.status = "terminated";
  this.terminatedAt = new Date();
  this.statusHistory.push({
    status: "terminated",
    changedBy: terminatedBy,
    changedAt: new Date(),
    note: reason,
  });
  return await this.save();
};

// Update AI summary
contractSchema.methods.updateAISummary = async function (summaryData) {
  this.ai = {
    ...this.ai,
    ...summaryData,
    summaryGeneratedAt: new Date(),
  };
  return await this.save();
};

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
