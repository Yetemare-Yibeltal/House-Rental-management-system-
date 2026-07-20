// nestfind/nestfind/server/src/routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/auth");
const {
  validateCreateBooking,
  validateUpdateBooking,
  validateApproveBooking,
  validateDeclineBooking,
  validateId,
  validatePagination,
} = require("../validators/tenantValidators");

// ── TENANT ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/tenant",
  protect,
  authorize("tenant"),
  validatePagination,
  bookingController.getTenantBookings,
);
router.post(
  "/",
  protect,
  authorize("tenant"),
  validateCreateBooking,
  bookingController.createBooking,
);
router.patch(
  "/:id/cancel",
  protect,
  authorize("tenant"),
  validateId,
  bookingController.cancelBooking,
);

// ── LANDLORD ROUTES ───────────────────────────────────────────────────────────
router.get(
  "/landlord",
  protect,
  authorize("landlord"),
  validatePagination,
  bookingController.getLandlordBookings,
);
router.get(
  "/landlord/upcoming",
  protect,
  authorize("landlord"),
  bookingController.getUpcomingVisits,
);
router.get(
  "/landlord/stats",
  protect,
  authorize("landlord"),
  bookingController.getBookingStats,
);
router.patch(
  "/:id/approve",
  protect,
  authorize("landlord"),
  validateApproveBooking,
  bookingController.approveBooking,
);
router.patch(
  "/:id/decline",
  protect,
  authorize("landlord"),
  validateDeclineBooking,
  bookingController.declineBooking,
);
router.patch(
  "/:id/complete",
  protect,
  authorize("landlord"),
  validateId,
  bookingController.completeBooking,
);

// ── SHARED ROUTES ─────────────────────────────────────────────────────────────
router.get("/:id", protect, validateId, bookingController.getBooking);

module.exports = router;
