// nestfind/nestfind/server/src/controllers/ai/aiController.js

const chatAssistantService = require("../../services/ai/chatAssistantService");
const recommendationService = require("../../services/ai/recommendationService");
const smartSearchService = require("../../services/ai/smartSearchService");
const rentAdvisorService = require("../../services/ai/rentAdvisorService");
const leaseAiService = require("../../services/ai/leaseAiService");
const maintenanceAiService = require("../../services/ai/maintenanceAiService");
const fraudDetectionService = require("../../services/ai/fraudDetectionService");
const propertyDescriptionService = require("../../services/ai/propertyDescriptionService");
const AIConversation = require("../../models/AIConversation");
const SystemSettings = require("../../models/SystemSettings");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const logger = require("../../utils/logger");

// ── HELPER: CHECK AI FEATURE ──────────────────────────────────────────────────
const checkAIFeature = async (featureName) => {
  try {
    return await SystemSettings.isAIFeatureEnabled(featureName);
  } catch {
    return true;
  }
};

// ── START CHAT CONVERSATION ───────────────────────────────────────────────────
const startConversation = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("chatAssistant"))) {
    return sendError(res, "AI chat assistant is currently disabled.", 503);
  }

  const { pageName, pageUrl, resourceId, language } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  const result = await chatAssistantService.startConversation({
    userId,
    userRole,
    pageName,
    pageUrl,
    resourceId,
    language: language || "en",
    deviceInfo: {
      platform: req.get("User-Agent")?.includes("Mobile") ? "mobile" : "web",
      userAgent: req.get("User-Agent"),
    },
  });

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Conversation started.", result, 201);
});

// ── SEND CHAT MESSAGE ─────────────────────────────────────────────────────────
const sendChatMessage = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("chatAssistant"))) {
    return sendError(res, "AI chat assistant is currently disabled.", 503);
  }

  const { conversationId, message, pageName, resourceId, isVoiceMessage } =
    req.body;

  if (!conversationId || !message) {
    return sendError(res, "Conversation ID and message are required.", 400);
  }

  if (message.trim().length > 2000) {
    return sendError(res, "Message is too long. Maximum 2000 characters.", 400);
  }

  const result = await chatAssistantService.sendMessage({
    conversationId,
    userId: req.user._id,
    userRole: req.user.role,
    message: message.trim(),
    pageName,
    resourceId,
    isVoiceMessage: isVoiceMessage || false,
  });

  if (!result.success) return sendError(res, result.error, 400);

  const suggestions = chatAssistantService.getSuggestedReplies(
    req.user.role,
    pageName,
  );

  return sendSuccess(res, "Message sent.", {
    response: result.response,
    conversationId: result.conversationId,
    tokensUsed: result.tokensUsed,
    suggestions,
  });
});

// ── STREAM CHAT MESSAGE ───────────────────────────────────────────────────────
const streamChatMessage = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("chatAssistant"))) {
    return res
      .status(503)
      .json({ success: false, message: "AI chat is disabled." });
  }

  const { conversationId, message, pageName, resourceId } = req.body;

  if (!conversationId || !message) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Conversation ID and message are required.",
      });
  }

  await chatAssistantService.streamChatResponse(
    {
      conversationId,
      userId: req.user._id,
      userRole: req.user.role,
      message: message.trim(),
      pageName,
      resourceId,
    },
    res,
  );
});

// ── END CONVERSATION ──────────────────────────────────────────────────────────
const endConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const result = await chatAssistantService.endConversation(
    conversationId,
    req.user._id,
  );
  return sendSuccess(res, "Conversation ended.", result);
});

// ── GET CONVERSATION HISTORY ──────────────────────────────────────────────────
const getConversationHistory = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const history = await chatAssistantService.getConversationHistory(
    req.user._id,
    Number(limit),
  );
  return sendSuccess(res, "Conversation history retrieved.", { history });
});

// ── ADD MESSAGE FEEDBACK ──────────────────────────────────────────────────────
const addMessageFeedback = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.params;
  const { isHelpful, comment } = req.body;

  const conversation = await AIConversation.findOne({
    _id: conversationId,
    user: req.user._id,
  });

  if (!conversation) return sendError(res, "Conversation not found.", 404);

  await conversation.addMessageFeedback(messageId, isHelpful, comment);

  return sendSuccess(res, "Feedback recorded. Thank you!");
});

// ── GET PROPERTY RECOMMENDATIONS ──────────────────────────────────────────────
const getRecommendations = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("propertyRecommendations"))) {
    return sendError(res, "AI recommendations are currently disabled.", 503);
  }

  const { forceRefresh = false } = req.query;

  const result = await recommendationService.generateRecommendations(
    req.user._id,
    {
      forceRefresh: forceRefresh === "true",
      trigger: "manual_refresh",
    },
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Recommendations generated.", result);
});

// ── RECORD RECOMMENDATION INTERACTION ────────────────────────────────────────
const recordRecommendationInteraction = asyncHandler(async (req, res) => {
  const { propertyId, interactionType } = req.body;

  if (!propertyId || !interactionType) {
    return sendError(
      res,
      "Property ID and interaction type are required.",
      400,
    );
  }

  await recommendationService.recordInteraction(
    req.user._id,
    propertyId,
    interactionType,
  );

  return sendSuccess(res, "Interaction recorded.");
});

