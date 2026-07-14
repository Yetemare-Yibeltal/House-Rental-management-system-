// nestfind/nestfind/server/src/services/smsService.js

const logger = require("../utils/logger");

// ── SMS SERVICE ───────────────────────────────────────────────────────────────
// Twilio integration for SMS delivery
// Falls back to console logging in development

let twilioClient = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID !== "placeholder"
  ) {
    try {
      const twilio = require("twilio");
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    } catch (error) {
      logger.warn("Twilio not installed. SMS will be logged only.");
    }
  }

  return twilioClient;
};

/**
 * Send an SMS message.
 *
 * @param {string} to - Phone number (Ethiopian format: +251XXXXXXXXX)
 * @param {string} message - SMS message text
 * @returns {Object} - { success, messageId }
 */
const sendSMS = async (to, message) => {
  try {
    // Format Ethiopian phone number
    const formattedPhone = formatEthiopianPhone(to);

    if (!formattedPhone) {
      return { success: false, error: "Invalid phone number format" };
    }

    const client = getTwilioClient();

    // In development or without Twilio, just log
    if (!client) {
      logger.info(`[SMS LOG] To: ${formattedPhone} | Message: ${message}`);
      return { success: true, messageId: "dev-log", isDev: true };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formattedPhone,
    });

    logger.info(`SMS sent: to=${formattedPhone}, sid=${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    logger.error(`SMS send failed: to=${to}, error=${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Format Ethiopian phone number to E.164 format.
 *
 * @param {string} phone - Phone number in any Ethiopian format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
const formatEthiopianPhone = (phone) => {
  if (!phone) return null;

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Already in E.164 format
  if (/^\+251[79]\d{8}$/.test(cleaned)) return cleaned;

  // Starts with 0 (local format)
  if (/^0[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }

  // Starts with 251 (without +)
  if (/^251[79]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
};

/**
 * Send OTP via SMS.
 *
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP
 * @returns {Object} - Send result
 */
const sendOTPSMS = async (phone, otp, purpose) => {
  const purposeMessages = {
    email_verification: "email verification",
    phone_verification: "phone verification",
    password_reset: "password reset",
    login_2fa: "login verification",
    payment_confirmation: "payment confirmation",
  };

  const purposeLabel = purposeMessages[purpose] || "verification";

  const message = `NestFind: Your ${purposeLabel} code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

  return sendSMS(phone, message);
};

/**
 * Send payment notification via SMS.
 *
 * @param {string} phone - Phone number
 * @param {Object} paymentDetails - Payment information
 * @returns {Object} - Send result
 */
const sendPaymentNotificationSMS = async (phone, paymentDetails) => {
  const message = `NestFind: Payment of ETB ${paymentDetails.amount?.toLocaleString()} received. Receipt: ${paymentDetails.receiptNumber}. Thank you!`;
  return sendSMS(phone, message);
};

/**
 * Send booking notification via SMS.
 *
 * @param {string} phone - Phone number
 * @param {Object} bookingDetails - Booking information
 * @returns {Object} - Send result
 */
const sendBookingNotificationSMS = async (phone, bookingDetails) => {
  const message = `NestFind: Your visit for ${bookingDetails.propertyTitle} is ${bookingDetails.status} for ${bookingDetails.confirmedDate} at ${bookingDetails.confirmedTime}.`;
  return sendSMS(phone, message);
};

/**
 * Send maintenance update via SMS.
 *
 * @param {string} phone - Phone number
 * @param {Object} maintenanceDetails - Maintenance request information
 * @returns {Object} - Send result
 */
const sendMaintenanceUpdateSMS = async (phone, maintenanceDetails) => {
  const message = `NestFind: Your maintenance request "${maintenanceDetails.title}" status updated to: ${maintenanceDetails.status}.`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendPaymentNotificationSMS,
  sendBookingNotificationSMS,
  sendMaintenanceUpdateSMS,
  formatEthiopianPhone,
};
