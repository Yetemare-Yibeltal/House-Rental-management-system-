// nestfind/nestfind/server/src/routes/contractRoutes.js

const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const { protect, authorize } = require("../middleware/auth");
const {
  validateCreateContract,
  validateSignContract,
  validateId,
} = require("../validators/landlordValidators");

// ── LANDLORD ROUTES ───────────────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("landlord"),
  validateCreateContract,
  contractController.createContract,
);
router.get(
  "/landlord",
  protect,
  authorize("landlord"),
  contractController.getLandlordContracts,
);
router.patch(
  "/:id/sign/landlord",
  protect,
  authorize("landlord"),
  validateSignContract,
  contractController.signAsLandlord,
);

// ── TENANT ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/tenant",
  protect,
  authorize("tenant"),
  contractController.getTenantContracts,
);
router.patch(
  "/:id/sign/tenant",
  protect,
  authorize("tenant"),
  validateSignContract,
  contractController.signAsTenant,
);
router.get(
  "/:id/explain",
  protect,
  authorize("tenant"),
  contractController.explainContract,
);
router.get(
  "/tenant/expiring",
  protect,
  authorize("tenant"),
  contractController.getContractsExpiringSoon,
);

// ── SHARED ROUTES ─────────────────────────────────────────────────────────────
router.get("/:id", protect, validateId, contractController.getContract);
router.patch(
  "/:id/terminate",
  protect,
  validateId,
  contractController.terminateContract,
);
router.post("/verify", contractController.verifyContract);
router.post("/analyze-clause", protect, contractController.analyzeClause);

module.exports = router;