// ── SMART SEARCH ──────────────────────────────────────────────────────────────
const smartSearch = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("smartSearch"))) {
    return sendError(res, "AI smart search is currently disabled.", 503);
  }

  const { q, page = 1, limit = 12, save = false } = req.query;

  if (!q || q.trim().length < 3) {
    return sendError(res, "Search query must be at least 3 characters.", 400);
  }

  const result = await smartSearchService.naturalLanguageSearch({
    query: q.trim(),
    tenantId: req.user?._id || null,
    page: Number(page),
    limit: Number(limit),
    saveSearch: save === "true" && !!req.user,
  });

  if (!result.success) return sendError(res, result.error, 500);

  return sendSuccess(res, "Search results retrieved.", result);
});

// ── SEARCH SUGGESTIONS ────────────────────────────────────────────────────────
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2)
    return sendSuccess(res, "Suggestions.", { suggestions: [] });

  const suggestions = await smartSearchService.getSearchSuggestions(q);
  return sendSuccess(res, "Suggestions retrieved.", { suggestions });
});

// ── RENT ADVISOR ──────────────────────────────────────────────────────────────
const getRentAdvice = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("rentPriceAdvisor"))) {
    return sendError(res, "AI rent advisor is currently disabled.", 503);
  }

  const { propertyDetails } = req.body;
  if (!propertyDetails)
    return sendError(res, "Property details are required.", 400);

  const result = await rentAdvisorService.getRentAdvice(
    propertyDetails,
    req.user._id,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Rent advice generated.", result);
});

// ── EXPLAIN LEASE ─────────────────────────────────────────────────────────────
const explainLease = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("leaseExplainer"))) {
    return sendError(res, "AI lease explainer is currently disabled.", 503);
  }

  const { contractId } = req.params;
  const { language = "en" } = req.query;

  const result = await leaseAiService.explainContract(
    contractId,
    req.user._id,
    language,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Lease explanation generated.", result);
});

// ── ANALYZE CONTRACT CLAUSE ───────────────────────────────────────────────────
const analyzeClause = asyncHandler(async (req, res) => {
  const { clauseText } = req.body;
  if (!clauseText) return sendError(res, "Clause text is required.", 400);

  const result = await leaseAiService.analyzeClause(clauseText, req.user._id);

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Clause analyzed.", result);
});

// ── DIAGNOSE MAINTENANCE ──────────────────────────────────────────────────────
const diagnoseMaintenance = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("maintenanceDiagnosis"))) {
    return sendError(
      res,
      "AI maintenance diagnosis is currently disabled.",
      503,
    );
  }

  const { title, description } = req.body;
  if (!description)
    return sendError(res, "Issue description is required.", 400);

  const result = await maintenanceAiService.diagnoseIssue({
    title,
    description,
    tenantId: req.user._id,
  });

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Issue diagnosed.", result);
});

// ── GENERATE PROPERTY DESCRIPTION ────────────────────────────────────────────
const generateDescription = asyncHandler(async (req, res) => {
  if (!(await checkAIFeature("propertyDescriptionGenerator"))) {
    return sendError(
      res,
      "AI description generator is currently disabled.",
      503,
    );
  }

  const { propertyDetails, tone, length, language } = req.body;
  if (!propertyDetails)
    return sendError(res, "Property details are required.", 400);

  const result = await propertyDescriptionService.generatePropertyDescription(
    propertyDetails,
    req.user._id,
    { tone, length, language },
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Description generated.", result);
});

// ── IMPROVE DESCRIPTION ───────────────────────────────────────────────────────
const improveDescription = asyncHandler(async (req, res) => {
  const { existingDescription, propertyDetails } = req.body;
  if (!existingDescription)
    return sendError(res, "Existing description is required.", 400);

  const result = await propertyDescriptionService.improveDescription(
    existingDescription,
    propertyDetails || {},
    req.user._id,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Description improved.", result);
});

// ── CHECK FRAUD (ADMIN) ───────────────────────────────────────────────────────
const checkPropertyFraud = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const result = await fraudDetectionService.analyzePropertyForFraud(
    propertyId,
    null,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Fraud analysis complete.", result);
});

// ── GET AI USAGE STATS (ADMIN) ────────────────────────────────────────────────
const getAIStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await AIConversation.getUsageStats(startDate, endDate);

  return sendSuccess(res, "AI statistics retrieved.", { stats });
});

// ── GET SUGGESTED REPLIES ─────────────────────────────────────────────────────
const getSuggestedReplies = asyncHandler(async (req, res) => {
  const { pageName } = req.query;
  const suggestions = chatAssistantService.getSuggestedReplies(
    req.user.role,
    pageName,
  );
  return sendSuccess(res, "Suggestions retrieved.", { suggestions });
});

// ── TRANSLATE DESCRIPTION ─────────────────────────────────────────────────────
const translateDescription = asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description) return sendError(res, "Description is required.", 400);

  const result =
    await propertyDescriptionService.translateToAmharic(description);

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Description translated.", result);
});

module.exports = {
  startConversation,
  sendChatMessage,
  streamChatMessage,
  endConversation,
  getConversationHistory,
  addMessageFeedback,
  getRecommendations,
  recordRecommendationInteraction,
  smartSearch,
  getSearchSuggestions,
  getRentAdvice,
  explainLease,
  analyzeClause,
  diagnoseMaintenance,
  generateDescription,
  improveDescription,
  checkPropertyFraud,
  getAIStats,
  getSuggestedReplies,
  translateDescription,
};
