// nestfind/nestfind/server/src/services/ai/fraudDetectionService.js

const aiService = require("./aiService");
const Property = require("../../models/Property");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const logger = require("../../utils/logger");

// ── FRAUD DETECTION THRESHOLDS ────────────────────────────────────────────────
const FRAUD_THRESHOLDS = {
  autoFlag: 50, // Flag for admin review
  autoReject: 85, // Auto-reject listing
  notifyAdmin: 40, // Notify admin of suspicious listing
};

// ── PRICE RANGES FOR ETHIOPIAN MARKET ─────────────────────────────────────────
// Approximate monthly rent ranges by sub-city and property type
const MARKET_PRICE_RANGES = {
  Bole: {
    studio: { min: 8000, max: 35000 },
    apartment: { min: 15000, max: 80000 },
    villa: { min: 40000, max: 200000 },
    house: { min: 20000, max: 100000 },
  },
  Kirkos: {
    studio: { min: 6000, max: 25000 },
    apartment: { min: 10000, max: 50000 },
    villa: { min: 30000, max: 150000 },
    house: { min: 15000, max: 80000 },
  },
  Yeka: {
    studio: { min: 5000, max: 20000 },
    apartment: { min: 8000, max: 40000 },
    villa: { min: 25000, max: 120000 },
    house: { min: 12000, max: 60000 },
  },
  default: {
    studio: { min: 3000, max: 20000 },
    apartment: { min: 5000, max: 50000 },
    villa: { min: 15000, max: 150000 },
    house: { min: 8000, max: 70000 },
  },
};

// ── RULE-BASED FRAUD CHECKS ───────────────────────────────────────────────────

/**
 * Run rule-based fraud checks on a property listing.
 * Fast pre-screening before AI analysis.
 *
 * @param {Object} property - Property data to check
 * @returns {Object} - { flags, score }
 */
const runRuleBasedChecks = (property) => {
  const flags = [];
  let score = 0;

  const {
    pricing,
    details,
    location,
    title,
    description,
    propertyType,
    images,
    amenities,
  } = property;

  // ── PRICE CHECKS ─────────────────────────────────────────────────────────
  if (pricing?.monthlyRent) {
    const subCity = location?.subCity || "default";
    const ranges = MARKET_PRICE_RANGES[subCity] || MARKET_PRICE_RANGES.default;
    const typeRanges = ranges[propertyType] || ranges.apartment;

    // Suspiciously low price
    if (pricing.monthlyRent < typeRanges.min * 0.4) {
      flags.push({
        flag: `Price (ETB ${pricing.monthlyRent.toLocaleString()}) is extremely low for ${propertyType} in ${subCity}`,
        severity: "high",
      });
      score += 30;
    } else if (pricing.monthlyRent < typeRanges.min * 0.6) {
      flags.push({
        flag: `Price seems unusually low for this area and property type`,
        severity: "medium",
      });
      score += 15;
    }

    // Suspiciously high price (possible bait-and-switch)
    if (pricing.monthlyRent > typeRanges.max * 3) {
      flags.push({
        flag: "Price is extremely high — possible error or bait-and-switch",
        severity: "low",
      });
      score += 5;
    }
  }

  // ── DESCRIPTION CHECKS ────────────────────────────────────────────────────
  if (description) {
    // Too short description
    if (description.length < 80) {
      flags.push({
        flag: "Description is very short and lacks detail",
        severity: "low",
      });
      score += 5;
    }

    // Generic/copied description patterns
    const genericPhrases = [
      "beautiful apartment",
      "nice house",
      "contact for more info",
      "serious inquiries only",
      "no time wasters",
      "best price",
      "once in a lifetime",
    ];

    const genericCount = genericPhrases.filter((phrase) =>
      description.toLowerCase().includes(phrase),
    ).length;

    if (genericCount >= 3) {
      flags.push({
        flag: "Description contains multiple generic phrases common in fake listings",
        severity: "medium",
      });
      score += 15;
    }

    // Contact info in description (against platform rules)
    const phonePattern = /(\+251|0)[79]\d{8}/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (phonePattern.test(description) || emailPattern.test(description)) {
      flags.push({
        flag: "Description contains contact information — possible off-platform transaction attempt",
        severity: "high",
      });
      score += 25;
    }

    // Suspicious payment requests
    const suspiciousTerms = [
      "advance payment",
      "send money",
      "wire transfer",
      "western union",
      "outside platform",
      "pay before viewing",
    ];
    const suspiciousCount = suspiciousTerms.filter((term) =>
      description.toLowerCase().includes(term),
    ).length;

    if (suspiciousCount > 0) {
      flags.push({
        flag: "Description contains suspicious payment-related language",
        severity: "high",
      });
      score += 30;
    }
  }

  // ── TITLE CHECKS ──────────────────────────────────────────────────────────
  if (title) {
    if (title.length < 15) {
      flags.push({ flag: "Title is very short", severity: "low" });
      score += 3;
    }

    // ALL CAPS title
    if (title === title.toUpperCase() && title.length > 10) {
      flags.push({
        flag: "Title is in ALL CAPS — common in spam listings",
        severity: "low",
      });
      score += 5;
    }

    // Excessive punctuation
    const exclamationCount = (title.match(/!/g) || []).length;
    if (exclamationCount >= 3) {
      flags.push({
        flag: "Title has excessive exclamation marks",
        severity: "low",
      });
      score += 5;
    }
  }

  // ── PROPERTY DETAILS CHECKS ───────────────────────────────────────────────
  if (details) {
    // Too many bedrooms for area
    if (details.bedrooms > 10) {
      flags.push({
        flag: `Unusually high bedroom count (${details.bedrooms})`,
        severity: "medium",
      });
      score += 15;
    }

    // Area too small for bedrooms
    if (details.area && details.bedrooms) {
      const areaPerBedroom = details.area / details.bedrooms;
      if (areaPerBedroom < 15) {
        flags.push({
          flag: `Property area (${details.area} sqm) seems too small for ${details.bedrooms} bedrooms`,
          severity: "medium",
        });
        score += 15;
      }
    }

    // Unrealistic area
    if (details.area > 2000) {
      flags.push({
        flag: `Very large area (${details.area} sqm) — verify this is accurate`,
        severity: "low",
      });
      score += 5;
    }
  }

  // ── IMAGE CHECKS ──────────────────────────────────────────────────────────
  if (!images || images.length === 0) {
    flags.push({
      flag: "No photos uploaded — legitimate listings almost always have photos",
      severity: "medium",
    });
    score += 20;
  } else if (images.length === 1) {
    flags.push({
      flag: "Only one photo — suspicious for a complete property listing",
      severity: "low",
    });
    score += 5;
  }

  return {
    flags,
    score: Math.min(100, score),
  };
};

