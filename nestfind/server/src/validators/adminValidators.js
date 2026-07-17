// nestfind/nestfind/server/src/validators/adminValidators.js

const { body, param, query } = require("express-validator");

// ── USER MANAGEMENT VALIDATORS ────────────────────────────────────────────────
const validateUpdateUserStatus = [
  param("id").isMongoId().withMessage("Invalid user ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "suspended", "deactivated"])
    .withMessage("Invalid status"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

const validateUpdateUserRole = [
  param("id").isMongoId().withMessage("Invalid user ID"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["tenant", "landlord", "admin"])
    .withMessage("Invalid role"),
];

// ── PROPERTY MANAGEMENT VALIDATORS ───────────────────────────────────────────
const validateApproveProperty = [
  param("id").isMongoId().withMessage("Invalid property ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["approve", "reject", "feature", "unfeature", "suspend"])
    .withMessage("Invalid action"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),
];

// ── KYC MANAGEMENT VALIDATORS ─────────────────────────────────────────────────
const validateKYCDecision = [
  param("id").isMongoId().withMessage("Invalid KYC verification ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["approve", "reject", "request_resubmission"])
    .withMessage("Invalid KYC action"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),

  body("reasons").optional().isArray().withMessage("Reasons must be an array"),

  body("reasons.*.reason")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Rejection reason text is required"),

  body("reasons.*.field").optional().trim(),

  body("reasons.*.severity")
    .optional()
    .isIn(["minor", "major", "critical"])
    .withMessage("Invalid severity"),
];

// ── REVIEW MANAGEMENT VALIDATORS ──────────────────────────────────────────────
const validateReviewDecision = [
  param("id").isMongoId().withMessage("Invalid review ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["approve", "reject", "flag"])
    .withMessage("Invalid review action"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// ── REPORT MANAGEMENT VALIDATORS ──────────────────────────────────────────────
const validateReportDecision = [
  param("id").isMongoId().withMessage("Invalid report ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["assign", "resolve", "dismiss", "escalate"])
    .withMessage("Invalid action"),

  body("resolutionAction")
    .optional()
    .isIn([
      "no_action",
      "warning_issued",
      "content_removed",
      "user_suspended",
      "user_banned",
      "listing_removed",
      "listing_flagged",
      "other",
    ])
    .withMessage("Invalid resolution action"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
];

// ── BLOG VALIDATORS ───────────────────────────────────────────────────────────
const validateCreateBlogPost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Blog post title is required")
    .isLength({ min: 10, max: 200 })
    .withMessage("Title must be 10-200 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Blog post content is required")
    .isLength({ min: 100 })
    .withMessage("Content must be at least 100 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "rental_tips",
      "landlord_guide",
      "tenant_guide",
      "market_news",
      "legal_advice",
      "neighborhood_guide",
      "home_improvement",
      "ai_features",
      "company_news",
      "other",
    ])
    .withMessage("Invalid category"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Excerpt cannot exceed 500 characters"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("status")
    .optional()
    .isIn(["draft", "published", "scheduled", "archived"])
    .withMessage("Invalid status"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),

  body("seo.metaTitle")
    .optional()
    .trim()
    .isLength({ max: 70 })
    .withMessage("Meta title cannot exceed 70 characters"),

  body("seo.metaDescription")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("Meta description cannot exceed 160 characters"),
];

// ── FAQ VALIDATORS ────────────────────────────────────────────────────────────
const validateCreateFAQ = [
  body("question")
    .trim()
    .notEmpty()
    .withMessage("Question is required")
    .isLength({ min: 10, max: 300 })
    .withMessage("Question must be 10-300 characters"),

  body("answer")
    .trim()
    .notEmpty()
    .withMessage("Answer is required")
    .isLength({ min: 20, max: 3000 })
    .withMessage("Answer must be 20-3000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "general",
      "tenant",
      "landlord",
      "payments",
      "contracts",
      "maintenance",
      "kyc",
      "ai_features",
      "account",
      "legal",
      "other",
    ])
    .withMessage("Invalid category"),

  body("targetRole")
    .optional()
    .isIn(["all", "tenant", "landlord", "admin"])
    .withMessage("Invalid target role"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be 0 or greater"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be true or false"),
];

// ── SYSTEM SETTINGS VALIDATORS ────────────────────────────────────────────────
const validateUpdateSettings = [
  body("section")
    .notEmpty()
    .withMessage("Settings section is required")
    .isIn([
      "platform",
      "maintenance",
      "payments",
      "listings",
      "users",
      "ai",
      "email",
      "sms",
      "notifications",
      "reviews",
      "security",
      "features",
    ])
    .withMessage("Invalid settings section"),

  body("data")
    .notEmpty()
    .withMessage("Settings data is required")
    .isObject()
    .withMessage("Settings data must be an object"),
];

// ── BROADCAST VALIDATORS ──────────────────────────────────────────────────────
const validateBroadcast = [
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Subject must be 5-200 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 20, max: 5000 })
    .withMessage("Message must be 20-5000 characters"),

  body("targetRole")
    .optional()
    .isIn(["all", "tenant", "landlord"])
    .withMessage("Invalid target role"),

  body("channels")
    .optional()
    .isObject()
    .withMessage("Channels must be an object"),

  body("channels.email").optional().isBoolean(),

  body("channels.inApp").optional().isBoolean(),

  body("channels.sms").optional().isBoolean(),
];

// ── PAYMENT VALIDATORS ────────────────────────────────────────────────────────
const validateAdminPaymentAction = [
  param("id").isMongoId().withMessage("Invalid payment ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["refund", "resolve_dispute", "mark_failed"])
    .withMessage("Invalid action"),

  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be positive"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// ── GENERIC VALIDATORS ────────────────────────────────────────────────────────
const validateId = [param("id").isMongoId().withMessage("Invalid ID format")];

const validatePagination = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const validateDateRange = [
  query("startDate").optional().isISO8601().withMessage("Invalid start date"),
  query("endDate").optional().isISO8601().withMessage("Invalid end date"),
];

module.exports = {
  validateUpdateUserStatus,
  validateUpdateUserRole,
  validateApproveProperty,
  validateKYCDecision,
  validateReviewDecision,
  validateReportDecision,
  validateCreateBlogPost,
  validateCreateFAQ,
  validateUpdateSettings,
  validateBroadcast,
  validateAdminPaymentAction,
  validateId,
  validatePagination,
  validateDateRange,
};
