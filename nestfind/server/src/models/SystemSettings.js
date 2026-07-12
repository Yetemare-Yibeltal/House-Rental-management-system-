const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    // ── SINGLETON IDENTIFIER ──────────────────────────────────────────────────
    // Only one document ever exists — identified by this key
    key: {
      type: String,
      default: "system_settings",
      unique: true,
    },

    // ── PLATFORM INFO ─────────────────────────────────────────────────────────
    platform: {
      name: { type: String, default: "NestFind" },
      tagline: {
        type: String,
        default: "Ethiopia's Premier AI-Powered House Rental Platform",
      },
      supportEmail: {
        type: String,
        default: "support@nestfind.et",
      },
      supportPhone: {
        type: String,
        default: "+251911000000",
      },
      address: {
        type: String,
        default: "Bole, Addis Ababa, Ethiopia",
      },
      logoUrl: { type: String, default: null },
      faviconUrl: { type: String, default: null },
      primaryColor: { type: String, default: "#c9a84c" },
      secondaryColor: { type: String, default: "#07080f" },
    },

    // ── MAINTENANCE MODE ──────────────────────────────────────────────────────
    maintenance: {
      isEnabled: { type: Boolean, default: false },
      message: {
        type: String,
        default:
          "NestFind is currently undergoing scheduled maintenance. We will be back shortly.",
      },
      estimatedEndTime: { type: Date, default: null },
      allowAdminAccess: { type: Boolean, default: true },
    },

    // ── PAYMENT SETTINGS ──────────────────────────────────────────────────────
    payments: {
      platformCommissionRate: {
        type: Number,
        default: 0.05, // 5%
        min: 0,
        max: 0.5,
      },
      minimumRentAmount: {
        type: Number,
        default: 1000, // ETB
      },
      maximumRentAmount: {
        type: Number,
        default: 1000000, // ETB
      },
      currency: {
        type: String,
        default: "ETB",
      },
      acceptedPaymentMethods: {
        cbeTransfer: { type: Boolean, default: true },
        telebirr: { type: Boolean, default: true },
        visaDebit: { type: Boolean, default: true },
        mastercard: { type: Boolean, default: false },
        cash: { type: Boolean, default: true },
      },
      lateFeeEnabled: { type: Boolean, default: true },
      defaultLateFeeRate: { type: Number, default: 0.05 }, // 5%
      defaultGracePeriodDays: { type: Number, default: 5 },
    },

    // ── LISTING SETTINGS ──────────────────────────────────────────────────────
    listings: {
      requireAdminApproval: { type: Boolean, default: true },
      maxImagesPerProperty: { type: Number, default: 10 },
      maxImageSizeMB: { type: Number, default: 5 },
      featuredListingDurationDays: { type: Number, default: 30 },
      featuredListingFee: { type: Number, default: 500 }, // ETB
      autoExpireListingsAfterDays: { type: Number, default: 90 },
      freeListingsPerLandlord: { type: Number, default: 3 },
    },

    // ── USER SETTINGS ─────────────────────────────────────────────────────────
    users: {
      requireEmailVerification: { type: Boolean, default: true },
      requireKYCForLandlords: { type: Boolean, default: true },
      requireKYCForTenants: { type: Boolean, default: false },
      maxLoginAttempts: { type: Number, default: 5 },
      lockoutDurationMinutes: { type: Number, default: 30 },
      sessionDurationHours: { type: Number, default: 24 },
      allowGoogleLogin: { type: Boolean, default: false },
      allowFacebookLogin: { type: Boolean, default: false },
      minPasswordLength: { type: Number, default: 8 },
      requireStrongPassword: { type: Boolean, default: true },
    },

    // ── AI SETTINGS ───────────────────────────────────────────────────────────
    ai: {
      // Master AI toggle
      aiEnabled: { type: Boolean, default: true },
      // Feature toggles
      features: {
        chatAssistant: { type: Boolean, default: true },
        propertyRecommendations: { type: Boolean, default: true },
        smartSearch: { type: Boolean, default: true },
        rentPriceAdvisor: { type: Boolean, default: true },
        leaseExplainer: { type: Boolean, default: true },
        maintenanceDiagnosis: { type: Boolean, default: true },
        fraudDetection: { type: Boolean, default: true },
        propertyDescriptionGenerator: { type: Boolean, default: true },
        sentimentAnalysis: { type: Boolean, default: true },
        voiceInput: { type: Boolean, default: true },
        voiceOutput: { type: Boolean, default: true },
      },
      // AI model settings
      model: {
        type: String,
        default: "claude-sonnet-4-6",
      },
      maxTokensPerRequest: {
        type: Number,
        default: 2000,
      },
      // Rate limits for AI features
      rateLimits: {
        chatMessagesPerHour: { type: Number, default: 50 },
        searchesPerHour: { type: Number, default: 100 },
        recommendationsPerDay: { type: Number, default: 20 },
      },
      // Fraud detection thresholds
      fraudDetection: {
        autoFlagThreshold: { type: Number, default: 70 }, // Flag if score >= 70
        autoRejectThreshold: { type: Number, default: 90 }, // Reject if score >= 90
        notifyAdminThreshold: { type: Number, default: 50 },
      },
    },

    // ── EMAIL SETTINGS ────────────────────────────────────────────────────────
    email: {
      fromName: { type: String, default: "NestFind" },
      fromAddress: { type: String, default: "noreply@nestfind.et" },
      supportAddress: { type: String, default: "support@nestfind.et" },
      sendWelcomeEmail: { type: Boolean, default: true },
      sendPaymentReceipts: { type: Boolean, default: true },
      sendBookingNotifications: { type: Boolean, default: true },
      sendMaintenanceUpdates: { type: Boolean, default: true },
      sendRenewalReminders: { type: Boolean, default: true },
      renewalReminderDaysBefore: { type: Number, default: 60 },
    },

    // ── SMS SETTINGS ──────────────────────────────────────────────────────────
    sms: {
      smsEnabled: { type: Boolean, default: false },
      sendOTPViaSMS: { type: Boolean, default: false },
      sendPaymentAlerts: { type: Boolean, default: false },
    },

    // ── NOTIFICATION SETTINGS ─────────────────────────────────────────────────
    notifications: {
      maxNotificationsPerUser: { type: Number, default: 100 },
      deleteAfterDays: { type: Number, default: 90 },
      realTimeEnabled: { type: Boolean, default: true },
    },

    // ── REVIEW SETTINGS ───────────────────────────────────────────────────────
    reviews: {
      requireApproval: { type: Boolean, default: true },
      allowAnonymous: { type: Boolean, default: false },
      minRentalDaysBeforeReview: { type: Number, default: 30 },
      maxDaysAfterRentalToReview: { type: Number, default: 90 },
    },

    // ── SECURITY SETTINGS ─────────────────────────────────────────────────────
    security: {
      jwtAccessTokenExpiryMinutes: { type: Number, default: 15 },
      jwtRefreshTokenExpiryDays: { type: Number, default: 7 },
      otpExpiryMinutes: { type: Number, default: 10 },
      otpMaxAttempts: { type: Number, default: 5 },
      enableRateLimit: { type: Boolean, default: true },
      globalRateLimitPerMinute: { type: Number, default: 100 },
    },

    // ── FEATURE FLAGS ─────────────────────────────────────────────────────────
    features: {
      blogEnabled: { type: Boolean, default: true },
      faqEnabled: { type: Boolean, default: true },
      reviewsEnabled: { type: Boolean, default: true },
      messagingEnabled: { type: Boolean, default: true },
      videoToursEnabled: { type: Boolean, default: false },
      virtualToursEnabled: { type: Boolean, default: false },
      mapEnabled: { type: Boolean, default: true },
      referralProgramEnabled: { type: Boolean, default: false },
    },

    // ── LAST UPDATED BY ───────────────────────────────────────────────────────
    lastUpdatedBy: {
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

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get the single settings document (create if not exists)
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "system_settings" });
  if (!settings) {
    settings = await this.create({ key: "system_settings" });
  }
  return settings;
};

