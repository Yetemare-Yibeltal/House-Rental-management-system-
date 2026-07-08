const { body, param, query } = require("express-validator");

// ── ETHIOPIAN CONTEXT VALIDATORS ─────────────────────────────────────────────

/**
 * Valid Ethiopian cities / sub-cities for NestFind
 */
const ETHIOPIAN_CITIES = [
  "Addis Ababa",
  "Dire Dawa",
  "Hawassa",
  "Bahir Dar",
  "Mekelle",
  "Gondar",
  "Adama",
  "Jimma",
  "Dessie",
  "Jijiga",
];

const ADDIS_SUBCITIES = [
  "Bole",
  "Yeka",
  "Kirkos",
  "Arada",
  "Addis Ketema",
  "Gulele",
  "Kolfe Keranio",
  "Lideta",
  "Nifas Silk-Lafto",
  "Akaky Kaliti",
  "Lemi Kura",
  "Sheger",
  "CMC",
  "Kazanchis",
  "Megenagna",
  "Sarbet",
  "Piassa",
  "Mexico",
  "Stadium",
  "Gerji",
  "Ayat",
  "Summit",
  "Lafto",
];

const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "house",
  "studio",
  "commercial",
  "duplex",
  "penthouse",
  "other",
];

const FURNISHING_TYPES = ["fully_furnished", "semi_furnished", "unfurnished"];

const PAYMENT_METHODS = [
  "cbe_transfer",
  "telebirr",
  "visa_debit",
  "mastercard",
  "cash",
  "other",
];

const USER_ROLES = ["tenant", "landlord", "admin"];

const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"];

const BOOKING_STATUSES = [
  "pending",
  "approved",
  "declined",
  "cancelled",
  "completed",
];

const CONTRACT_STATUSES = [
  "draft",
  "pending_signature",
  "active",
  "expired",
  "terminated",
];

const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
];

const NOTIFICATION_TYPES = [
  "booking_request",
  "booking_approved",
  "booking_declined",
  "payment_received",
  "payment_due",
  "payment_overdue",
  "contract_signed",
  "contract_expiring",
  "maintenance_update",
  "new_message",
  "kyc_approved",
  "kyc_rejected",
  "review_posted",
  "system_announcement",
];

// ── PRIMITIVE VALIDATORS ──────────────────────────────────────────────────────

/**
 * Validate Ethiopian phone number
 * Accepts: +251911234567, 0911234567, 251911234567
 */
const isEthiopianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const patterns = [
    /^\+251[79]\d{8}$/, // +251911234567
    /^0[79]\d{8}$/, // 0911234567
    /^251[79]\d{8}$/, // 251911234567
  ];
  return patterns.some((pattern) => pattern.test(cleaned));
};

/**
 * Normalize Ethiopian phone to +251 format
 */
const normalizeEthiopianPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+251")) return cleaned;
  if (cleaned.startsWith("251")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+251${cleaned.slice(1)}`;
  return cleaned;
};

/**
 * Validate ETB amount — must be positive number with max 2 decimal places
 */
const isValidETBAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) return false;
  return true;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate coordinates (latitude, longitude)
 */
const isValidCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Validate date range — start must be before end, start must be future
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (start >= end) return false;
  if (start <= now) return false;
  return true;
};

/**
 * Validate file type from mimetype string
 */
const isValidImageType = (mimetype) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return allowed.includes(mimetype);
};

const isValidDocumentType = (mimetype) => {
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  return allowed.includes(mimetype);
};

/**
 * Validate password strength
 * Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 */
const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpper && hasLower && hasNumber;
};

/**
 * Validate URL format
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize string — trim and remove excess whitespace
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.trim().replace(/\s+/g, " ");
};

/**
 * Capitalize first letter of each word
 */
const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Generate slug from string
 */
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// ── EXPRESS-VALIDATOR CHAIN HELPERS ──────────────────────────────────────────
// Reusable validator chains used inside validator files

const validateObjectId = (field, location = "param") => {
  const validator = location === "param" ? param(field) : body(field);
  return validator
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error(`${field} must be a valid ID`);
      }
      return true;
    });
};

const validateRequiredString = (field, min = 1, max = 500) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);
};

const validateOptionalString = (field, min = 1, max = 500) => {
  return body(field)
    .optional()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);
};

const validateEmail = (field = "email") => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail();
};

const validatePassword = (field = "password") => {
  return body(field)
    .notEmpty()
    .withMessage("Password is required")
    .custom((value) => {
      if (!isStrongPassword(value)) {
        throw new Error(
          "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number",
        );
      }
      return true;
    });
};

const validatePhone = (field = "phone") => {
  return body(field)
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isEthiopianPhone(value)) {
        throw new Error(
          "Please provide a valid Ethiopian phone number (e.g. +251911234567)",
        );
      }
      return true;
    });
};

const validateETBAmount = (field) => {
  return body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .custom((value) => {
      if (!isValidETBAmount(value)) {
        throw new Error(`${field} must be a valid positive amount in ETB`);
      }
      return true;
    })
    .toFloat();
};

const validateEnum = (field, enumValues, required = true) => {
  const validator = body(field);
  if (required) {
    validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator.optional();
  }
  return validator
    .isIn(enumValues)
    .withMessage(`${field} must be one of: ${enumValues.join(", ")}`);
};

const validatePagination = () => [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

// ── EXPORTS ───────────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  ETHIOPIAN_CITIES,
  ADDIS_SUBCITIES,
  PROPERTY_TYPES,
  FURNISHING_TYPES,
  PAYMENT_METHODS,
  USER_ROLES,
  MAINTENANCE_PRIORITIES,
  BOOKING_STATUSES,
  CONTRACT_STATUSES,
  PAYMENT_STATUSES,
  NOTIFICATION_TYPES,

  // Primitive validators
  isEthiopianPhone,
  normalizeEthiopianPhone,
  isValidETBAmount,
  isValidObjectId,
  isValidCoordinates,
  isValidDateRange,
  isValidImageType,
  isValidDocumentType,
  isStrongPassword,
  isValidURL,

  // String helpers
  sanitizeString,
  toTitleCase,
  generateSlug,

  // Express-validator chain helpers
  validateObjectId,
  validateRequiredString,
  validateOptionalString,
  validateEmail,
  validatePassword,
  validatePhone,
  validateETBAmount,
  validateEnum,
  validatePagination,
};
