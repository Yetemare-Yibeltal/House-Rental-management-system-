// nestfind/nestfind/server/src/routes/ai/aiRoutes.js

const express = require("express");
const router = express.Router();
const aiController = require("../../controllers/ai/aiController");
const { protect, authorize, optionalAuth } = require("../../middleware/auth");
const { searchLimiter } = require("../../middleware/rateLimiter");

// ── CHAT ASSISTANT ────────────────────────────────────────────────────────────
router.post("/chat/start", protect, aiController.startConversation);
router.post("/chat/message", protect, aiController.sendChatMessage);
router.post("/chat/stream", protect, aiController.streamChatMessage);
router.patch(
  "/chat/:conversationId/end",
  protect,
  aiController.endConversation,
);
router.get("/chat/history", protect, aiController.getConversationHistory);
router.post(
  "/chat/:conversationId/message/:messageId/feedback",
  protect,
  aiController.addMessageFeedback,
);
router.get("/chat/suggestions", protect, aiController.getSuggestedReplies);

// ── PROPERTY RECOMMENDATIONS ──────────────────────────────────────────────────
router.get(
  "/recommendations",
  protect,
  authorize("tenant"),
  aiController.getRecommendations,
);
router.post(
  "/recommendations/interaction",
  protect,
  authorize("tenant"),
  aiController.recordRecommendationInteraction,
);

// ── SMART SEARCH ──────────────────────────────────────────────────────────────
router.get("/search", searchLimiter, optionalAuth, aiController.smartSearch);
router.get(
  "/search/suggestions",
  searchLimiter,
  aiController.getSearchSuggestions,
);

// ── RENT ADVISOR ──────────────────────────────────────────────────────────────
router.post(
  "/rent-advisor",
  protect,
  authorize("landlord"),
  aiController.getRentAdvice,
);

// ── LEASE EXPLAINER ───────────────────────────────────────────────────────────
router.get("/lease/:contractId/explain", protect, aiController.explainLease);
router.post("/lease/analyze-clause", protect, aiController.analyzeClause);

// ── MAINTENANCE DIAGNOSIS ─────────────────────────────────────────────────────
router.post(
  "/maintenance/diagnose",
  protect,
  authorize("tenant"),
  aiController.diagnoseMaintenance,
);

// ── PROPERTY DESCRIPTION ──────────────────────────────────────────────────────
router.post(
  "/description/generate",
  protect,
  authorize("landlord"),
  aiController.generateDescription,
);
router.post(
  "/description/improve",
  protect,
  authorize("landlord"),
  aiController.improveDescription,
);
router.post(
  "/description/translate",
  protect,
  aiController.translateDescription,
);

// ── FRAUD DETECTION (ADMIN) ───────────────────────────────────────────────────
router.post(
  "/fraud-check/:propertyId",
  protect,
  authorize("admin"),
  aiController.checkPropertyFraud,
);

// ── AI STATS (ADMIN) ──────────────────────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), aiController.getAIStats);

module.exports = router;
