// nestfind/nestfind/server/src/services/otpService.js

const OTPCode = require("../models/OTPCode");
const emailService = require("./emailService");
const smsService = require("./smsService");
const logger = require("../utils/logger");

// ── OTP EXPIRY SETTINGS ───────────────────────────────────────────────────────
const OTP_EXPIRY = {
  email_verification: 24 * 60, // 24 hours in minutes
  phone_verification: 10,
  password_reset: 60,
  login_2fa: 10,
  account_deletion: 10,
  payment_confirmation: 5,
  kyc_verification: 60,
};

// ── SEND OTP ──────────────────────────────────────────────────────────────────

/**
 * Generate and send OTP to user via email or SMS.
 *
 * @param {Object} params - OTP parameters
 * @returns {Object} - { success, message, expiresInMinutes }
 */
const sendOTP = async ({
  userId,
  purpose,
  email = null,
  phone = null,
  deliveryMethod = "email",
  firstName = "User",
}) => {
  try {
    const sentTo = deliveryMethod === "sms" ? phone : email;

    if (!sentTo) {
      return {
        success: false,
        error: `${deliveryMethod === "sms" ? "Phone number" : "Email"} is required`,
      };
    }

    // Check rate limit
    const canRequest = await OTPCode.canRequestNewOTP(userId, purpose);
    if (!canRequest.canRequest) {
      return {
        success: false,
        error: canRequest.message,
        waitSeconds: canRequest.waitSeconds,
      };
    }

    const expiryMinutes = OTP_EXPIRY[purpose] || 10;

    // Generate and save OTP
    const rawOTP = await OTPCode.createOTP(
      userId,
      purpose,
      sentTo,
      deliveryMethod,
      null,
      expiryMinutes,
    );

    // Send OTP via email or SMS
    let sendResult;
    if (deliveryMethod === "sms" && phone) {
      sendResult = await smsService.sendOTPSMS(phone, rawOTP, purpose);
    } else {
      sendResult = await emailService.sendOTPEmail(
        email,
        firstName,
        rawOTP,
        purpose,
        expiryMinutes,
      );
    }

    if (!sendResult.success) {
      logger.error(`Failed to send OTP: ${sendResult.error}`);
      return {
        success: false,
        error: "Failed to send verification code. Please try again.",
      };
    }

    logger.info(
      `OTP sent: userId=${userId}, purpose=${purpose}, method=${deliveryMethod}`,
    );

    return {
      success: true,
      message: `Verification code sent to ${
        deliveryMethod === "sms" ? `phone ending in ${phone?.slice(-4)}` : email
      }`,
      expiresInMinutes: expiryMinutes,
    };
  } catch (error) {
    logger.error(`OTP send failed: ${error.message}`);
    return {
      success: false,
      error: "Failed to send verification code. Please try again.",
    };
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────────

/**
 * Verify an OTP entered by the user.
 *
 * @param {string} userId - User ID
 * @param {string} purpose - OTP purpose
 * @param {string} enteredOTP - OTP entered by user
 * @returns {Object} - { success, error, remainingAttempts }
 */
const verifyOTP = async (userId, purpose, enteredOTP) => {
  try {
    if (!enteredOTP || enteredOTP.length !== 6) {
      return {
        success: false,
        error: "Please enter a valid 6-digit verification code",
      };
    }

    const result = await OTPCode.verifyOTP(userId, purpose, enteredOTP);

    if (!result.success) {
      logger.warn(
        `OTP verification failed: userId=${userId}, purpose=${purpose}`,
      );
    } else {
      logger.info(`OTP verified: userId=${userId}, purpose=${purpose}`);
    }

    return result;
  } catch (error) {
    logger.error(`OTP verification error: ${error.message}`);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────

/**
 * Resend OTP to user.
 * Generates a fresh OTP (invalidating the previous one).
 *
 * @param {Object} params - Same as sendOTP params
 * @returns {Object} - { success, message }
 */
const resendOTP = async (params) => {
  try {
    const { userId, purpose } = params;

    // Check rate limit
    const canRequest = await OTPCode.canRequestNewOTP(userId, purpose, 1);
    if (!canRequest.canRequest) {
      return {
        success: false,
        error: canRequest.message,
        waitSeconds: canRequest.waitSeconds,
      };
    }

    return await sendOTP(params);
  } catch (error) {
    logger.error(`OTP resend failed: ${error.message}`);
    return {
      success: false,
      error: "Failed to resend verification code. Please try again.",
    };
  }
};

/**
 * Check if a pending OTP exists for a user.
 *
 * @param {string} userId - User ID
 * @param {string} purpose - OTP purpose
 * @returns {Object} - { exists, remainingSeconds }
 */
const checkPendingOTP = async (userId, purpose) => {
  try {
    const otp = await OTPCode.findOne({
      user: userId,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) return { exists: false };

    return {
      exists: true,
      remainingSeconds: otp.getRemainingSeconds(),
      sentTo: otp.sentTo,
      deliveryMethod: otp.deliveryMethod,
    };
  } catch (error) {
    return { exists: false };
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
  checkPendingOTP,
  OTP_EXPIRY,
};
