// nestfind/nestfind/server/src/utils/tokenRotation.js

const RefreshToken = require("../models/RefreshToken");
const logger = require("./logger");

/**
 * Clean up expired and revoked tokens from database.
 * Should be run periodically (e.g. daily cron job).
 *
 * @returns {Object} - { deleted, errors }
 */
const cleanupExpiredTokens = async () => {
  try {
    const deleted = await RefreshToken.deleteExpiredTokens();
    logger.info(`Token cleanup: ${deleted} expired tokens deleted`);
    return { success: true, deleted };
  } catch (error) {
    logger.error(`Token cleanup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Detect suspicious token usage patterns.
 * Flags if same token is used from different IPs.
 *
 * @param {string} userId - User ID
 * @param {string} currentIP - Current request IP
 * @returns {Object} - { suspicious, reason }
 */
const detectSuspiciousUsage = async (userId, currentIP) => {
  try {
    const recentTokens = await RefreshToken.find({
      user: userId,
      isRevoked: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).lean();

    const ips = [
      ...new Set(recentTokens.map((t) => t.ipAddress).filter(Boolean)),
    ];

    if (ips.length > 3) {
      return {
        suspicious: true,
        reason: `Token used from ${ips.length} different IP addresses in 24 hours`,
        ips,
      };
    }

    return { suspicious: false };
  } catch (error) {
    logger.error(`Suspicious usage detection failed: ${error.message}`);
    return { suspicious: false };
  }
};

/**
 * Revoke all tokens for a user due to security concern.
 *
 * @param {string} userId - User ID
 * @param {string} reason - Revocation reason
 * @returns {Object} - Revocation result
 */
const emergencyRevokeAll = async (userId, reason = "security_concern") => {
  try {
    const result = await RefreshToken.revokeAllUserTokens(userId, reason);
    logger.warn(
      `Emergency token revocation: userId=${userId}, reason=${reason}`,
    );
    return { success: true, revoked: result.modifiedCount };
  } catch (error) {
    logger.error(`Emergency revocation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get token usage statistics for security monitoring.
 *
 * @returns {Object} - Token statistics
 */
const getTokenStats = async () => {
  try {
    const now = new Date();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [active, revoked, expired, recentlyCreated] = await Promise.all([
      RefreshToken.countDocuments({
        isRevoked: false,
        expiresAt: { $gt: now },
      }),
      RefreshToken.countDocuments({ isRevoked: true }),
      RefreshToken.countDocuments({ expiresAt: { $lte: now } }),
      RefreshToken.countDocuments({ createdAt: { $gte: dayAgo } }),
    ]);

    return {
      success: true,
      stats: { active, revoked, expired, recentlyCreated },
    };
  } catch (error) {
    logger.error(`Token stats failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  cleanupExpiredTokens,
  detectSuspiciousUsage,
  emergencyRevokeAll,
  getTokenStats,
};
