// nestfind/nestfind/server/src/validators/tenantValidators.js

const { body, param, query } = require("express-validator");

// ── BOOKING VALIDATORS ────────────────────────────────────────────────────────
const validateCreateBooking = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("preferredDate")
    .notEmpty()
    .withMessage("Preferred visit date is required")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Visit date must be in the future");
      }
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (date > maxDate) {
        throw new Error(
          "Visit date cannot be more than 3 months in the future",
        );
      }
      return true;
    }),

  body("preferredTime")
    .notEmpty()
    .withMessage("Preferred visit time is required")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Please provide a valid time"),

  body("alternativeDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid alternative date"),

  body("alternativeTime").optional().trim().isLength({ max: 20 }),

  body("tenantMessage")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),
];

const validateUpdateBooking = [
  param("id").isMongoId().withMessage("Invalid booking ID"),

  body("status")
    .optional()
    .isIn(["cancelled"])
    .withMessage("Tenants can only cancel bookings"),

  body("cancellationReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason cannot exceed 500 characters"),
];

// ── PAYMENT VALIDATORS ────────────────────────────────────────────────────────
const validateCreatePayment = [
  body("rentalId")
    .notEmpty()
    .withMessage("Rental ID is required")
    .isMongoId()
    .withMessage("Invalid rental ID"),

  body("paymentType")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn([
      "monthly_rent",
      "security_deposit",
      "late_payment_fee",
      "maintenance_fee",
      "other",
    ])
    .withMessage("Invalid payment type"),

  body("amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 1 })
    .withMessage("Payment amount must be greater than 0"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn([
      "cbe_transfer",
      "telebirr",
      "visa_debit",
      "mastercard",
      "cash",
      "bank_transfer",
      "other",
    ])
    .withMessage("Invalid payment method"),

  body("paymentPeriod.month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),

  body("paymentPeriod.year")
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Invalid year"),

  body("externalTransactionId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Transaction ID is too long"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

// ── MAINTENANCE VALIDATORS ────────────────────────────────────────────────────
const validateCreateMaintenance = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Issue title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be 5-150 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Issue description is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be 20-2000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Issue category is required")
    .isIn([
      "plumbing",
      "electrical",
      "hvac",
      "structural",
      "appliance",
      "pest_control",
      "cleaning",
      "security",
      "internet",
      "painting",
      "flooring",
      "roofing",
      "window_door",
      "other",
    ])
    .withMessage("Invalid maintenance category"),

  body("urgency")
    .optional()
    .isIn(["low", "medium", "high", "emergency"])
    .withMessage("Invalid urgency level"),
];

const validateUpdateMaintenance = [
  param("id").isMongoId().withMessage("Invalid maintenance request ID"),

  body("status")
    .optional()
    .isIn(["cancelled"])
    .withMessage("Tenants can only cancel maintenance requests"),

  body("tenantSatisfactionRating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("tenantSatisfactionComment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),
];

// ── SAVED PROPERTY VALIDATORS ─────────────────────────────────────────────────
const validateSaveProperty = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("collection")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Collection name cannot exceed 50 characters"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note cannot exceed 500 characters"),

  body("notifyOnPriceDrop")
    .optional()
    .isBoolean()
    .withMessage("notifyOnPriceDrop must be true or false"),
];

// ── SAVED SEARCH VALIDATORS ───────────────────────────────────────────────────
const validateSaveSearch = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search name cannot exceed 100 characters"),

  body("alertEnabled")
    .optional()
    .isBoolean()
    .withMessage("alertEnabled must be true or false"),

  body("alertFrequency")
    .optional()
    .isIn(["instant", "daily", "weekly"])
    .withMessage("Invalid alert frequency"),
];

// ── REVIEW VALIDATORS ─────────────────────────────────────────────────────────
const validateTenantReview = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Comment must be 20-2000 characters"),

  body("reviewType")
    .notEmpty()
    .withMessage("Review type is required")
    .isIn(["tenant_reviews_property", "tenant_reviews_landlord"])
    .withMessage("Invalid review type for tenant"),

  body("subRatings.cleanliness").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.accuracy").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.communication").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.location").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.value").optional().isInt({ min: 1, max: 5 }),
];

// ── MESSAGE VALIDATORS ────────────────────────────────────────────────────────
const validateSendMessage = [
  body("receiverId")
    .notEmpty()
    .withMessage("Receiver ID is required")
    .isMongoId()
    .withMessage("Invalid receiver ID"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Message cannot exceed 5000 characters"),

  body("messageType")
    .optional()
    .isIn(["text", "image", "document", "property_share"])
    .withMessage("Invalid message type"),

  body("propertyId").optional().isMongoId().withMessage("Invalid property ID"),
];

// ── PROFILE VALIDATORS ────────────────────────────────────────────────────────
const validateTenantProfile = [
  body("tenantProfile.employmentStatus")
    .optional()
    .isIn(["employed", "self_employed", "student", "unemployed", "other"])
    .withMessage("Invalid employment status"),

  body("tenantProfile.monthlyIncome")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly income must be a positive number"),

  body("tenantProfile.emergencyContact.name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Emergency contact name is too long"),

  body("tenantProfile.emergencyContact.phone")
    .optional()
    .matches(/^(\+251|0)[79]\d{8}$/)
    .withMessage("Invalid Ethiopian phone number"),

  body("tenantProfile.emergencyContact.relationship")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Relationship is too long"),
];

// ── GENERIC ID VALIDATORS ─────────────────────────────────────────────────────
const validateId = [param("id").isMongoId().withMessage("Invalid ID format")];

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be 1-50"),
];

module.exports = {
  validateCreateBooking,
  validateUpdateBooking,
  validateCreatePayment,
  validateCreateMaintenance,
  validateUpdateMaintenance,
  validateSaveProperty,
  validateSaveSearch,
  validateTenantReview,
  validateSendMessage,
  validateTenantProfile,
  validateId,
  validatePagination,
};
