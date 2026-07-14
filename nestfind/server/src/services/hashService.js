// nestfind/nestfind/server/src/services/hashService.js

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const logger = require("../utils/logger");

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 *
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error(`Password hashing failed: ${error.message}`);
    throw new Error("Failed to hash password");
  }
};

/**
 * Compare plain password with hashed password.
 *
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Stored hashed password
 * @returns {boolean} - true if match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error(`Password comparison failed: ${error.message}`);
    return false;
  }
};

/**
 * Generate a secure random token.
 *
 * @param {number} bytes - Number of random bytes (default 32)
 * @returns {string} - Hex string token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

/**
 * Hash a token using SHA256 for secure storage.
 *
 * @param {string} token - Plain token
 * @returns {string} - SHA256 hash
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Verify a token against its hash.
 *
 * @param {string} plainToken - Plain token from user
 * @param {string} hashedToken - Stored hashed token
 * @returns {boolean} - true if match
 */
const verifyToken = (plainToken, hashedToken) => {
  const hash = hashToken(plainToken);
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(hashedToken, "hex"),
  );
};

/**
 * Generate a 6-digit OTP code.
 *
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP for secure storage.
 *
 * @param {string} otp - Plain OTP
 * @returns {string} - SHA256 hash
 */
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Generate a unique ID with prefix.
 *
 * @param {string} prefix - ID prefix (e.g. 'TXN', 'RCP')
 * @returns {string} - Unique ID
 */
const generateUniqueId = (prefix = "") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Generate a referral code.
 *
 * @returns {string} - Unique referral code
 */
const generateReferralCode = () => {
  return `NF${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

/**
 * Validate password strength.
 *
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid, errors }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength:
      errors.length === 0 ? "strong" : errors.length <= 2 ? "medium" : "weak",
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  hashToken,
  verifyToken,
  generateOTP,
  hashOTP,
  generateUniqueId,
  generateReferralCode,
  validatePasswordStrength,
  SALT_ROUNDS,
};
