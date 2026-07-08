const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // ── BASIC INFO ────────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^(\+251|0)[79]\d{8}$/,
        "Please provide a valid Ethiopian phone number",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["tenant", "landlord", "admin"],
        message: "Role must be tenant, landlord, or admin",
      },
      default: "tenant",
    },

    // ── PROFILE ───────────────────────────────────────────────────────────────
    avatar: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    address: {
      street: { type: String, trim: true },
      subCity: { type: String, trim: true },
      city: { type: String, trim: true, default: "Addis Ababa" },
      region: { type: String, trim: true },
      country: { type: String, trim: true, default: "Ethiopia" },
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, "Occupation cannot exceed 100 characters"],
    },
    nationalId: {
      type: String,
      trim: true,
    },

    // ── ACCOUNT STATUS ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "deactivated", "pending"],
      default: "pending",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    // ── KYC VERIFICATION ──────────────────────────────────────────────────────
    isKYCVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    kycSubmittedAt: {
      type: Date,
      default: null,
    },
    kycVerifiedAt: {
      type: Date,
      default: null,
    },
    kycRejectionReason: {
      type: String,
      default: null,
    },
    kycDocuments: {
      nationalId: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
      },
      selfie: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
      },
      proofOfAddress: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
      },
      proofOfOwnership: {
        public_id: { type: String, default: null },
        url: { type: String, default: null },
      },
    },

    // ── LANDLORD SPECIFIC ─────────────────────────────────────────────────────
    // Only populated when role === 'landlord'
    landlordProfile: {
      businessName: { type: String, trim: true },
      totalProperties: { type: Number, default: 0 },
      totalTenants: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0, min: 0, max: 100 },
      responseTime: { type: String, default: "Within a day" },
      isVerifiedLandlord: { type: Boolean, default: false },
      joinedAsLandlordAt: { type: Date },
      bankAccountName: { type: String, trim: true },
      bankAccountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      telebirrNumber: { type: String, trim: true },
    },

    // ── TENANT SPECIFIC ───────────────────────────────────────────────────────
    // Only populated when role === 'tenant'
    tenantProfile: {
      currentRentalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rental",
        default: null,
      },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      rentalHistory: { type: Number, default: 0 },
      isGoodTenant: { type: Boolean, default: false },
      employmentStatus: {
        type: String,
        enum: ["employed", "self_employed", "student", "unemployed", "other"],
      },
      monthlyIncome: { type: Number },
      emergencyContact: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        relationship: { type: String, trim: true },
      },
    },

    // ── AI PREFERENCES ────────────────────────────────────────────────────────
    // Stores user preferences for AI personalization
    aiPreferences: {
      // Voice settings for AI assistant
      voiceLanguage: {
        type: String,
        enum: ["en-US", "en-ET", "am-ET"],
        default: "en-US",
      },
      voiceSpeed: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0,
      },
      voiceEnabled: {
        type: Boolean,
        default: true,
      },
      // Property preferences for AI recommendations
      preferredCities: [{ type: String }],
      preferredSubCities: [{ type: String }],
      preferredPropertyTypes: [{ type: String }],
      preferredAmenities: [{ type: String }],
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 0 },
      preferredBedrooms: { type: Number },
      // AI chat preferences
      aiChatEnabled: {
        type: Boolean,
        default: true,
      },
      aiRecommendationsEnabled: {
        type: Boolean,
        default: true,
      },
      // Search behavior
      naturalLanguageSearchEnabled: {
        type: Boolean,
        default: true,
      },
      lastSearchQuery: {
        type: String,
        default: null,
      },
    },

    // ── AI INTERACTION HISTORY ────────────────────────────────────────────────
    aiInteractionStats: {
      totalChats: { type: Number, default: 0 },
      totalSearches: { type: Number, default: 0 },
      totalRecommendationsViewed: { type: Number, default: 0 },
      totalRecommendationsClicked: { type: Number, default: 0 },
      lastAIChatAt: { type: Date, default: null },
      lastAISearchAt: { type: Date, default: null },
    },

    // ── SUBSCRIPTION ──────────────────────────────────────────────────────────
    // For landlords — controls how many listings they can create
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled", "trial"],
      default: "active",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    maxListings: {
      type: Number,
      default: 3, // Free plan allows 3 listings
    },

    // ── NOTIFICATIONS PREFERENCES ─────────────────────────────────────────────
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      paymentReminders: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      maintenanceUpdates: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      aiRecommendationEmails: { type: Boolean, default: true },
    },

    // ── AUTHENTICATION ────────────────────────────────────────────────────────
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // ── ACTIVITY TRACKING ─────────────────────────────────────────────────────
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    deviceTokens: [
      {
        token: String,
        platform: { type: String, enum: ["ios", "android", "web"] },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ── SOCIAL / REFERRAL ─────────────────────────────────────────────────────
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referralCount: {
      type: Number,
      default: 0,
    },

    // ── ADMIN SPECIFIC ────────────────────────────────────────────────────────
    adminPermissions: {
      canManageUsers: { type: Boolean, default: false },
      canManageProperties: { type: Boolean, default: false },
      canManagePayments: { type: Boolean, default: false },
      canManageContent: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
      isSuperAdmin: { type: Boolean, default: false },
    },

    // ── DELETION ──────────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "aiPreferences.preferredCities": 1 });
userSchema.index({ referralCode: 1 }, { sparse: true });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual("avatarUrl").get(function () {
  if (this.avatar && this.avatar.url) return this.avatar.url;
  // Generate fallback avatar using UI Avatars service
  const name = encodeURIComponent(`${this.firstName} ${this.lastName}`);
  return `https://ui-avatars.com/api/?name=${name}&background=c9a84c&color=07080f&size=200&bold=true`;
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password was actually modified
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

    // Set passwordChangedAt when password is changed (not on first save)
    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code on first save
userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = `NF${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }
  next();
});

// Set default admin permissions when role is admin
userSchema.pre("save", function (next) {
  if (this.isModified("role") && this.role === "admin") {
    this.adminPermissions = {
      canManageUsers: true,
      canManageProperties: true,
      canManagePayments: true,
      canManageContent: true,
      canViewReports: true,
      canManageSettings: true,
      isSuperAdmin: false,
    };
  }
  next();
});

// Set max listings based on subscription plan
userSchema.pre("save", function (next) {
  if (this.isModified("subscriptionPlan")) {
    const limits = {
      free: 3,
      basic: 10,
      premium: 50,
      enterprise: Infinity,
    };
    this.maxListings = limits[this.subscriptionPlan] || 3;
  }
  next();
});

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if password was changed after a given JWT timestamp
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return resetToken; // Return unhashed version to send in email
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return verificationToken;
};

// Increment failed login attempts and lock account if needed
userSchema.methods.incrementFailedLogins = async function () {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save({ validateBeforeSave: false });
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedLogins = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  this.lastActiveAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// Update AI preferences
userSchema.methods.updateAIPreferences = async function (preferences) {
  Object.assign(this.aiPreferences, preferences);
  await this.save({ validateBeforeSave: false });
};

// Increment AI interaction stats
userSchema.methods.incrementAIStats = async function (statType) {
  const validStats = [
    "totalChats",
    "totalSearches",
    "totalRecommendationsViewed",
    "totalRecommendationsClicked",
  ];

  if (validStats.includes(statType)) {
    this.aiInteractionStats[statType] += 1;

    if (statType === "totalChats") {
      this.aiInteractionStats.lastAIChatAt = new Date();
    }
    if (statType === "totalSearches") {
      this.aiInteractionStats.lastAISearchAt = new Date();
    }

    await this.save({ validateBeforeSave: false });
  }
};

// Check if account is currently locked
userSchema.methods.isAccountLocked = function () {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  return false;
};

// Get safe public profile (no sensitive fields)
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    avatar: this.avatarUrl,
    role: this.role,
    isKYCVerified: this.isKYCVerified,
    landlordProfile:
      this.role === "landlord"
        ? {
            averageRating: this.landlordProfile?.averageRating,
            totalReviews: this.landlordProfile?.totalReviews,
            totalProperties: this.landlordProfile?.totalProperties,
            isVerifiedLandlord: this.landlordProfile?.isVerifiedLandlord,
            responseRate: this.landlordProfile?.responseRate,
            responseTime: this.landlordProfile?.responseTime,
          }
        : undefined,
    createdAt: this.createdAt,
  };
};

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Find user by email (includes password for auth)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select(
    "+password +failedLoginAttempts +lockUntil",
  );
};

// Find active users by role
userSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, status: "active", isDeleted: false });
};

// Get platform user statistics for admin dashboard
userSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        kycVerifiedCount: {
          $sum: { $cond: ["$isKYCVerified", 1, 0] },
        },
      },
    },
  ]);

  const result = {
    total: 0,
    tenants: 0,
    landlords: 0,
    admins: 0,
    activeUsers: 0,
    kycVerified: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    result.activeUsers += stat.activeCount;
    result.kycVerified += stat.kycVerifiedCount;
    if (stat._id === "tenant") result.tenants = stat.count;
    if (stat._id === "landlord") result.landlords = stat.count;
    if (stat._id === "admin") result.admins = stat.count;
  });

  return result;
};

// Soft delete user
userSchema.statics.softDelete = async function (userId) {
  return this.findByIdAndUpdate(userId, {
    isDeleted: true,
    deletedAt: new Date(),
    status: "deactivated",
  });
};

// ── QUERY HELPERS ─────────────────────────────────────────────────────────────

// Always exclude deleted users from queries
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
