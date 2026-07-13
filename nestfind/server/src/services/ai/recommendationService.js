const aiService = require("./aiService");
const AIRecommendation = require("../../models/AIRecommendation");
const Property = require("../../models/Property");
const SavedProperty = require("../../models/SavedProperty");
const SavedSearch = require("../../models/SavedSearch");
const User = require("../../models/User");
const logger = require("../../utils/logger");

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MAX_PROPERTIES_TO_CONSIDER = 50;
const MAX_RECOMMENDATIONS = 10;
const RECOMMENDATION_CACHE_HOURS = 24;

// ── PREFERENCE GATHERING ──────────────────────────────────────────────────────

/**
 * Gather all preference signals for a tenant.
 * Combines explicit preferences, saved property patterns, and search history.
 *
 * @param {string} tenantId - Tenant user ID
 * @returns {Object} - Combined preference signals
 */
const gatherTenantPreferences = async (tenantId) => {
  try {
    // Get user profile with AI preferences
    const user = await User.findById(tenantId).lean();
    if (!user) throw new Error("Tenant not found");

    // Get signals from saved properties
    const savedSignals =
      await SavedProperty.getTenantPreferenceSignals(tenantId);

    // Get recent search queries
    const recentSearches = await SavedSearch.getTenantSearches(tenantId);
    const searchFilters = recentSearches.slice(0, 5).map((s) => s.filters);

    // Extract search location signals
    const searchLocations = searchFilters
      .flatMap((f) => [f.city, f.subCity])
      .filter(Boolean);

    const searchPropertyTypes = searchFilters
      .flatMap((f) => f.propertyType || [])
      .filter(Boolean);

    // Merge all signals
    const preferences = {
      // Explicit preferences from profile
      preferredCities: [
        ...(user.aiPreferences?.preferredCities || []),
        ...searchLocations,
      ].filter((v, i, a) => a.indexOf(v) === i),

      preferredSubCities: [
        ...(user.aiPreferences?.preferredSubCities || []),
        ...(savedSignals.subCities || []),
      ].filter((v, i, a) => a.indexOf(v) === i),

      preferredPropertyTypes: [
        ...(user.aiPreferences?.preferredPropertyTypes || []),
        ...(savedSignals.propertyTypes || []),
        ...searchPropertyTypes,
      ].filter((v, i, a) => a.indexOf(v) === i),

      preferredAmenities: [
        ...(user.aiPreferences?.preferredAmenities || []),
        ...Object.entries(savedSignals.commonAmenities || {})
          .filter(([, count]) => count >= 2)
          .map(([amenity]) => amenity),
      ].filter((v, i, a) => a.indexOf(v) === i),

      budgetMin: Math.min(
        user.aiPreferences?.budgetMin || 0,
        savedSignals.minPrice || Infinity,
      ),
      budgetMax: Math.max(
        user.aiPreferences?.budgetMax || 0,
        savedSignals.maxPrice || 0,
      ),

      preferredBedrooms: user.aiPreferences?.preferredBedrooms || null,
      minBedrooms: savedSignals.minBedrooms || 0,
      maxBedrooms: savedSignals.maxBedrooms || 10,

      // AI tags from saved properties
      aiTags: savedSignals.aiTags || [],
    };

    return { user, preferences, savedSignals };
  } catch (error) {
    logger.error(`Failed to gather tenant preferences: ${error.message}`);
    throw error;
  }
};

// ── CANDIDATE PROPERTY FETCHING ───────────────────────────────────────────────

/**
 * Fetch candidate properties that match basic tenant criteria.
 * Pre-filters before AI scoring to reduce API calls.
 *
 * @param {Object} preferences - Tenant preferences
 * @param {string} tenantId - To exclude already saved/viewed properties
 * @returns {Array} - Array of candidate properties
 */
