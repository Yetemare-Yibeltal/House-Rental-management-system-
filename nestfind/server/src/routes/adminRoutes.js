// nestfind/nestfind/server/src/routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminUserController = require("../controllers/adminUserController");
const adminPropertyController = require("../controllers/adminPropertyController");
const adminPaymentController = require("../controllers/adminPaymentController");
const adminReportController = require("../controllers/adminReportController");
const adminSettingsController = require("../controllers/adminSettingsController");
const adminReviewController = require("../controllers/adminReviewController");
const { protect, authorize } = require("../middleware/auth");
const { adminActionLimiter } = require("../middleware/rateLimiter");
const {
  validateUpdateUserStatus,
  validateUpdateUserRole,
  validateApproveProperty,
  validateKYCDecision,
  validateReviewDecision,
  validateReportDecision,
  validateCreateBlogPost,
  validateCreateFAQ,
  validateUpdateSettings,
  validateBroadcast,
  validateAdminPaymentAction,
  validateId,
  validatePagination,
  validateDateRange,
} = require("../validators/adminValidators");

// Apply auth middleware to all admin routes
router.use(protect, authorize("admin"));

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get("/dashboard", adminController.getDashboardStats);
router.get("/overview", adminController.getPlatformOverview);

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────
router.get("/users", validatePagination, adminUserController.getUsers);
router.get("/users/stats", adminUserController.getUserStats);
router.get("/users/:id", validateId, adminUserController.getUser);
router.patch(
  "/users/:id/status",
  validateUpdateUserStatus,
  adminUserController.updateUserStatus,
);
router.patch(
  "/users/:id/role",
  validateUpdateUserRole,
  adminUserController.updateUserRole,
);
router.delete("/users/:id", validateId, adminUserController.deleteUser);

// ── KYC MANAGEMENT ───────────────────────────────────────────────────────────
router.get("/kyc", validatePagination, adminUserController.getKYCSubmissions);
router.get("/kyc/:id", validateId, adminUserController.getKYCSubmission);
router.patch(
  "/kyc/:id",
  validateId,
  validateKYCDecision,
  adminUserController.processKYCDecision,
);

// ── PROPERTY MANAGEMENT ───────────────────────────────────────────────────────
router.get(
  "/properties",
  validatePagination,
  adminPropertyController.getProperties,
);
router.get(
  "/properties/pending",
  validatePagination,
  adminPropertyController.getPendingReview,
);
router.get(
  "/properties/flagged",
  validatePagination,
  adminPropertyController.getFlaggedProperties,
);
router.get("/properties/stats", adminPropertyController.getPropertyStats);
router.get("/properties/:id", validateId, adminPropertyController.getProperty);
router.patch(
  "/properties/:id",
  validateId,
  validateApproveProperty,
  adminPropertyController.approveProperty,
);
router.delete(
  "/properties/:id",
  validateId,
  adminPropertyController.deleteProperty,
);
router.post(
  "/properties/:id/fraud-check",
  validateId,
  adminPropertyController.runFraudCheck,
);
router.post(
  "/properties/batch-fraud-check",
  adminPropertyController.runBatchFraudCheck,
);

// ── PAYMENT MANAGEMENT ────────────────────────────────────────────────────────
router.get("/payments", validatePagination, adminPaymentController.getPayments);
router.get(
  "/payments/stats",
  validateDateRange,
  adminPaymentController.getRevenueStats,
);
router.get(
  "/payments/disputed",
  validatePagination,
  adminPaymentController.getDisputedPayments,
);
router.get("/payments/:id", validateId, adminPaymentController.getPayment);
router.patch(
  "/payments/:id/refund",
  validateId,
  adminPaymentController.processRefund,
);
router.patch(
  "/payments/:id/resolve-dispute",
  validateId,
  adminPaymentController.resolveDispute,
);

// ── REPORT MANAGEMENT ─────────────────────────────────────────────────────────
router.get("/reports", validatePagination, adminReportController.getReports);
router.get(
  "/reports/pending",
  validatePagination,
  adminReportController.getPendingReports,
);
router.get("/reports/stats", adminReportController.getReportStats);
router.get("/reports/:id", validateId, adminReportController.getReport);
router.patch(
  "/reports/:id",
  validateId,
  validateReportDecision,
  adminReportController.processReport,
);

// ── REVIEW MANAGEMENT ─────────────────────────────────────────────────────────
router.get("/reviews", validatePagination, adminReviewController.getReviews);
router.get("/reviews/stats", adminReviewController.getReviewStats);
router.get("/reviews/:id", validateId, adminReviewController.getReview);
router.patch("/reviews/:id", validateId, adminReviewController.moderateReview);
router.delete("/reviews/:id", validateId, adminReviewController.deleteReview);

// ── SETTINGS ──────────────────────────────────────────────────────────────────
router.get("/settings", adminSettingsController.getSettings);
router.patch(
  "/settings",
  validateUpdateSettings,
  adminSettingsController.updateSettings,
);
router.post("/settings/reset", adminSettingsController.resetToDefaults);
router.get("/settings/feature/:feature", adminSettingsController.checkFeature);
router.get(
  "/settings/ai-feature/:feature",
  adminSettingsController.checkAIFeature,
);
router.patch(
  "/settings/ai-feature/:featureName",
  adminSettingsController.toggleAIFeature,
);
router.get(
  "/settings/maintenance",
  adminSettingsController.getMaintenanceStatus,
);
router.patch("/settings/maintenance", adminController.toggleMaintenanceMode);

// ── BROADCAST ─────────────────────────────────────────────────────────────────
router.post(
  "/broadcast",
  adminActionLimiter,
  validateBroadcast,
  adminController.sendBroadcast,
);

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
router.get(
  "/audit-logs",
  validatePagination,
  validateDateRange,
  adminController.getAuditLogs,
);
router.get(
  "/security-alerts",
  validatePagination,
  adminController.getSecurityAlerts,
);

// ── AI MANAGEMENT ─────────────────────────────────────────────────────────────
router.get("/ai/stats", validateDateRange, adminController.getAIUsageStats);
router.get("/ai/pending-reviews", adminController.getPendingReviews);
router.patch("/ai/reviews/:id", validateId, adminController.moderateReview);

module.exports = router;