// Update specific settings section
systemSettingsSchema.statics.updateSection = async function (
  section,
  data,
  updatedBy = null,
) {
  const update = {};
  Object.keys(data).forEach((key) => {
    update[`${section}.${key}`] = data[key];
  });
  update.lastUpdatedBy = updatedBy;

  return await this.findOneAndUpdate(
    { key: "system_settings" },
    { $set: update },
    { new: true, upsert: true },
  );
};

// Check if a feature is enabled
systemSettingsSchema.statics.isFeatureEnabled = async function (featurePath) {
  const settings = await this.getSettings();
  const parts = featurePath.split(".");
  let value = settings;
  for (const part of parts) {
    if (value === undefined || value === null) return false;
    value = value[part];
  }
  return !!value;
};

// Check if AI feature is enabled
systemSettingsSchema.statics.isAIFeatureEnabled = async function (featureName) {
  const settings = await this.getSettings();
  if (!settings.ai.aiEnabled) return false;
  return !!settings.ai.features[featureName];
};

// Enable maintenance mode
systemSettingsSchema.statics.enableMaintenance = async function (
  message = null,
  estimatedEndTime = null,
) {
  const update = {
    "maintenance.isEnabled": true,
  };
  if (message) update["maintenance.message"] = message;
  if (estimatedEndTime)
    update["maintenance.estimatedEndTime"] = estimatedEndTime;

  return await this.findOneAndUpdate(
    { key: "system_settings" },
    { $set: update },
    { new: true, upsert: true },
  );
};

// Disable maintenance mode
systemSettingsSchema.statics.disableMaintenance = async function () {
  return await this.findOneAndUpdate(
    { key: "system_settings" },
    {
      $set: {
        "maintenance.isEnabled": false,
        "maintenance.estimatedEndTime": null,
      },
    },
    { new: true },
  );
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Check if system is in maintenance mode
systemSettingsSchema.methods.isInMaintenance = function () {
  return this.maintenance.isEnabled;
};

// Get commission rate
systemSettingsSchema.methods.getCommissionRate = function () {
  return this.payments.platformCommissionRate;
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

module.exports = SystemSettings;
