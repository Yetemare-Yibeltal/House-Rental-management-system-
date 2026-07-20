// nestfind/nestfind/server/src/routes/savedSearchRoutes.js

const express = require("express");
const router = express.Router();
const savedSearchController = require("../controllers/savedSearchController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const { searchLimiter } = require("../middleware/rateLimiter");
const { validateSaveSearch } = require("../validators/tenantValidators");

// AI natural language search (public with optional auth)
router.get(
  "/search",
  searchLimiter,
  optionalAuth,
  savedSearchController.naturalLanguageSearch,
);
router.get(
  "/suggestions",
  searchLimiter,
  savedSearchController.getSearchSuggestions,
);
router.get("/popular", savedSearchController.getPopularSearches);

// Protected tenant routes
router.get(
  "/",
  protect,
  authorize("tenant"),
  savedSearchController.getSavedSearches,
);
router.post(
  "/",
  protect,
  authorize("tenant"),
  validateSaveSearch,
  savedSearchController.saveSearch,
);
router.get(
  "/:id/run",
  protect,
  authorize("tenant"),
  savedSearchController.runSavedSearch,
);
router.patch(
  "/:id",
  protect,
  authorize("tenant"),
  savedSearchController.updateSavedSearch,
);
router.delete(
  "/:id",
  protect,
  authorize("tenant"),
  savedSearchController.deleteSavedSearch,
);

module.exports = router;
