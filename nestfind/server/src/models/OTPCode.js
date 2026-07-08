const mongoose = require("mongoose");
const crypto = require("crypto");

const otpCodeSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // null when OTP is sent before user exists (e.g. registration)
    },
    // Email or phone the OTP was sent to
    recipient: {
      type: String,
      required: [true, "Recipient email or phone is required"],
      trim: true,
      lowercase: true,
    },
    recipientType: {
      type: String,
      enum: ["email", "phone"],
      required: [true, "Recipient type is required"],
    },

    // ── OTP DATA ──────────────────────────────────────────────────────────────
    // Store hashed OTP — never store raw OTP in database
    otpHash: {
      type: String,
      required: [true, "OTP hash is required"],
      select: false,
    },
    // Length of the OTP code
    otpLength: {
      type: Number,
      default: 6,
    },

    // ── PURPOSE ───────────────────────────────────────────────────────────────
    purpose: {
      type: String,
      enum: {
        values: [
          "register", // Email verification during registration
          "login", // 2FA login verification
          "reset_password", // Password reset verification
          "verify_phone", // Phone number verification
          "verify_email", // Email re-verification
          "change_email", // Verify new email when changing
          "change_phone", // Verify new phone when changing
          "kyc_verification", // KYC identity verification
        ],
        message: "Invalid OTP purpose",
      },
      required: [true, "OTP purpose is required"],
    },

    // ── EXPIRY ────────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      required: [true, "Expiry time is required"],
    },

    // ── VERIFICATION STATUS ───────────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },

    // ── ATTEMPT TRACKING ──────────────────────────────────────────────────────
    // Max 5 attempts before OTP is invalidated
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isInvalidated: {
      type: Boolean,
      default: false,
    },
    invalidatedReason: {
      type: String,
      enum: [
        "max_attempts_exceeded",
        "expired",
        "new_otp_requested",
        "manually_invalidated",
      ],
      default: null,
    },

    // ── RATE LIMITING ─────────────────────────────────────────────────────────
    // Tracks how many OTPs sent to this recipient in the last window
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },

    // ── DELIVERY ──────────────────────────────────────────────────────────────
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
    },
    deliveryError: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
// TTL index — MongoDB auto-deletes expired OTPs
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpCodeSchema.index({ recipient: 1, purpose: 1 });
otpCodeSchema.index({ user: 1 });
otpCodeSchema.index({ createdAt: -1 });
otpCodeSchema.index({ isVerified: 1 });
otpCodeSchema.index({ isInvalidated: 1 });

// ── STATIC METHODS ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure OTP code
 * Returns 6-digit numeric string by default
 */
otpCodeSchema.statics.generateOTP = function (length = 6) {
  // Generate cryptographically secure random number
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = String(min + (randomNumber % range));
  return otp.padStart(length, "0");
};

/**
 * Hash an OTP for secure storage
 */
