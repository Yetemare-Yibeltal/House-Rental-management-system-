// nestfind/nestfind/server/src/routes/rentalRoutes.js

const express = require("express");
const router = express.Router();
const rentalController = require("../controllers/rentalController");
const { protect, authorize } = require("../middleware/auth");
const {
  validateCreateRental,
  validateUpdateRental,
  validateId,
} = require("../validators/landlordValidators");

// ── TENANT ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/tenant/active",
  protect,
  authorize("tenant"),
  rentalController.getTenantActiveRental,
);
router.get(
  "/tenant/history",
  protect,
  authorize("tenant"),
  rentalController.getTenantRentalHistory,
);

// ── LANDLORD ROUTES ───────────────────────────────────────────────────────────
router.get(
  "/landlord",
  protect,
  authorize("landlord"),
  rentalController.getLandlordRentals,
);
router.post(
  "/",
  protect,
  authorize("landlord"),
  validateCreateRental,
  rentalController.createRental,
);
router.get(
  "/expiring",
  protect,
  authorize("landlord", "admin"),
  rentalController.getExpiringSoon,
);
router.get(
  "/stats",
  protect,
  authorize("landlord"),
  rentalController.getRentalStats,
);

// ── SHARED ROUTES ─────────────────────────────────────────────────────────────
router.get("/:id", protect, validateId, rentalController.getRental);
router.patch(
  "/:id",
  protect,
  authorize("landlord", "admin"),
  validateUpdateRental,
  rentalController.updateRental,
);
router.patch(
  "/:id/terminate",
  protect,
  validateId,
  rentalController.terminateRental,
);
router.patch(
  "/:id/move-in",
  protect,
  authorize("landlord"),
  validateId,
  rentalController.recordMoveIn,
);

module.exports = router;
