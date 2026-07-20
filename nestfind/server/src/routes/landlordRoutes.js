// nestfind/nestfind/server/src/routes/landlordRoutes.js

const express = require("express");
const router = express.Router();
const landlordController = require("../controllers/landlordController");
const analyticsController = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");
const {
  validateLandlordProfile,
  validateLandlordReviewTenant,
} = require("../validators/landlordValidators");

router.use(protect, authorize("landlord"));

// Dashboard
router.get("/dashboard", landlordController.getDashboardStats);

// Analytics
router.get("/analytics", analyticsController.getLandlordAnalytics);
router.get(
  "/analytics/property/:propertyId",
  analyticsController.getPropertyAnalytics,
);

// Profile
router.patch(
  "/profile",
  validateLandlordProfile,
  landlordController.updateLandlordProfile,
);
router.get("/profile/:id", landlordController.getLandlordProfile);

// AI Features
router.post("/ai/rent-advice", landlordController.getRentAdvice);
router.get("/ai/rent-estimate", landlordController.getQuickRentEstimate);
router.post("/ai/generate-description", landlordController.generateDescription);
router.post("/ai/improve-description", landlordController.improveDescription);
router.get("/ai/portfolio-pricing", landlordController.analyzePortfolioPricing);

// Tenant management
router.get("/tenants", landlordController.getMyTenants);
router.get("/tenants/:tenantId", landlordController.getTenantDetails);
router.post(
  "/tenants/:tenantId/review",
  validateLandlordReviewTenant,
  landlordController.reviewTenant,
);

// Upcoming visits
router.get("/visits/upcoming", landlordController.getUpcomingVisits);

module.exports = router;