const fetchCandidateProperties = async (preferences, tenantId) => {
  try {
    // Build base query
    const query = {
      status: "active",
      isOccupied: false,
      isDeleted: false,
      "ai.isFraudSuspected": { $ne: true },
    };

    // Location filter
    if (preferences.preferredCities?.length > 0) {
      query["location.city"] = {
        $in: preferences.preferredCities.map((c) => new RegExp(c, "i")),
      };
    }

    // Sub-city filter (if specified)
    if (preferences.preferredSubCities?.length > 0) {
      query["location.subCity"] = {
        $in: preferences.preferredSubCities.map((s) => new RegExp(s, "i")),
      };
    }

    // Property type filter
    if (preferences.preferredPropertyTypes?.length > 0) {
      query.propertyType = { $in: preferences.preferredPropertyTypes };
    }

    // Budget filter (with 20% flexibility)
    if (preferences.budgetMax > 0) {
      query["pricing.monthlyRent"] = {
        $lte: preferences.budgetMax * 1.2,
      };
    }
    if (preferences.budgetMin > 0) {
      query["pricing.monthlyRent"] = {
        ...query["pricing.monthlyRent"],
        $gte: preferences.budgetMin * 0.8,
      };
    }

    // Bedrooms filter
    if (preferences.minBedrooms > 0) {
      query["details.bedrooms"] = { $gte: preferences.minBedrooms };
    }
    if (preferences.maxBedrooms < 10) {
      query["details.bedrooms"] = {
        ...query["details.bedrooms"],
        $lte: preferences.maxBedrooms,
      };
    }

    // Get already saved properties to exclude
    const savedPropertyIds = await SavedProperty.find(
      { tenant: tenantId },
      { property: 1 },
    ).lean();
    const excludeIds = savedPropertyIds.map((s) => s.property);

    if (excludeIds.length > 0) {
      query._id = { $nin: excludeIds };
    }

    // Fetch candidates — sorted by rating and recency
    const candidates = await Property.find(query)
      .populate(
        "landlord",
        "firstName lastName avatar landlordProfile isKYCVerified",
      )
      .sort({ "stats.averageRating": -1, createdAt: -1 })
      .limit(MAX_PROPERTIES_TO_CONSIDER)
      .lean();

    // If no candidates with filters, fetch without location filter
    if (candidates.length < 5) {
      const fallbackQuery = {
        status: "active",
        isOccupied: false,
        isDeleted: false,
        "ai.isFraudSuspected": { $ne: true },
        _id: { $nin: excludeIds },
      };

      const fallback = await Property.find(fallbackQuery)
        .populate(
          "landlord",
          "firstName lastName avatar landlordProfile isKYCVerified",
        )
        .sort({ "stats.averageRating": -1, isFeatured: -1 })
        .limit(MAX_PROPERTIES_TO_CONSIDER)
        .lean();

      return fallback;
    }

    return candidates;
  } catch (error) {
    logger.error(`Failed to fetch candidate properties: ${error.message}`);
    return [];
  }
};

// ── AI SCORING ────────────────────────────────────────────────────────────────

/**
 * Use Claude to score and rank properties for a tenant.
 * Generates personalized match scores and explanations.
 *
 * @param {Array} properties - Candidate properties
 * @param {Object} preferences - Tenant preferences
 * @param {Object} user - Tenant user document
 * @returns {Array} - Scored and ranked recommendations
 */
