// nestfind/nestfind/server/src/services/ai/maintenanceAiService.js

const aiService = require("./aiService");
const MaintenanceRequest = require("../../models/MaintenanceRequest");
const logger = require("../../utils/logger");

// ── URGENCY LEVEL DEFINITIONS ─────────────────────────────────────────────────
const URGENCY_LEVELS = {
  emergency: {
    label: "Emergency",
    color: "red",
    description: "Requires immediate attention — safety risk or major damage",
    responseTime: "Within 2 hours",
    examples: [
      "gas leak",
      "flooding",
      "electrical fire",
      "no water at all",
      "broken door lock",
    ],
  },
  high: {
    label: "High Priority",
    color: "orange",
    description: "Serious issue affecting daily life — fix within 24 hours",
    responseTime: "Within 24 hours",
    examples: [
      "no hot water",
      "burst pipe",
      "broken heating",
      "major appliance failure",
    ],
  },
  medium: {
    label: "Medium Priority",
    color: "yellow",
    description: "Inconvenient but not dangerous — fix within 3-5 days",
    responseTime: "Within 3-5 days",
    examples: [
      "leaking tap",
      "broken window",
      "faulty socket",
      "broken appliance",
    ],
  },
  low: {
    label: "Low Priority",
    color: "green",
    description: "Minor issue — can be scheduled at convenience",
    responseTime: "Within 2 weeks",
    examples: [
      "cosmetic damage",
      "squeaky door",
      "paint peeling",
      "light bulb out",
    ],
  },
};

// ── CATEGORY DETECTION ────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  plumbing: [
    "water",
    "pipe",
    "tap",
    "drain",
    "toilet",
    "sink",
    "shower",
    "leak",
    "flood",
    "pressure",
  ],
  electrical: [
    "electricity",
    "electric",
    "power",
    "socket",
    "switch",
    "breaker",
    "wiring",
    "light",
    "outlet",
  ],
  hvac: [
    "heating",
    "cooling",
    "ac",
    "air condition",
    "ventilation",
    "fan",
    "temperature",
  ],
  structural: [
    "wall",
    "ceiling",
    "floor",
    "roof",
    "crack",
    "door",
    "window",
    "foundation",
  ],
  appliance: [
    "fridge",
    "oven",
    "stove",
    "washing machine",
    "dishwasher",
    "microwave",
    "appliance",
  ],
  pest_control: [
    "pest",
    "insect",
    "cockroach",
    "rat",
    "mouse",
    "ant",
    "termite",
    "bug",
  ],
  security: ["lock", "key", "door", "gate", "security", "camera", "alarm"],
  internet: ["internet", "wifi", "network", "cable", "connection"],
};

/**
 * Detect likely maintenance category from description.
 * Used as fallback if AI category detection fails.
 *
 * @param {string} description - Issue description
 * @returns {string} - Most likely category
 */
const detectCategory = (description) => {
  const lower = description.toLowerCase();
  let bestCategory = "other";
  let bestCount = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }

  return bestCategory;
};

// ── MAIN DIAGNOSIS FUNCTION ───────────────────────────────────────────────────

/**
 * Diagnose a maintenance issue from tenant description.
 *
 * @param {Object} params - Diagnosis parameters
 * @returns {Object} - AI diagnosis with urgency, cause, and recommendations
 */
