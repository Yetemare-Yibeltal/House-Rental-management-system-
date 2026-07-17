// nestfind/nestfind/server/src/validators/landlordValidators.js

const { body, param, query } = require("express-validator");

// ── BOOKING RESPONSE VALIDATORS ───────────────────────────────────────────────
const validateApproveBooking = [
  param("id").isMongoId().withMessage("Invalid booking ID"),

  body("confirmedDate")
    .notEmpty()
    .withMessage("Confirmed visit date is required")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Confirmed date must be in the future");
      }
      return true;
    }),

  body("confirmedTime")
    .notEmpty()
    .withMessage("Confirmed visit time is required")
    .trim()
    .isLength({ min: 3, max: 20 }),

  body("landlordResponse")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Response cannot exceed 1000 characters"),
];

const validateDeclineBooking = [
  param("id").isMongoId().withMessage("Invalid booking ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// ── RENTAL VALIDATORS ─────────────────────────────────────────────────────────
const validateCreateRental = [
  body("tenantId")
    .notEmpty()
    .withMessage("Tenant ID is required")
    .isMongoId()
    .withMessage("Invalid tenant ID"),

  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("startDate")
    .notEmpty()
    .withMessage("Rental start date is required")
    .isISO8601()
    .withMessage("Please provide a valid start date"),

  body("endDate")
    .notEmpty()
    .withMessage("Rental end date is required")
    .isISO8601()
    .withMessage("Please provide a valid end date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("monthlyRent")
    .notEmpty()
    .withMessage("Monthly rent is required")
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),

  body("securityDeposit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be a positive number"),

  body("paymentDueDay")
    .optional()
    .isInt({ min: 1, max: 28 })
    .withMessage("Payment due day must be between 1 and 28"),
];

const validateUpdateRental = [
  param("id").isMongoId().withMessage("Invalid rental ID"),

  body("monthlyRent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),

  body("landlordNotes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes cannot exceed 2000 characters"),
];

// ── CONTRACT VALIDATORS ───────────────────────────────────────────────────────
const validateCreateContract = [
  body("tenantId")
    .notEmpty()
    .withMessage("Tenant ID is required")
    .isMongoId()
    .withMessage("Invalid tenant ID"),

  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("terms.startDate")
    .notEmpty()
    .withMessage("Lease start date is required")
    .isISO8601()
    .withMessage("Please provide a valid start date"),

  body("terms.endDate")
    .notEmpty()
    .withMessage("Lease end date is required")
    .isISO8601()
    .withMessage("Please provide a valid end date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.terms?.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("terms.monthlyRent")
    .notEmpty()
    .withMessage("Monthly rent is required")
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be positive"),

  body("terms.securityDeposit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be positive"),

  body("terms.paymentDueDay")
    .optional()
    .isInt({ min: 1, max: 28 })
    .withMessage("Payment due day must be between 1 and 28"),

  body("terms.noticePeriodDays")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Notice period must be 0 or greater"),

  body("terms.petPolicy")
    .optional()
    .isIn(["allowed", "not_allowed", "negotiable"])
    .withMessage("Invalid pet policy"),

  body("terms.smokingPolicy")
    .optional()
    .isIn(["allowed", "not_allowed", "outside_only"])
    .withMessage("Invalid smoking policy"),

  body("terms.earlyTerminationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Early termination fee must be positive"),
];

const validateSignContract = [
  param("id").isMongoId().withMessage("Invalid contract ID"),

  body("signatureData").notEmpty().withMessage("Signature is required"),
];

// ── MAINTENANCE RESPONSE VALIDATORS ───────────────────────────────────────────
const validateMaintenanceResponse = [
  param("id").isMongoId().withMessage("Invalid maintenance request ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["acknowledge", "start", "complete", "reject"])
    .withMessage("Invalid maintenance action"),

  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),

  body("estimatedCompletionDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),

  body("repairCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Repair cost must be a positive number"),
];

// ── LANDLORD PROFILE VALIDATORS ───────────────────────────────────────────────
const validateLandlordProfile = [
  body("landlordProfile.businessName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business name cannot exceed 100 characters"),

  body("landlordProfile.bankAccountName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Bank account name is too long"),

  body("landlordProfile.bankAccountNumber")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Bank account number is too long"),

  body("landlordProfile.bankName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Bank name is too long"),

  body("landlordProfile.telebirrNumber")
    .optional()
    .trim()
    .matches(/^(\+251|0)[79]\d{8}$/)
    .withMessage("Invalid Telebirr number"),
];

// ── REVIEW RESPONSE VALIDATOR ─────────────────────────────────────────────────
const validateReviewResponse = [
  param("id").isMongoId().withMessage("Invalid review ID"),

  body("response")
    .trim()
    .notEmpty()
    .withMessage("Response is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Response must be 10-1000 characters"),
];

// ── TENANT REVIEW VALIDATOR ───────────────────────────────────────────────────
const validateLandlordReviewTenant = [
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
];

// ── GENERIC VALIDATORS ────────────────────────────────────────────────────────
const validateId = [param("id").isMongoId().withMessage("Invalid ID format")];

const validatePagination = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];

module.exports = {
  validateApproveBooking,
  validateDeclineBooking,
  validateCreateRental,
  validateUpdateRental,
  validateCreateContract,
  validateSignContract,
  validateMaintenanceResponse,
  validateLandlordProfile,
  validateReviewResponse,
  validateLandlordReviewTenant,
  validateId,
  validatePagination,
};
