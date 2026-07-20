// nestfind/nestfind/server/src/routes/savedPropertyRoutes.js

const express = require("express");
const router = express.Router();
const savedPropertyController = require("../controllers/savedPropertyController");
const { protect, authorize } = require("../middleware/auth");
const { validateSaveProperty } = require("../validators/tenantValidators");

router.get(
  "/",
  protect,
  authorize("tenant"),
  savedPropertyController.getSavedProperties,
);
router.post(
  "/toggle",
  protect,
  authorize("tenant"),
  validateSaveProperty,
  savedPropertyController.toggleSaveProperty,
);
router.get(
  "/collections",
  protect,
  authorize("tenant"),
  savedPropertyController.getCollections,
);
router.get(
  "/price-drops",
  protect,
  authorize("tenant"),
  savedPropertyController.getPriceDropAlerts,
);
router.get("/check/:propertyId", protect, savedPropertyController.checkIfSaved);
router.patch(
  "/:id",
  protect,
  authorize("tenant"),
  savedPropertyController.updateSavedProperty,
);
router.delete(
  "/:id",
  protect,
  authorize("tenant"),
  savedPropertyController.removeSavedProperty,
);

module.exports = router;
