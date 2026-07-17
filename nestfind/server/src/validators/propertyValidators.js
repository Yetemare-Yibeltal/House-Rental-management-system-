// nestfind/nestfind/server/src/validators/propertyValidators.js

const { body, param, query } = require("express-validator");

// ── CREATE / UPDATE PROPERTY VALIDATOR ───────────────────────────────────────
const validateCreateProperty = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Property title is required")
    .isLength({ min: 10, max: 150 })
    .withMessage("Title must be 10-150 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Property description is required")
    .isLength({ min: 50, max: 5000 })
    .withMessage("Description must be 50-5000 characters"),

  body("propertyType")
    .notEmpty()
    .withMessage("Property type is required")
    .isIn([
      "apartment",
      "villa",
      "house",
      "studio",
      "commercial",
      "duplex",
      "penthouse",
      "other",
    ])
    .withMessage("Invalid property type"),

  body("location.address")
    .trim()
    .notEmpty()
    .withMessage("Property address is required")
    .isLength({ max: 300 })
    .withMessage("Address is too long"),

  body("location.subCity")
    .trim()
    .notEmpty()
    .withMessage("Sub-city is required")
    .isLength({ max: 100 })
    .withMessage("Sub-city name is too long"),

  body("location.city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City name is too long"),

  body("location.coordinates.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be [longitude, latitude]"),

  body("details.bedrooms")
    .notEmpty()
    .withMessage("Number of bedrooms is required")
    .isInt({ min: 0, max: 20 })
    .withMessage("Bedrooms must be between 0 and 20"),

  body("details.bathrooms")
    .notEmpty()
    .withMessage("Number of bathrooms is required")
    .isInt({ min: 1, max: 20 })
    .withMessage("Bathrooms must be between 1 and 20"),

  body("details.area")
    .notEmpty()
    .withMessage("Property area is required")
    .isFloat({ min: 10 })
    .withMessage("Area must be at least 10 square meters"),

  body("details.furnished")
    .notEmpty()
    .withMessage("Furnishing status is required")
    .isIn(["fully_furnished", "semi_furnished", "unfurnished"])
    .withMessage("Invalid furnishing status"),

  body("details.floorNumber")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Floor number must be 0 or greater"),

  body("details.totalFloors")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total floors must be at least 1"),

  body("details.parkingSpaces")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Parking spaces must be 0 or greater"),

  body("details.yearBuilt")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(
      `Year built must be between 1900 and ${new Date().getFullYear() + 1}`,
    ),

  body("pricing.monthlyRent")
    .notEmpty()
    .withMessage("Monthly rent is required")
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),

  body("pricing.securityDeposit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be a positive number"),

  body("pricing.utilityBills")
    .optional()
    .isIn(["included", "excluded", "negotiable"])
    .withMessage("Invalid utility bills option"),

  body("pricing.negotiable")
    .optional()
    .isBoolean()
    .withMessage("Negotiable must be true or false"),

  body("leaseTerms.minimumLease")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Minimum lease must be at least 1 month"),

  body("leaseTerms.availableFrom")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid available from date"),

  body("leaseTerms.noticePeriod")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Notice period must be 0 or greater"),

  body("amenities")
    .optional()
    .isObject()
    .withMessage("Amenities must be an object"),
];

const validateUpdateProperty = [
  param("id").isMongoId().withMessage("Invalid property ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 150 })
    .withMessage("Title must be 10-150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage("Description must be 50-5000 characters"),

  body("propertyType")
    .optional()
    .isIn([
      "apartment",
      "villa",
      "house",
      "studio",
      "commercial",
      "duplex",
      "penthouse",
      "other",
    ])
    .withMessage("Invalid property type"),

  body("pricing.monthlyRent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),

  body("details.bedrooms")
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage("Bedrooms must be between 0 and 20"),

  body("details.furnished")
    .optional()
    .isIn(["fully_furnished", "semi_furnished", "unfurnished"])
    .withMessage("Invalid furnishing status"),
];

// ── SEARCH PROPERTY VALIDATOR ─────────────────────────────────────────────────
const validatePropertySearch = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),

  query("minBedrooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum bedrooms must be 0 or greater"),

  query("maxBedrooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum bedrooms must be 0 or greater"),

  query("sortBy")
    .optional()
    .isIn(["newest", "price_low", "price_high", "rating", "most_viewed"])
    .withMessage("Invalid sort option"),
];

// ── REVIEW VALIDATOR ──────────────────────────────────────────────────────────
const validateCreateReview = [
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

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Review title cannot exceed 100 characters"),

  body("subRatings.cleanliness").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.accuracy").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.communication").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.location").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.value").optional().isInt({ min: 1, max: 5 }),
  body("subRatings.maintenance").optional().isInt({ min: 1, max: 5 }),
];

// ── REPORT PROPERTY VALIDATOR ─────────────────────────────────────────────────
const validateReportProperty = [
  body("reportType")
    .notEmpty()
    .withMessage("Report type is required")
    .isIn([
      "fake_listing",
      "scam",
      "wrong_information",
      "inappropriate_content",
      "harassment",
      "spam",
      "discrimination",
      "illegal_activity",
      "duplicate_listing",
      "overpriced",
      "unavailable_property",
      "fake_photos",
      "other",
    ])
    .withMessage("Invalid report type"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Report description is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be 20-2000 characters"),
];

// ── PROPERTY ID PARAM VALIDATOR ───────────────────────────────────────────────
const validatePropertyId = [
  param("id").isMongoId().withMessage("Invalid property ID"),
];

module.exports = {
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertySearch,
  validateCreateReview,
  validateReportProperty,
  validatePropertyId,
};
