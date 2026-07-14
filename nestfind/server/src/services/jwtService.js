// nestfind/nestfind/server/src/services/jwtService.js

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const logger = require("../utils/logger");

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRE || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRE || "7d";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ── TOKEN GENERATION ──────────────────────────────────────────────────────────

/**
 * Generate JWT access token for a user.
 * Short-lived token used to authenticate API requests.
 *
 * @param {Object} user - User document
 * @returns {string} - Signed JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isKYCVerified: user.isKYCVerified,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: "nestfind",
    audience: "nestfind-client",
  });
};

/**
 * Generate refresh token — long-lived, stored in database.
 * Used to issue new access tokens without re-login.
 *
 * @returns {string} - Random refresh token string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Generate both access and refresh tokens for a user.
 * Called on login and registration.
 *
 * @param {Object} user - User document
 * @param {Object} deviceInfo - Device information from request
 * @param {string} ipAddress - Client IP address
 * @returns {Object} - { accessToken, refreshToken, expiresAt }
 */
const generateTokenPair = async (user, deviceInfo = {}, ipAddress = null) => {
  try {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Save refresh token to database
    await RefreshToken.createToken(
      user._id,
      refreshToken,
      expiresAt,
      deviceInfo,
      ipAddress,
    );

    logger.info(`Token pair generated for user ${user._id}`);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresAt: expiresAt,
    };
  } catch (error) {
    logger.error(`Failed to generate token pair: ${error.message}`);
    throw error;
  }
};

// ── TOKEN VERIFICATION ────────────────────────────────────────────────────────

/**
 * Verify and decode a JWT access token.
 *
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "nestfind",
      audience: "nestfind-client",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Access token expired");
    } else {
      logger.warn(`Invalid access token: ${error.message}`);
    }
    return null;
  }
};

/**
 * Verify a refresh token against the database.
 *
 * @param {string} refreshToken - Refresh token string
 * @returns {Object} - { valid, user, tokenRecord }
 */
const verifyRefreshToken = async (refreshToken) => {
  try {
    const tokenRecord = await RefreshToken.findValidToken(refreshToken);

    if (!tokenRecord) {
      return { valid: false, error: "Invalid or expired refresh token" };
    }

    if (!tokenRecord.user) {
      return { valid: false, error: "User not found for this token" };
    }

    if (tokenRecord.user.status !== "active") {
      return { valid: false, error: "Account is not active" };
    }

    return {
      valid: true,
      user: tokenRecord.user,
      tokenRecord,
    };
  } catch (error) {
    logger.error(`Refresh token verification failed: ${error.message}`);
    return { valid: false, error: "Token verification failed" };
  }
};

// ── TOKEN ROTATION ────────────────────────────────────────────────────────────

/**
 * Rotate refresh token — invalidate old and issue new.
 * Implements refresh token rotation for security.
 *
 * @param {string} oldRefreshToken - Current refresh token
 * @param {Object} user - User document
 * @param {Object} deviceInfo - Device info from request
 * @param {string} ipAddress - Client IP
 * @returns {Object} - New token pair
 */
const rotateRefreshToken = async (
  oldRefreshToken,
  user,
  deviceInfo = {},
  ipAddress = null,
) => {
  try {
    const newRefreshToken = generateRefreshToken();
    const newAccessToken = generateAccessToken(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Rotate in database
    const newRecord = await RefreshToken.rotateToken(
      oldRefreshToken,
      newRefreshToken,
      expiresAt,
      deviceInfo,
      ipAddress,
    );

    if (!newRecord) {
      throw new Error("Failed to rotate refresh token");
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresAt: expiresAt,
    };
  } catch (error) {
    logger.error(`Token rotation failed: ${error.message}`);
    throw error;
  }
};

// ── TOKEN REVOCATION ──────────────────────────────────────────────────────────

/**
 * Revoke a single refresh token (logout from one device).
 *
 * @param {string} refreshToken - Token to revoke
 * @param {string} reason - Revocation reason
 */
const revokeToken = async (refreshToken, reason = "logout") => {
  try {
    await RefreshToken.revokeToken(refreshToken, reason);
    logger.info(`Refresh token revoked: reason=${reason}`);
  } catch (error) {
    logger.error(`Failed to revoke token: ${error.message}`);
  }
};

/**
 * Revoke all refresh tokens for a user (logout from all devices).
 *
 * @param {string} userId - User ID
 * @param {string} reason - Revocation reason
 */
const revokeAllUserTokens = async (userId, reason = "logout") => {
  try {
    const result = await RefreshToken.revokeAllUserTokens(userId, reason);
    logger.info(
      `All tokens revoked for user ${userId}: reason=${reason}, count=${result.modifiedCount}`,
    );
  } catch (error) {
    logger.error(`Failed to revoke all user tokens: ${error.message}`);
  }
};

// ── DEVICE INFO EXTRACTOR ─────────────────────────────────────────────────────

/**
 * Extract device information from Express request.
 *
 * @param {Object} req - Express request object
 * @returns {Object} - Device information
 */
const extractDeviceInfo = (req) => {
  const userAgent = req.get("User-Agent") || "";
  const platform = detectPlatform(userAgent);
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);

  return {
    userAgent,
    platform,
    browser,
    os,
  };
};

const detectPlatform = (userAgent) => {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet/i.test(userAgent)) return "mobile";
  if (/Electron/i.test(userAgent)) return "desktop";
  if (userAgent) return "web";
  return "unknown";
};

const detectBrowser = (userAgent) => {
  if (/Chrome/i.test(userAgent)) return "Chrome";
  if (/Firefox/i.test(userAgent)) return "Firefox";
  if (/Safari/i.test(userAgent)) return "Safari";
  if (/Edge/i.test(userAgent)) return "Edge";
  if (/Opera/i.test(userAgent)) return "Opera";
  return "Unknown";
};

const detectOS = (userAgent) => {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iOS|iPhone|iPad/i.test(userAgent)) return "iOS";
  return "Unknown";
};

// ── SESSION MANAGEMENT ────────────────────────────────────────────────────────

/**
 * Get all active sessions for a user.
 *
 * @param {string} userId - User ID
 * @returns {Array} - Active session list
 */
const getActiveSessions = async (userId) => {
  try {
    return await RefreshToken.getActiveSessions(userId);
  } catch (error) {
    logger.error(`Failed to get active sessions: ${error.message}`);
    return [];
  }
};

/**
 * Count active sessions for a user.
 *
 * @param {string} userId - User ID
 * @returns {number} - Session count
 */
const countActiveSessions = async (userId) => {
  try {
    return await RefreshToken.countActiveSessions(userId);
  } catch (error) {
    return 0;
  }
};

/**
 * Generate email verification token.
 *
 * @returns {string} - Random token
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate password reset token.
 *
 * @returns {string} - Random token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token for secure storage.
 *
 * @param {string} token - Plain token
 * @returns {string} - SHA256 hash
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeToken,
  revokeAllUserTokens,
  extractDeviceInfo,
  getActiveSessions,
  countActiveSessions,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
