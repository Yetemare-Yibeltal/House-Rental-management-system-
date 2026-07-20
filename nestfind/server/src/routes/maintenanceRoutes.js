// nestfind/nestfind/server/src/routes/maintenanceRoutes.js

const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenanceController");
const { protect, authorize } = require("../middleware/auth");
const { uploadPropertyImages } = require("../middleware/upload");
const {
  validateCreateMaintenance,
  validateUpdateMaintenance,
  validateId,
} = require("../validators/tenantValidators");
const {
  validateMaintenanceResponse,
} = require("../validators/landlordValidators");

// ── AI DIAGNOSIS (PRE-SUBMISSION) ─────────────────────────────────────────────
router.post(
  "/diagnose",
  protect,
  authorize("tenant"),
  maintenanceController.diagnoseIssue,
);

// ── TENANT ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/tenant",
  protect,
  authorize("tenant"),
  maintenanceController.getTenantRequests,
);
router.post(
  "/",
  protect,
  authorize("tenant"),
  uploadPropertyImages,
  validateCreateMaintenance,
  maintenanceController.createMaintenanceRequest,
);
router.patch(
  "/:id/confirm",
  protect,
  authorize("tenant"),
  validateId,
  maintenanceController.confirmCompletion,
);

// ── LANDLORD ROUTES ───────────────────────────────────────────────────────────
router.get(
  "/landlord",
  protect,
  authorize("landlord"),
  maintenanceController.getLandlordRequests,
);
router.patch(
  "/:id/acknowledge",
  protect,
  authorize("landlord"),
  validateId,
  maintenanceController.acknowledgeRequest,
);
router.patch(
  "/:id/progress",
  protect,
  authorize("landlord"),
  validateId,
  maintenanceController.markInProgress,
);
router.patch(
  "/:id/complete",
  protect,
  authorize("landlord"),
  uploadPropertyImages,
  validateId,
  maintenanceController.completeRequest,
);
router.patch(
  "/:id/reject",
  protect,
  authorize("landlord"),
  validateId,
  maintenanceController.rejectRequest,
);
router.get(
  "/property/:propertyId/patterns",
  protect,
  authorize("landlord"),
  maintenanceController.analyzePatterns,
);

// ── SHARED ROUTES ─────────────────────────────────────────────────────────────
router.get("/stats", protect, maintenanceController.getMaintenanceStats);
router.get("/:id", protect, validateId, maintenanceController.getRequest);

module.exports = router;
