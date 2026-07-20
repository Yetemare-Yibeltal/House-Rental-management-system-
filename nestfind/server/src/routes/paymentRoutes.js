// nestfind/nestfind/server/src/routes/paymentRoutes.js

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");
const { paymentLimiter } = require("../middleware/rateLimiter");
const {
  validateCreatePayment,
  validateId,
} = require("../validators/tenantValidators");

// ── TENANT ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/tenant",
  protect,
  authorize("tenant"),
  paymentController.getTenantPayments,
);
router.post(
  "/",
  protect,
  authorize("tenant"),
  paymentLimiter,
  validateCreatePayment,
  paymentController.createPayment,
);
router.post(
  "/:id/dispute",
  protect,
  authorize("tenant"),
  validateId,
  paymentController.raiseDispute,
);

// ── LANDLORD ROUTES ───────────────────────────────────────────────────────────
router.get(
  "/landlord",
  protect,
  authorize("landlord"),
  paymentController.getLandlordPayments,
);
router.get(
  "/landlord/summary",
  protect,
  authorize("landlord"),
  paymentController.getMonthlySummary,
);
router.get(
  "/landlord/overdue",
  protect,
  authorize("landlord"),
  paymentController.getOverduePayments,
);

// ── SHARED ROUTES ─────────────────────────────────────────────────────────────
router.get("/:id", protect, validateId, paymentController.getPayment);
router.get(
  "/:id/receipt",
  protect,
  validateId,
  paymentController.getPaymentReceipt,
);

module.exports = router;
