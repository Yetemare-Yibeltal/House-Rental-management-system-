const mongoose = require("mongoose");

const kycVerificationSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    // ── PERSONAL INFO ─────────────────────────────────────────────────────────
    personalInfo: {
      fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
      },
      dateOfBirth: {
        type: Date,
        required: [true, "Date of birth is required"],
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: [true, "Gender is required"],
      },
      nationality: {
        type: String,
        trim: true,
        default: "Ethiopian",
      },
      occupation: {
        type: String,
        trim: true,
      },
      address: {
        street: { type: String, trim: true },
        subCity: { type: String, trim: true },
        city: { type: String, trim: true, default: "Addis Ababa" },
        region: { type: String, trim: true },
        country: { type: String, trim: true, default: "Ethiopia" },
      },
    },

    // ── IDENTITY DOCUMENTS ────────────────────────────────────────────────────
    documents: {
      nationalId: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        documentNumber: { type: String, trim: true, default: null },
        expiryDate: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
      },
      passport: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        documentNumber: { type: String, trim: true, default: null },
        expiryDate: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
      },
      drivingLicense: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        documentNumber: { type: String, trim: true, default: null },
        expiryDate: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
      },
      selfie: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
      },
      proofOfAddress: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        documentType: {
          type: String,
          enum: ["utility_bill", "bank_statement", "lease_agreement", "other"],
          default: null,
        },
        isVerified: { type: Boolean, default: false },
      },
      // Landlord specific
      proofOfOwnership: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
        documentType: {
          type: String,
          enum: ["title_deed", "purchase_receipt", "inheritance_doc", "other"],
          default: null,
        },
        isVerified: { type: Boolean, default: false },
      },
    },

    // ── PRIMARY DOCUMENT TYPE ─────────────────────────────────────────────────
    primaryDocumentType: {
      type: String,
      enum: ["national_id", "passport", "driving_license"],
      required: [true, "Primary document type is required"],
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "submitted",
          "under_review",
          "approved",
          "rejected",
          "resubmission_required",
        ],
        message: "Invalid KYC status",
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

    // ── SUBMISSION ────────────────────────────────────────────────────────────
    submittedAt: {
      type: Date,
      default: null,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },

    // ── REVIEW ────────────────────────────────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // ── APPROVAL ─────────────────────────────────────────────────────────────
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },

    // ── REJECTION ─────────────────────────────────────────────────────────────
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReasons: [
      {
        reason: { type: String, trim: true },
        field: { type: String, trim: true },
        severity: {
          type: String,
          enum: ["minor", "major", "critical"],
          default: "major",
        },
      },
    ],

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI pre-screening score (0-100, higher = better quality submission)
      prescreeningScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI detected issues
      detectedIssues: [
        {
          issue: { type: String },
          field: { type: String },
          severity: {
            type: String,
            enum: ["low", "medium", "high"],
          },
        },
      ],
      // Whether AI recommends approval
      aiRecommendation: {
        type: String,
        enum: ["approve", "review", "reject", null],
        default: null,
      },
      // AI confidence in recommendation
      aiConfidence: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // Whether document appears authentic
      isDocumentAuthentic: {
        type: Boolean,
        default: null,
      },
      // Whether selfie matches ID photo
      selfieMatchScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      prescreenedAt: {
        type: Date,
        default: null,
      },
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
    consentGiven: {
      type: Boolean,
      default: false,
      required: [true, "User consent is required"],
    },
    consentGivenAt: {
      type: Date,
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
kycVerificationSchema.index({ user: 1 }, { unique: true });
kycVerificationSchema.index({ status: 1 });
kycVerificationSchema.index({ submittedAt: -1 });
kycVerificationSchema.index({ reviewedBy: 1 });
kycVerificationSchema.index({ createdAt: -1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
kycVerificationSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

kycVerificationSchema.virtual("isPending").get(function () {
  return ["submitted", "under_review"].includes(this.status);
});

kycVerificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

kycVerificationSchema.virtual("daysSinceSubmission").get(function () {
  if (!this.submittedAt) return null;
  return Math.floor(
    (Date.now() - this.submittedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Track status history
kycVerificationSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

// Set consent timestamp
kycVerificationSchema.pre("save", function (next) {
  if (
    this.isModified("consentGiven") &&
    this.consentGiven &&
    !this.consentGivenAt
  ) {
    this.consentGivenAt = new Date();
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get pending KYC submissions for admin review
kycVerificationSchema.statics.getPendingReviews = function (
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;
  return this.find({
    status: { $in: ["submitted", "under_review"] },
  })
    .populate("user", "firstName lastName email phone role createdAt")
    .sort({ submittedAt: 1 })
    .skip(skip)
    .limit(limit);
};

// Get KYC statistics for admin dashboard
kycVerificationSchema.statics.getPlatformStats = async function () {
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
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    resubmission_required: 0,
  };

  stats.forEach((s) => {
    result.total += s.count;
    if (result[s._id] !== undefined) result[s._id] = s.count;
  });

  return result;
};

// Get KYC for a user
kycVerificationSchema.statics.getUserKYC = function (userId) {
  return this.findOne({ user: userId }).populate(
    "reviewedBy approvedBy rejectedBy",
    "firstName lastName",
  );
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Submit KYC for review
kycVerificationSchema.methods.submit = async function (ipAddress, userAgent) {
  this.status = "submitted";
  this.submittedAt = new Date();
  this.submissionCount += 1;
  this.ipAddress = ipAddress;
  this.userAgent = userAgent;
  this.statusHistory.push({
    status: "submitted",
    changedAt: new Date(),
  });
  return await this.save();
};

// Start admin review
kycVerificationSchema.methods.startReview = async function (adminId) {
  this.status = "under_review";
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.statusHistory.push({
    status: "under_review",
    changedBy: adminId,
    changedAt: new Date(),
  });
  return await this.save();
};

// Approve KYC
kycVerificationSchema.methods.approve = async function (
  adminId,
  notes = null,
  expiryYears = 2,
) {
  this.status = "approved";
  this.approvedAt = new Date();
  this.approvedBy = adminId;
  this.reviewNotes = notes;
  this.expiresAt = new Date(
    Date.now() + expiryYears * 365 * 24 * 60 * 60 * 1000,
  );
  this.statusHistory.push({
    status: "approved",
    changedBy: adminId,
    changedAt: new Date(),
    note: notes,
  });

  // Update user's KYC status
  await mongoose.model("User").findByIdAndUpdate(this.user, {
    isKYCVerified: true,
    kycStatus: "approved",
    kycVerifiedAt: new Date(),
  });

  return await this.save();
};

// Reject KYC
kycVerificationSchema.methods.reject = async function (
  adminId,
  reasons = [],
  notes = null,
) {
  this.status = "rejected";
  this.rejectedAt = new Date();
  this.rejectedBy = adminId;
  this.rejectionReasons = reasons;
  this.reviewNotes = notes;
  this.statusHistory.push({
    status: "rejected",
    changedBy: adminId,
    changedAt: new Date(),
    note: notes,
  });

  // Update user's KYC status
  await mongoose.model("User").findByIdAndUpdate(this.user, {
    isKYCVerified: false,
    kycStatus: "rejected",
    kycRejectionReason: reasons.map((r) => r.reason).join(", "),
  });

  return await this.save();
};

// Request resubmission
kycVerificationSchema.methods.requestResubmission = async function (
  adminId,
  reasons = [],
  notes = null,
) {
  this.status = "resubmission_required";
  this.rejectionReasons = reasons;
  this.reviewNotes = notes;
  this.statusHistory.push({
    status: "resubmission_required",
    changedBy: adminId,
    changedAt: new Date(),
    note: notes,
  });
  return await this.save();
};

// Save AI prescreening results
kycVerificationSchema.methods.saveAIPrescreening = async function (data) {
  this.ai = { ...this.ai, ...data, prescreenedAt: new Date() };
  return await this.save();
};

const KYCVerification = mongoose.model(
  "KYCVerification",
  kycVerificationSchema,
);

module.exports = KYCVerification;