const scorePropertiesWithAI = async (properties, preferences, user) => {
  if (!properties || properties.length === 0) return [];

  try {
    // Build tenant context
    const tenantContext = aiService.buildTenantContext(user, {
      subCities: preferences.preferredSubCities,
      propertyTypes: preferences.preferredPropertyTypes,
    });

    // Build properties summary for AI
    const propertiesSummary = properties
      .slice(0, 20) // Limit to top 20 for token efficiency
      .map(
        (p, index) => `
Property ${index + 1} (ID: ${p._id}):
- Type: ${p.propertyType}
- Location: ${p.location?.subCity}, ${p.location?.city}
- Bedrooms: ${p.details?.bedrooms}
- Rent: ETB ${p.pricing?.monthlyRent?.toLocaleString()}
- Rating: ${p.stats?.averageRating || 0}/5
- Amenities: ${
          Object.entries(p.amenities || {})
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ") || "None"
        }
- Furnished: ${p.details?.furnished}
- Featured: ${p.isFeatured ? "Yes" : "No"}
- Verified: ${p.isVerified ? "Yes" : "No"}
`,
      )
      .join("\n");

    const prompt = `You are a property recommendation AI for NestFind, an Ethiopian rental platform.

${tenantContext}

Available Properties to Score:
${propertiesSummary}

Task: Score each property for this specific tenant based on how well it matches their preferences and needs.

Return ONLY a JSON array with this exact structure (no other text):
[
  {
    "propertyId": "<ID from above>",
    "matchScore": <0-100>,
    "scoreBreakdown": {
      "locationScore": <0-100>,
      "priceScore": <0-100>,
      "bedroomsScore": <0-100>,
      "amenitiesScore": <0-100>,
      "ratingScore": <0-100>
    },
    "matchReasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
    "category": "<best_match|budget_friendly|top_rated|newly_listed|similar_to_saved|popular_in_area|ai_pick>"
  }
]

Scoring rules:
- matchScore 90-100: Almost perfect match for all preferences
- matchScore 70-89: Good match for most preferences  
- matchScore 50-69: Decent match, some compromises needed
- matchScore below 50: Poor match, include only if few options

Keep matchReasons SHORT and SPECIFIC (max 10 words each).
Focus on Ethiopian rental market context.`;

    const result = await aiService.sendMessage(
      prompt,
      "property_recommendation",
      { maxTokens: 2000 },
    );

    if (!result.success || !result.content) {
      logger.warn("AI scoring failed, falling back to rule-based scoring");
      return scorePropertiesRuleBased(properties, preferences);
    }

    const scoredData = aiService.parseJSONResponse(result.content);

    if (!scoredData || !Array.isArray(scoredData)) {
      logger.warn(
        "AI returned invalid JSON, falling back to rule-based scoring",
      );
      return scorePropertiesRuleBased(properties, preferences);
    }

    // Map AI scores back to full property objects
    const scoredProperties = scoredData
      .map((scored, rank) => {
        const property = properties.find(
          (p) => p._id.toString() === scored.propertyId,
        );
        if (!property) return null;

        return {
          property: property._id,
          matchScore: Math.min(100, Math.max(0, scored.matchScore || 0)),
          scoreBreakdown: scored.scoreBreakdown || {},
          matchReasons: scored.matchReasons || [],
          rank: rank + 1,
          category: scored.category || "best_match",
          interaction: {
            wasViewed: false,
            wasSaved: false,
            wasBooked: false,
            wasClicked: false,
            wasSkipped: false,
          },
          _propertyData: property, // Keep full data for response
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_RECOMMENDATIONS);

    return { scoredProperties, tokensUsed: result.tokensUsed };
  } catch (error) {
    logger.error(`AI scoring error: ${error.message}`);
    return {
      scoredProperties: scorePropertiesRuleBased(properties, preferences),
      tokensUsed: 0,
    };
  }
};

/**
 * Rule-based fallback scoring when AI is unavailable.
 * Uses simple weighted scoring based on preference matches.
 *
 * @param {Array} properties - Candidate properties
 * @param {Object} preferences - Tenant preferences
 * @returns {Array} - Scored recommendations
 */
const scorePropertiesRuleBased = (properties, preferences) => {
  return properties
    .map((property, index) => {
      let score = 50; // Base score
      const reasons = [];

      // Location score
      const inPreferredSubCity = preferences.preferredSubCities?.some((sc) =>
        property.location?.subCity?.toLowerCase().includes(sc.toLowerCase()),
      );
      if (inPreferredSubCity) {
        score += 20;
        reasons.push(`Located in ${property.location?.subCity}`);
      }

      // Price score
      const rent = property.pricing?.monthlyRent || 0;
      if (preferences.budgetMax > 0 && rent <= preferences.budgetMax) {
        score += 15;
        reasons.push(`Within your budget at ETB ${rent.toLocaleString()}`);
      }

      // Bedroom score
      if (
        preferences.preferredBedrooms &&
        property.details?.bedrooms === preferences.preferredBedrooms
      ) {
        score += 10;
        reasons.push(`${property.details?.bedrooms} bedroom match`);
      }

      // Rating score
      if (property.stats?.averageRating >= 4) {
        score += 10;
        reasons.push(`Highly rated at ${property.stats?.averageRating}/5`);
      }

      // Amenities score
      const matchedAmenities = preferences.preferredAmenities?.filter(
        (a) => property.amenities?.[a] === true,
      );
      if (matchedAmenities?.length > 0) {
        score += Math.min(10, matchedAmenities.length * 3);
        reasons.push(`Has ${matchedAmenities.join(", ")}`);
      }

      // Featured/verified bonus
      if (property.isFeatured) score += 5;
      if (property.isVerified) score += 5;

      return {
        property: property._id,
        matchScore: Math.min(100, score),
        scoreBreakdown: {
          locationScore: inPreferredSubCity ? 80 : 40,
          priceScore: rent <= (preferences.budgetMax || Infinity) ? 80 : 40,
          bedroomsScore: 60,
          amenitiesScore: 60,
          ratingScore: (property.stats?.averageRating || 0) * 20,
        },
        matchReasons: reasons.length > 0 ? reasons : ["Good overall match"],
        rank: index + 1,
        category: property.isFeatured ? "ai_pick" : "best_match",
        interaction: {
          wasViewed: false,
          wasSaved: false,
          wasBooked: false,
          wasClicked: false,
          wasSkipped: false,
        },
        _propertyData: property,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_RECOMMENDATIONS);
};

// ── MAIN RECOMMENDATION FUNCTION ──────────────────────────────────────────────

/**
 * Generate AI property recommendations for a tenant.
 * Main entry point called from the controller.
 *
 * @param {string} tenantId - Tenant user ID
 * @param {Object} options - Options (forceRefresh, trigger)
 * @returns {Object} - { recommendations, batchId, isFromCache }
 */
const generateRecommendations = async (tenantId, options = {}) => {
  const startTime = Date.now();

  try {
    // Check cache first unless force refresh requested
    if (!options.forceRefresh) {
      const cached = await AIRecommendation.getActiveForTenant(tenantId);
      if (cached && cached.recommendations.length > 0) {
        logger.info(`Returning cached recommendations for tenant ${tenantId}`);
        return {
          success: true,
          recommendations: cached.recommendations,
          batchId: cached.batchId,
          isFromCache: true,
          generatedAt: cached.createdAt,
        };
      }
    }

    // Expire old recommendations
    await AIRecommendation.expireOldRecommendations(tenantId);

    // Gather tenant preferences
    const { user, preferences } = await gatherTenantPreferences(tenantId);

    // Fetch candidate properties
    const candidates = await fetchCandidateProperties(preferences, tenantId);

    if (candidates.length === 0) {
      logger.info(`No candidate properties found for tenant ${tenantId}`);
      return {
        success: true,
        recommendations: [],
        batchId: null,
        isFromCache: false,
        message:
          "No properties match your preferences yet. Try adjusting your preferences.",
      };
    }

    // Score with AI
    const { scoredProperties, tokensUsed } = await scorePropertiesWithAI(
      candidates,
      preferences,
      user,
    );

    if (!scoredProperties || scoredProperties.length === 0) {
      return {
        success: false,
        error: "Could not generate recommendations at this time",
      };
    }

    const generationTimeMs = Date.now() - startTime;

    // Save recommendations to database
    const recommendationRecord = await AIRecommendation.create({
      tenant: tenantId,
      recommendations: scoredProperties.map(({ _propertyData, ...rec }) => rec),
      preferencesUsed: {
        preferredCities: preferences.preferredCities,
        preferredSubCities: preferences.preferredSubCities,
        preferredPropertyTypes: preferences.preferredPropertyTypes,
        preferredAmenities: preferences.preferredAmenities,
        budgetMin: preferences.budgetMin,
        budgetMax: preferences.budgetMax,
        preferredBedrooms: preferences.preferredBedrooms,
      },
      generationMethod: "ai_claude",
      aiModel: aiService.DEFAULT_MODEL,
      tokensUsed: tokensUsed || 0,
      generationTimeMs,
      totalPropertiesConsidered: candidates.length,
      trigger: options.trigger || "manual_refresh",
      expiresAt: new Date(
        Date.now() + RECOMMENDATION_CACHE_HOURS * 60 * 60 * 1000,
      ),
    });

    // Attach full property data for response
    const recommendationsWithData = scoredProperties.map((rec) => ({
      ...rec,
      property: rec._propertyData,
    }));

    // Log AI usage
    await aiService.logAIUsage({
      userId: tenantId,
      feature: "property_recommendation",
      action: "ai_recommendation_generated",
      tokensUsed: tokensUsed || 0,
      responseTimeMs: generationTimeMs,
      success: true,
    });

    logger.info(
      `Generated ${scoredProperties.length} recommendations for tenant ${tenantId} in ${generationTimeMs}ms`,
    );

    return {
      success: true,
      recommendations: recommendationsWithData,
      batchId: recommendationRecord.batchId,
      isFromCache: false,
      generatedAt: recommendationRecord.createdAt,
      totalConsidered: candidates.length,
    };
  } catch (error) {
    logger.error(`Recommendation generation failed: ${error.message}`);
    return {
      success: false,
      error: "Failed to generate recommendations. Please try again.",
    };
  }
};

/**
 * Record tenant interaction with a recommendation.
 * Used to improve future recommendations and track performance.
 *
 * @param {string} tenantId - Tenant user ID
 * @param {string} propertyId - Property that was interacted with
 * @param {string} interactionType - Type of interaction
 */
const recordInteraction = async (tenantId, propertyId, interactionType) => {
  try {
    const recommendation = await AIRecommendation.findOne({
      tenant: tenantId,
      status: "active",
    });

    if (recommendation) {
      await recommendation.recordInteraction(propertyId, interactionType);
    }
  } catch (error) {
    logger.error(
      `Failed to record recommendation interaction: ${error.message}`,
    );
  }
};

/**
 * Get recommendation performance statistics.
 * Used by admin dashboard to monitor AI recommendation quality.
 *
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Object} - Performance statistics
 */
const getPerformanceStats = async (dateRange = {}) => {
  try {
    const stats = await AIRecommendation.getPerformanceStats(
      dateRange.startDate,
      dateRange.endDate,
    );
    return { success: true, stats: stats[0] || {} };
  } catch (error) {
    logger.error(`Failed to get recommendation stats: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateRecommendations,
  recordInteraction,
  getPerformanceStats,
  gatherTenantPreferences,
  fetchCandidateProperties,
  scorePropertiesWithAI,
  scorePropertiesRuleBased,
};