// ── AI FRAUD ANALYSIS ─────────────────────────────────────────────────────────

/**
 * Use Claude to perform deep fraud analysis on a property listing.
 *
 * @param {Object} property - Full property data
 * @param {Object} ruleFlags - Flags from rule-based checks
 * @returns {Object} - AI fraud analysis results
 */
const runAIFraudAnalysis = async (property, ruleFlags = []) => {
  try {
    const amenitiesList = Object.entries(property.amenities || {})
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");

    const existingFlags = ruleFlags
      .map((f) => `- ${f.flag} (${f.severity})`)
      .join("\n");

    const prompt = `You are a property listing fraud detection AI for NestFind, an Ethiopian rental platform.

Analyze this property listing for potential fraud, scams, or policy violations.

LISTING DETAILS:
Title: ${property.title}
Type: ${property.propertyType}
Location: ${property.location?.address}, ${property.location?.subCity}, ${property.location?.city}
Price: ETB ${property.pricing?.monthlyRent?.toLocaleString()}/month
Security Deposit: ETB ${property.pricing?.securityDeposit?.toLocaleString() || 0}
Bedrooms: ${property.details?.bedrooms}
Bathrooms: ${property.details?.bathrooms}
Area: ${property.details?.area} sqm
Furnished: ${property.details?.furnished}
Amenities: ${amenitiesList || "None listed"}
Description: "${property.description}"
Number of Photos: ${property.images?.length || 0}

RULE-BASED FLAGS ALREADY DETECTED:
${existingFlags || "None detected by rules"}

Analyze for:
1. Price consistency with Ethiopian market (Addis Ababa context)
2. Description quality and authenticity
3. Logical consistency of details (area vs bedrooms, price vs amenities)
4. Signs of scam patterns common in Ethiopian rental market
5. Grammar/language quality as authenticity indicator
6. Amenities claimed vs price paid
7. Overall listing authenticity

Return ONLY this JSON (no other text):
{
  "additionalFlags": [
    {
      "flag": "<fraud indicator description>",
      "severity": "<low|medium|high>"
    }
  ],
  "aiScore": <0-100 fraud probability>,
  "verdict": "<legitimate|suspicious|likely_fraud|definite_fraud>",
  "confidence": <0-100>,
  "analysis": "<2-3 sentence overall fraud assessment>",
  "keyRisks": [
    "<main risk 1>",
    "<main risk 2>"
  ],
  "recommendation": "<approve|review|flag|reject>",
  "isLikelyCopied": <true|false>,
  "priceConsistency": "<fair|low|very_low|high>",
  "descriptionQuality": "<high|medium|low|suspicious>"
}

Note: Ethiopian rental market context:
- Bole is the most expensive area
- ETB 5,000-80,000/month is typical range
- Most legitimate landlords have KYC verified accounts
- Prices below ETB 5,000 for any property in Addis Ababa are suspicious`;

    const result = await aiService.sendMessage(prompt, "fraud_detection", {
      maxTokens: 800,
    });

    if (!result.success || !result.content) {
      return null;
    }

    return aiService.parseJSONResponse(result.content);
  } catch (error) {
    logger.error(`AI fraud analysis failed: ${error.message}`);
    return null;
  }
};

