const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // ── TOKEN DATA ────────────────────────────────────────────────────────────
    // Stored as hashed value — never store raw tokens in DB
    token: {
      type: String,
      required: [true, "Token is required"],
      unique: true,
    },
    // The hashed version used for DB lookup
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    // ── EXPIRY ────────────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    // MongoDB TTL index — auto-deletes expired tokens
    // No manual cleanup needed

    // ── DEVICE / SESSION INFO ─────────────────────────────────────────────────
    deviceInfo: {
      userAgent: { type: String, trim: true },
      platform: {
        type: String,
        enum: ["web", "ios", "android", "desktop", "unknown"],
        default: "unknown",
      },
      browser: { type: String, trim: true },
      os: { type: String, trim: true },
    },
    ipAddress: {
      type: String,
      trim: true,
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      enum: [
        "logout",
        "password_change",
        "account_suspended",
        "token_rotation",
        "admin_revoke",
        "suspicious_activity",
      ],
      default: null,
    },
    // Tracks token rotation — replaces old token with new one
    replacedByToken: {
      type: String,
      default: null,
    },
    // How many times this token has been used to get a new access token
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
// TTL index — MongoDB auto-deletes expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ isRevoked: 1 });
refreshTokenSchema.index({ createdAt: -1 });

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Create a new refresh token record
refreshTokenSchema.statics.createToken = async function (
  userId,
  token,
  expiresAt,
  deviceInfo = {},
  ipAddress = null,
) {
  // Hash the token for secure storage
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return await this.create({
    user: userId,
    token,
    tokenHash,
    expiresAt,
    deviceInfo,
    ipAddress,
  });
};

// Find a valid (not revoked, not expired) token
refreshTokenSchema.statics.findValidToken = async function (token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate("user");
};

// Revoke a single token
refreshTokenSchema.statics.revokeToken = async function (
  token,
  reason = "logout",
) {
  return await this.findOneAndUpdate(
    { token },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
    { new: true },
  );
};

// Revoke all tokens for a user (logout from all devices)
refreshTokenSchema.statics.revokeAllUserTokens = async function (
  userId,
  reason = "logout",
) {
  return await this.updateMany(
    {
      user: userId,
      isRevoked: false,
    },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  );
};

// Rotate token — revoke old, return new token placeholder
refreshTokenSchema.statics.rotateToken = async function (
  oldToken,
  newToken,
  expiresAt,
  deviceInfo = {},
  ipAddress = null,
) {
  // Hash new token for storage
  const newTokenHash = crypto
    .createHash("sha256")
    .update(newToken)
    .digest("hex");

  // Find and revoke the old token
  const oldRecord = await this.findOneAndUpdate(
    { token: oldToken, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: "token_rotation",
      replacedByToken: newTokenHash,
    },
    { new: true },
  );

  if (!oldRecord) return null;

  // Create new token record
  const newRecord = await this.create({
    user: oldRecord.user,
    token: newToken,
    tokenHash: newTokenHash,
    expiresAt,
    deviceInfo,
    ipAddress,
  });

  return newRecord;
};

// Get all active sessions for a user
refreshTokenSchema.statics.getActiveSessions = async function (userId) {
  return await this.find({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select("deviceInfo ipAddress createdAt lastUsedAt usageCount");
};

// Delete all expired tokens (manual cleanup if TTL index not set)
refreshTokenSchema.statics.deleteExpiredTokens = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

// Count active sessions for a user
refreshTokenSchema.statics.countActiveSessions = async function (userId) {
  return await this.countDocuments({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Check if token is valid (not revoked, not expired)
refreshTokenSchema.methods.isValid = function () {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Mark token as used (increment usage count)
refreshTokenSchema.methods.markAsUsed = async function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
