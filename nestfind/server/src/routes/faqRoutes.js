// nestfind/nestfind/server/src/routes/faqRoutes.js

const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");
const { protect, authorize } = require("../middleware/auth");
const { validateCreateFAQ } = require("../validators/adminValidators");

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.get("/", faqController.getFAQs);
router.get("/categories", faqController.getCategories);
router.get("/featured", faqController.getFeaturedFAQs);
router.get("/search", faqController.searchFAQs);
router.get("/:slug", faqController.getFAQ);
router.patch("/:id/vote", faqController.voteHelpful);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
router.get("/admin/all", protect, authorize("admin"), faqController.getAllFAQs);
router.post(
  "/",
  protect,
  authorize("admin"),
  validateCreateFAQ,
  faqController.createFAQ,
);
router.put("/:id", protect, authorize("admin"), faqController.updateFAQ);
router.delete("/:id", protect, authorize("admin"), faqController.deleteFAQ);

module.exports = router;