// ── MAIN FRAUD DETECTION FUNCTION ─────────────────────────────────────────────

/**
 * Run complete fraud detection on a property listing.
 * Combines rule-based and AI analysis.
 *
 * @param {string} propertyId - Property document ID
 * @param {string} submittedBy - Landlord user ID
 * @returns {Object} - Complete fraud analysis results
 */
const analyzePropertyForFraud = async (propertyId, submittedBy = null) => {
  const startTime = Date.now();

  try {
    // Load property
    const property = await Property.findById(propertyId)
      .populate(
        "landlord",
        "firstName lastName isKYCVerified createdAt landlordProfile",
      )
      .lean();

    if (!property) {
      return { success: false, error: "Property not found" };
    }

    // Run rule-based checks first (fast)
    const { flags: ruleFlags, score: ruleScore } = runRuleBasedChecks(property);

    // Run AI analysis
    const aiAnalysis = await runAIFraudAnalysis(property, ruleFlags);

    const responseTimeMs = Date.now() - startTime;

    // Combine scores
    const aiScore = aiAnalysis?.aiScore || 0;
    const combinedScore = Math.round(ruleScore * 0.4 + aiScore * 0.6);

    // Combine all flags
    const allFlags = [...ruleFlags, ...(aiAnalysis?.additionalFlags || [])];

    // Consider landlord KYC in final score
    let finalScore = combinedScore;
    if (property.landlord?.isKYCVerified) {
      finalScore = Math.max(0, finalScore - 15); // Reduce score for verified landlords
    }
    if (!property.landlord?.isKYCVerified) {
      finalScore = Math.min(100, finalScore + 10); // Increase score for unverified
    }

    // Determine action
    let action = "approve";
    let isFraudSuspected = false;

    if (finalScore >= FRAUD_THRESHOLDS.autoReject) {
      action = "reject";
      isFraudSuspected = true;
    } else if (finalScore >= FRAUD_THRESHOLDS.autoFlag) {
      action = "flag";
      isFraudSuspected = true;
    } else if (finalScore >= FRAUD_THRESHOLDS.notifyAdmin) {
      action = "review";
    }

    // Update property with fraud analysis results
    await Property.findByIdAndUpdate(propertyId, {
      "ai.fraudScore": finalScore,
      "ai.fraudFlags": allFlags,
      "ai.isFraudSuspected": isFraudSuspected,
      "ai.lastAIAnalysisAt": new Date(),
      ...(isFraudSuspected && {
        "moderation.isFlagged": true,
        "moderation.flaggedAt": new Date(),
        "moderation.adminNotes": `Auto-flagged by AI fraud detection. Score: ${finalScore}/100`,
      }),
      ...(action === "reject" && { status: "unlisted" }),
    });

    // Log fraud detection
    await AuditLog.log({
      actorId: null,
      actorRole: "ai",
      action: "ai_fraud_detected",
      resourceType: "Property",
      resourceId: propertyId,
      description: `Fraud analysis complete. Score: ${finalScore}/100. Action: ${action}`,
      severity: finalScore >= 70 ? "warning" : "info",
      aiContext: {
        isAIAction: true,
        aiFeature: "fraud_detection",
        tokensUsed: 0,
        modelUsed: aiService.DEFAULT_MODEL,
        responseTimeMs,
      },
    });

    // Notify admin if suspicious
    if (finalScore >= FRAUD_THRESHOLDS.notifyAdmin) {
      await Notification.createNotification({
        recipientId: null, // Will be sent to all admins
        type: "ai_fraud_alert",
        title: "AI Fraud Alert",
        message: `Property "${property.title}" scored ${finalScore}/100 on fraud detection. Action required: ${action}`,
        actionUrl: `/admin/properties/${propertyId}`,
        actionLabel: "Review Property",
        resourceType: "Property",
        resourceId: propertyId,
        priority: finalScore >= 70 ? "urgent" : "high",
        metadata: { fraudScore: finalScore, action },
      });
    }

    logger.info(
      `Fraud analysis complete: property=${propertyId}, score=${finalScore}, action=${action}, time=${responseTimeMs}ms`,
    );

    return {
      success: true,
      propertyId,
      fraudScore: finalScore,
      ruleScore,
      aiScore,
      flags: allFlags,
      totalFlags: allFlags.length,
      highSeverityFlags: allFlags.filter((f) => f.severity === "high").length,
      isFraudSuspected,
      action,
      verdict:
        aiAnalysis?.verdict || (finalScore > 50 ? "suspicious" : "legitimate"),
      confidence: aiAnalysis?.confidence || 60,
      analysis:
        aiAnalysis?.analysis ||
        `Property scored ${finalScore}/100 on fraud detection checks.`,
      keyRisks: aiAnalysis?.keyRisks || [],
      priceConsistency: aiAnalysis?.priceConsistency || "fair",
      descriptionQuality: aiAnalysis?.descriptionQuality || "medium",
      landlordVerified: property.landlord?.isKYCVerified || false,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(
      `Fraud detection failed for property ${propertyId}: ${error.message}`,
    );
    return {
      success: false,
      error: "Fraud detection failed. Property will be manually reviewed.",
    };
  }
};

/**
 * Run fraud check on a batch of properties.
 * Used for periodic re-scanning of existing listings.
 *
 * @param {Array} propertyIds - Array of property IDs to check
 * @returns {Object} - Batch results summary
 */
const batchFraudCheck = async (propertyIds) => {
  const results = {
    total: propertyIds.length,
    flagged: 0,
    rejected: 0,
    approved: 0,
    errors: 0,
  };

  for (const propertyId of propertyIds) {
    try {
      const result = await analyzePropertyForFraud(propertyId);
      if (result.success) {
        if (result.action === "reject") results.rejected++;
        else if (result.action === "flag" || result.action === "review")
          results.flagged++;
        else results.approved++;
      } else {
        results.errors++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.errors++;
      logger.error(
        `Batch fraud check error for ${propertyId}: ${error.message}`,
      );
    }
  }

  return results;
};

/**
 * Get fraud statistics for admin dashboard.
 *
 * @returns {Object} - Platform fraud statistics
 */
const getFraudStats = async () => {
  try {
    const stats = await Property.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalAnalyzed: {
            $sum: {
              $cond: [{ $gt: ["$ai.fraudScore", 0] }, 1, 0],
            },
          },
          flagged: {
            $sum: { $cond: ["$ai.isFraudSuspected", 1, 0] },
          },
          avgFraudScore: { $avg: "$ai.fraudScore" },
          highRisk: {
            $sum: {
              $cond: [{ $gte: ["$ai.fraudScore", 70] }, 1, 0],
            },
          },
          mediumRisk: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$ai.fraudScore", 40] },
                    { $lt: ["$ai.fraudScore", 70] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      success: true,
      stats: stats[0] || {
        totalAnalyzed: 0,
        flagged: 0,
        avgFraudScore: 0,
        highRisk: 0,
        mediumRisk: 0,
      },
    };
  } catch (error) {
    logger.error(`Failed to get fraud stats: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  analyzePropertyForFraud,
  batchFraudCheck,
  getFraudStats,
  runRuleBasedChecks,
  runAIFraudAnalysis,
  FRAUD_THRESHOLDS,
  MARKET_PRICE_RANGES,
};
