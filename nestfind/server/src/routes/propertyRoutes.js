// nestfind/nestfind/server/src/routes/propertyRoutes.js

const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  uploadPropertyImages,
  uploadPropertyCoverImage,
} = require("../middleware/upload");
const { searchLimiter } = require("../middleware/rateLimiter");
const {
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertySearch,
  validateCreateReview,
  validateReportProperty,
  validatePropertyId,
} = require("../validators/propertyValidators");

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/",
  searchLimiter,
  validatePropertySearch,
  optionalAuth,
  propertyController.getProperties,
);
router.get("/featured", propertyController.getFeaturedProperties);
router.get(
  "/:id",
  validatePropertyId,
  optionalAuth,
  propertyController.getProperty,
);
router.get(
  "/:id/images",
  validatePropertyId,
  propertyController.getPropertyImages,
);
router.get(
  "/:id/reviews",
  validatePropertyId,
  propertyController.getPropertyReviews,
);

// ── PROTECTED — TENANT ROUTES ─────────────────────────────────────────────────
router.post(
  "/:id/reviews",
  protect,
  authorize("tenant"),
  validatePropertyId,
  validateCreateReview,
  propertyController.createReview,
);
router.post(
  "/:id/report",
  protect,
  validatePropertyId,
  validateReportProperty,
  propertyController.reportProperty,
);

// ── PROTECTED — LANDLORD ROUTES ───────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("landlord", "admin"),
  validateCreateProperty,
  propertyController.createProperty,
);
router.put(
  "/:id",
  protect,
  authorize("landlord", "admin"),
  validateUpdateProperty,
  propertyController.updateProperty,
);
router.patch(
  "/:id",
  protect,
  authorize("landlord", "admin"),
  validatePropertyId,
  propertyController.updateProperty,
);
router.delete(
  "/:id",
  protect,
  authorize("landlord", "admin"),
  validatePropertyId,
  propertyController.deleteProperty,
);

// Image management
router.post(
  "/:id/images",
  protect,
  authorize("landlord", "admin"),
  uploadPropertyImages,
  propertyController.uploadImages,
);
router.delete(
  "/:id/images/:imageId",
  protect,
  authorize("landlord", "admin"),
  propertyController.deleteImage,
);
router.patch(
  "/:id/images/:imageId/cover",
  protect,
  authorize("landlord", "admin"),
  propertyController.setCoverImage,
);
router.put(
  "/:id/images/reorder",
  protect,
  authorize("landlord", "admin"),
  propertyController.reorderImages,
);

module.exports = router;