otpCodeSchema.statics.hashOTP = function (otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

/**
 * Create and save a new OTP record
 * Invalidates any existing unused OTPs for same recipient+purpose
 */
otpCodeSchema.statics.createOTP = async function (
  recipient,
  recipientType,
  purpose,
  options = {},
) {
  const {
    userId = null,
    expiryMinutes = 10,
    otpLength = 6,
    ipAddress = null,
    userAgent = null,
  } = options;

  // Invalidate any existing OTPs for this recipient and purpose
  await this.updateMany(
    {
      recipient: recipient.toLowerCase(),
      purpose,
      isVerified: false,
      isInvalidated: false,
      isUsed: false,
    },
    {
      isInvalidated: true,
      invalidatedReason: "new_otp_requested",
    },
  );

  // Generate new OTP
  const rawOTP = this.generateOTP(otpLength);
  const otpHash = this.hashOTP(rawOTP);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Save to database
  const otpRecord = await this.create({
    user: userId,
    recipient: recipient.toLowerCase(),
    recipientType,
    purpose,
    otpHash,
    otpLength,
    expiresAt,
    ipAddress,
    userAgent,
    deliveryStatus: "pending",
  });

  // Return both the record and raw OTP
  // Raw OTP is sent to user but never stored
  return { otpRecord, rawOTP };
};

/**
 * Verify an OTP code
 * Returns { success, message, otpRecord }
 */
otpCodeSchema.statics.verifyOTP = async function (
  recipient,
  purpose,
  submittedOTP,
) {
  // Find the most recent valid OTP for this recipient + purpose
  const otpRecord = await this.findOne({
    recipient: recipient.toLowerCase(),
    purpose,
    isVerified: false,
    isUsed: false,
    isInvalidated: false,
  })
    .select("+otpHash")
    .sort({ createdAt: -1 });

  // No OTP found
  if (!otpRecord) {
    return {
      success: false,
      message: "No active OTP found. Please request a new code.",
      otpRecord: null,
    };
  }

  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    await otpRecord.updateOne({
      isInvalidated: true,
      invalidatedReason: "expired",
    });
    return {
      success: false,
      message: "OTP has expired. Please request a new code.",
      otpRecord: null,
    };
  }

  // Check max attempts
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await otpRecord.updateOne({
      isInvalidated: true,
      invalidatedReason: "max_attempts_exceeded",
    });
    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new code.",
      otpRecord: null,
    };
  }

  // Hash submitted OTP and compare
  const submittedHash = this.hashOTP(String(submittedOTP).trim());

  if (submittedHash !== otpRecord.otpHash) {
    // Increment failed attempts
    await otpRecord.updateOne({
      $inc: { attempts: 1 },
    });

    const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts - 1;

    return {
      success: false,
      message: `Incorrect OTP code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`,
      otpRecord: null,
    };
  }

  // OTP is correct — mark as verified and used
  await otpRecord.updateOne({
    isVerified: true,
    isUsed: true,
    verifiedAt: new Date(),
  });

  return {
    success: true,
    message: "OTP verified successfully.",
    otpRecord,
  };
};

/**
 * Check if rate limit is exceeded for sending OTPs
 * Max 3 OTPs per 10 minutes per recipient per purpose
 */
otpCodeSchema.statics.isRateLimited = async function (
  recipient,
  purpose,
  windowMinutes = 10,
  maxCount = 3,
) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await this.countDocuments({
    recipient: recipient.toLowerCase(),
    purpose,
    createdAt: { $gte: windowStart },
  });

  return count >= maxCount;
};

/**
 * Get count of OTPs sent in the last window
 * Used for displaying rate limit info to user
 */
otpCodeSchema.statics.getRecentCount = async function (
  recipient,
  purpose,
  windowMinutes = 10,
) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return await this.countDocuments({
    recipient: recipient.toLowerCase(),
    purpose,
    createdAt: { $gte: windowStart },
  });
};

/**
 * Mark OTP delivery as sent
 */
otpCodeSchema.statics.markAsSent = async function (otpId) {
  return await this.findByIdAndUpdate(otpId, {
    deliveryStatus: "sent",
    sentAt: new Date(),
  });
};

/**
 * Mark OTP delivery as failed
 */
otpCodeSchema.statics.markAsFailed = async function (otpId, error) {
  return await this.findByIdAndUpdate(otpId, {
    deliveryStatus: "failed",
    deliveryError: error,
  });
};

/**
 * Clean up old verified/used OTPs older than 24 hours
 * Run as a scheduled job
 */
otpCodeSchema.statics.cleanupOldOTPs = async function () {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({
    $or: [
      { isVerified: true, verifiedAt: { $lt: cutoff } },
      { isUsed: true, updatedAt: { $lt: cutoff } },
      { isInvalidated: true, updatedAt: { $lt: cutoff } },
    ],
  });
  return result.deletedCount;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Check if this OTP is still valid
otpCodeSchema.methods.isValid = function () {
  return (
    !this.isVerified &&
    !this.isUsed &&
    !this.isInvalidated &&
    this.expiresAt > new Date() &&
    this.attempts < this.maxAttempts
  );
};

// Get time remaining until expiry in seconds
otpCodeSchema.methods.getTimeRemaining = function () {
  const remaining = Math.floor((this.expiresAt - Date.now()) / 1000);
  return Math.max(0, remaining);
};

const OTPCode = mongoose.model("OTPCode", otpCodeSchema);

module.exports = OTPCode;