const diagnoseIssue = async ({
  description,
  title,
  photos = [],
  propertyType = "apartment",
  tenantId,
}) => {
  const startTime = Date.now();

  try {
    if (!description || description.trim().length < 10) {
      return {
        success: false,
        error: "Please provide a more detailed description of the issue",
      };
    }

    // Detect basic category as fallback
    const detectedCategory = detectCategory(description);

    const prompt = `You are a home maintenance expert helping Ethiopian apartment tenants understand and report maintenance issues.

ISSUE REPORT:
Title: ${title || "Maintenance issue"}
Description: "${description}"
Property Type: ${propertyType}
${photos.length > 0 ? `Photos provided: ${photos.length} photo(s) attached` : "No photos provided"}

Analyze this maintenance issue and return ONLY this JSON (no other text):
{
  "diagnosis": "<clear explanation of what is likely wrong in simple terms>",
  "likelyCause": "<most probable cause of this issue>",
  "urgency": "<emergency|high|medium|low>",
  "urgencyReason": "<why this urgency level was chosen>",
  "category": "<plumbing|electrical|hvac|structural|appliance|pest_control|cleaning|security|internet|painting|flooring|roofing|window_door|other>",
  "isEmergency": <true|false>,
  "requiresProfessional": <true|false>,
  "immediateSteps": [
    "<safety step 1 to take right now>",
    "<safety step 2 if needed>"
  ],
  "diyFixSuggestions": [
    "<simple thing tenant can try themselves>",
    "<another DIY option if applicable>"
  ],
  "estimatedRepairTime": "<e.g. 1-2 hours, half a day, 1-2 days>",
  "whatToTellLandlord": "<clear, professional description to include in maintenance request>",
  "preventionTips": [
    "<tip to prevent this in future>"
  ],
  "estimatedCostRange": "<rough ETB cost range for professional repair, or null if unknown>",
  "warningSigns": [
    "<sign that this is more serious than it appears>"
  ]
}

Important guidelines:
- Ethiopian context: power outages are common, water pressure issues frequent, old buildings may have aging plumbing
- Emergency = immediate danger to life or major structural damage
- Always prioritize tenant safety
- If electrical issue: always recommend turning off power first
- If water leak: always recommend shutting off water valve first
- Be specific and practical in advice
- diyFixSuggestions should only be for genuinely minor issues — don't recommend DIY for electrical or structural`;

    const result = await aiService.sendMessage(
      prompt,
      "maintenance_diagnosis",
      { maxTokens: 1000 },
    );

    const responseTimeMs = Date.now() - startTime;

    if (!result.success || !result.content) {
      return {
        success: true,
        isAIGenerated: false,
        diagnosis:
          "Unable to analyze automatically. Please describe the issue in detail to your landlord.",
        urgency: "medium",
        category: detectedCategory,
        requiresProfessional: true,
        isEmergency: false,
        immediateSteps: [
          "Document the issue with photos",
          "Report to landlord immediately",
        ],
        diyFixSuggestions: [],
      };
    }

    const diagnosis = aiService.parseJSONResponse(result.content);

    if (!diagnosis) {
      return {
        success: false,
        error: "Could not process diagnosis. Please try again.",
      };
    }

    // Log AI usage
    if (tenantId) {
      await aiService.logAIUsage({
        userId: tenantId,
        feature: "maintenance_diagnosis",
        action: "ai_maintenance_diagnosed",
        tokensUsed: result.tokensUsed,
        responseTimeMs,
        success: true,
      });
    }

    logger.info(
      `Maintenance diagnosed: urgency=${diagnosis.urgency}, category=${diagnosis.category}, time=${responseTimeMs}ms`,
    );

    return {
      success: true,
      isAIGenerated: true,
      diagnosis: diagnosis.diagnosis,
      likelyCause: diagnosis.likelyCause,
      urgency: diagnosis.urgency || "medium",
      urgencyInfo: URGENCY_LEVELS[diagnosis.urgency] || URGENCY_LEVELS.medium,
      urgencyReason: diagnosis.urgencyReason,
      category: diagnosis.category || detectedCategory,
      isEmergency: diagnosis.isEmergency || false,
      requiresProfessional: diagnosis.requiresProfessional !== false,
      immediateSteps: diagnosis.immediateSteps || [],
      diyFixSuggestions: diagnosis.diyFixSuggestions || [],
      estimatedRepairTime: diagnosis.estimatedRepairTime,
      whatToTellLandlord: diagnosis.whatToTellLandlord,
      preventionTips: diagnosis.preventionTips || [],
      estimatedCostRange: diagnosis.estimatedCostRange || null,
      warningSigns: diagnosis.warningSign || [],
      tokensUsed: result.tokensUsed,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(`Maintenance diagnosis failed: ${error.message}`);
    return {
      success: false,
      error:
        "Diagnosis service temporarily unavailable. Please describe issue to landlord directly.",
    };
  }
};

// ── SAVE DIAGNOSIS TO REQUEST ──────────────────────────────────────────────────

/**
 * Save AI diagnosis to an existing maintenance request.
 *
 * @param {string} requestId - MaintenanceRequest document ID
 * @param {Object} diagnosisData - AI diagnosis results
 * @returns {Object} - Updated maintenance request
 */
const saveDiagnosisToRequest = async (requestId, diagnosisData) => {
  try {
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return { success: false, error: "Maintenance request not found" };
    }

    await request.saveAIDiagnosis({
      diagnosis: diagnosisData.diagnosis,
      likelyCause: diagnosisData.likelyCause,
      aiUrgencyAssessment: diagnosisData.urgency,
      recommendedAction: diagnosisData.whatToTellLandlord,
      estimatedRepairTime: diagnosisData.estimatedRepairTime,
      suggestedCategory: diagnosisData.category,
      isEmergencyDetected: diagnosisData.isEmergency,
      diyFixSuggestions: diagnosisData.diyFixSuggestions,
      requiresProfessional: diagnosisData.requiresProfessional,
    });

    return { success: true };
  } catch (error) {
    logger.error(`Failed to save diagnosis to request: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── LANDLORD RESPONSE HELPER ──────────────────────────────────────────────────

/**
 * Generate a professional landlord response to a maintenance request.
 * Helps landlords respond quickly with appropriate messaging.
 *
 * @param {string} requestId - MaintenanceRequest document ID
 * @param {string} landlordId - Landlord user ID
 * @param {string} action - What action landlord is taking ('acknowledge'|'schedule'|'decline')
 * @returns {Object} - Suggested response message
 */
const generateLandlordResponse = async (requestId, landlordId, action) => {
  try {
    const request = await MaintenanceRequest.findOne({
      _id: requestId,
      landlord: landlordId,
    })
      .populate("tenant", "firstName")
      .lean();

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const actionPrompts = {
      acknowledge: `Write a professional acknowledgment message from a landlord to tenant ${request.tenant?.firstName} about their maintenance request: "${request.title}". Be empathetic, confirm receipt, and give estimated timeline.`,
      schedule: `Write a message scheduling a repair visit for maintenance request: "${request.title}". Include placeholder [DATE] and [TIME] for landlord to fill in.`,
      decline: `Write a professional decline message for maintenance request: "${request.title}" where landlord explains this is tenant's responsibility per lease agreement. Be respectful.`,
    };

    const result = await aiService.sendMessage(
      actionPrompts[action] || actionPrompts.acknowledge,
      "chat_assistant",
      { maxTokens: 300 },
    );

    if (!result.success) {
      return { success: false, error: "Could not generate response" };
    }

    return {
      success: true,
      suggestedResponse: result.content,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error(`Landlord response generation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Analyze maintenance request patterns for a property.
 * Identifies recurring issues that may indicate systemic problems.
 *
 * @param {string} propertyId - Property ID to analyze
 * @returns {Object} - Pattern analysis
 */
const analyzeMaintenancePatterns = async (propertyId) => {
  try {
    const requests = await MaintenanceRequest.find({
      property: propertyId,
      status: { $in: ["completed", "acknowledged", "in_progress"] },
    })
      .select("title category urgency createdAt completedAt repairCost ai")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (requests.length === 0) {
      return {
        success: true,
        message: "No maintenance history to analyze",
        patterns: [],
      };
    }

    // Count by category
    const categoryCount = {};
    requests.forEach((r) => {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    });

    // Find recurring issues
    const recurringCategories = Object.entries(categoryCount)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count,
        isRecurring: count >= 3,
      }));

    // Calculate total costs
    const totalCost = requests.reduce((sum, r) => sum + (r.repairCost || 0), 0);

    // Average resolution time
    const resolvedRequests = requests.filter(
      (r) => r.completedAt && r.createdAt,
    );
    const avgResolutionDays =
      resolvedRequests.length > 0
        ? resolvedRequests.reduce((sum, r) => {
            const days =
              (new Date(r.completedAt) - new Date(r.createdAt)) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / resolvedRequests.length
        : null;

    return {
      success: true,
      totalRequests: requests.length,
      recurringCategories,
      mostCommonIssue: recurringCategories[0]?.category || null,
      totalRepairCost: totalCost,
      avgResolutionDays: avgResolutionDays
        ? Math.round(avgResolutionDays)
        : null,
      hasSystemicIssues: recurringCategories.some((c) => c.isRecurring),
      recommendation:
        recurringCategories.length > 0
          ? `This property has recurring ${recurringCategories[0].category} issues. Consider a professional inspection.`
          : "No major recurring issues detected.",
    };
  } catch (error) {
    logger.error(`Maintenance pattern analysis failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  diagnoseIssue,
  saveDiagnosisToRequest,
  generateLandlordResponse,
  analyzeMaintenancePatterns,
  detectCategory,
  URGENCY_LEVELS,
};
