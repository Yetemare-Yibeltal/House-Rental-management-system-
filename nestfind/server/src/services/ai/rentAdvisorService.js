// nestfind/nestfind/server/src/services/ai/rentAdvisorService.js

const aiService = require('./aiService');
const Property = require('../../models/Property');
const logger = require('../../utils/logger');

// ── MARKET DATA FETCHER ───────────────────────────────────────────────────────

/**
 * Fetch comparable properties from the database.
 * Used to provide real market data to the AI.
 *
 * @param {Object} propertyDetails - Details of the property being priced
 * @returns {Array} - Similar active properties with their rent prices
 */
const fetchComparableProperties = async (propertyDetails) => {
  try {
    const {
      subCity,
      city = 'Addis Ababa',
      propertyType,
      bedrooms,
      furnished,
    } = propertyDetails;

    // Build query for similar properties
    const query = {
      status: 'active',
      isOccupied: false,
      isDeleted: false,
    };

    // Match by sub-city if provided
    if (subCity) {
      query['location.subCity'] = { $regex: subCity, $options: 'i' };
    } else if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Match by property type
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Match by bedroom count with ±1 flexibility
    if (bedrooms !== undefined && bedrooms !== null) {
      query['details.bedrooms'] = {
        $gte: Math.max(0, bedrooms - 1),
        $lte: bedrooms + 1,
      };
    }

    // Fetch comparable properties
    const comparables = await Property.find(query)
      .select(
        'title location details pricing amenities stats isFeatured isVerified createdAt'
      )
      .sort({ 'stats.averageRating': -1 })
      .limit(15)
      .lean();

    return comparables;
  } catch (error) {
    logger.error(`Failed to fetch comparable properties: ${error.message}`);
    return [];
  }
};

/**
 * Calculate basic market statistics from comparable properties.
 *
 * @param {Array} comparables - Array of comparable properties
 * @returns {Object} - Market statistics
 */
const calculateMarketStats = (comparables) => {
  if (!comparables || comparables.length === 0) {
    return {
      avgRent: null,
      minRent: null,
      maxRent: null,
      medianRent: null,
      count: 0,
    };
  }

  const rents = comparables
    .map((p) => p.pricing?.monthlyRent)
    .filter((r) => r && r > 0)
    .sort((a, b) => a - b);

  if (rents.length === 0) return { avgRent: null, minRent: null, maxRent: null, medianRent: null, count: 0 };

  const avg = rents.reduce((sum, r) => sum + r, 0) / rents.length;
  const median = rents[Math.floor(rents.length / 2)];

  return {
    avgRent: Math.round(avg),
    minRent: rents[0],
    maxRent: rents[rents.length - 1],
    medianRent: median,
    count: rents.length,
  };
};

// ── MAIN RENT ADVISOR FUNCTION ────────────────────────────────────────────────

/**
 * Generate AI rent price recommendation for a property.
 *
 * @param {Object} propertyDetails - Property information
 * @param {string} landlordId - Landlord user ID
 * @returns {Object} - { suggestedMin, suggestedMax, reasoning, marketData }
 */
const getRentAdvice = async (propertyDetails, landlordId = null) => {
  const startTime = Date.now();

  try {
    const {
      title,
      propertyType,
      subCity,
      city = 'Addis Ababa',
      address,
      bedrooms,
      bathrooms,
      area,
      furnished,
      amenities = {},
      yearBuilt,
      floorNumber,
      description,
      currentRent,
    } = propertyDetails;

    // Fetch comparable properties from database
    const comparables = await fetchComparableProperties(propertyDetails);
    const marketStats = calculateMarketStats(comparables);

    // Build comparables summary for AI
    const comparablesSummary = comparables.slice(0, 8).map((p) => `
- ${p.details?.bedrooms}BR ${p.propertyType} in ${p.location?.subCity}: ETB ${p.pricing?.monthlyRent?.toLocaleString()}/mo
  Area: ${p.details?.area}sqm, Furnished: ${p.details?.furnished}, Rating: ${p.stats?.averageRating || 'N/A'}/5
  Amenities: ${Object.entries(p.amenities || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'None'}
`).join('');

    // Build amenities list
    const amenitiesList = Object.entries(amenities)
      .filter(([, val]) => val === true)
      .map(([key]) => key)
      .join(', ');

    const prompt = `You are a rental price expert for the Ethiopian market. Analyze this property and suggest an optimal rent price.

PROPERTY DETAILS:
- Type: ${propertyType || 'Not specified'}
- Location: ${address || ''}, ${subCity || ''}, ${city}
- Bedrooms: ${bedrooms || 'Not specified'}
- Bathrooms: ${bathrooms || 'Not specified'}
- Area: ${area || 'Not specified'} sqm
- Furnished: ${furnished || 'Not specified'}
- Year Built: ${yearBuilt || 'Not specified'}
- Floor: ${floorNumber || 'Ground/Not specified'}
- Amenities: ${amenitiesList || 'None listed'}
- Description: ${description ? description.substring(0, 200) : 'Not provided'}
${currentRent ? `- Current Asking Rent: ETB ${currentRent.toLocaleString()}` : ''}

MARKET DATA (similar properties in same area):
${comparables.length > 0 ? comparablesSummary : 'No comparable properties found in database'}

MARKET STATISTICS:
- Average Rent in Area: ETB ${marketStats.avgRent?.toLocaleString() || 'Unknown'}
- Median Rent in Area: ETB ${marketStats.medianRent?.toLocaleString() || 'Unknown'}
- Price Range: ETB ${marketStats.minRent?.toLocaleString() || 'Unknown'} - ETB ${marketStats.maxRent?.toLocaleString() || 'Unknown'}
- Comparable Listings Count: ${marketStats.count}

Return ONLY this JSON (no other text):
{
  "suggestedMinRent": <number in ETB>,
  "suggestedMaxRent": <number in ETB>,
  "recommendedRent": <number in ETB - the sweet spot>,
  "confidence": <0-100>,
  "pricingStrategy": "<competitive|premium|budget>",
  "reasoning": "<3-4 sentences explaining the recommendation>",
  "keyFactors": [
    "<factor 1 affecting price>",
    "<factor 2 affecting price>",
    "<factor 3 affecting price>"
  ],
  "improvements": [
    "<suggestion to increase value 1>",
    "<suggestion to increase value 2>"
  ],
  "marketInsight": "<1-2 sentences about current market in this area>",
  "warningIfTooHigh": "<warning message if current rent seems too high, or null>",
  "warningIfTooLow": "<warning message if current rent seems too low, or null>"
}

Important:
- All prices must be in ETB
- Be realistic for the Ethiopian rental market
- Consider the specific sub-city's prestige and demand
- Bole and Kirkos command premium prices
- Consider furnished properties get 20-40% premium`;

    const result = await aiService.sendMessage(
      prompt,
      'rent_advisor',
      { maxTokens: 1000 }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!result.success || !result.content) {
      // Return rule-based estimate if AI fails
      return {
        success: true,
        isAIGenerated: false,
        suggestedMinRent: marketStats.avgRent
          ? Math.round(marketStats.avgRent * 0.9)
          : null,
        suggestedMaxRent: marketStats.avgRent
          ? Math.round(marketStats.avgRent * 1.1)
          : null,
        recommendedRent: marketStats.avgRent || null,
        confidence: 40,
        reasoning: `Based on ${marketStats.count} similar properties in ${subCity || city}, average rent is ETB ${marketStats.avgRent?.toLocaleString() || 'unknown'}.`,
        marketData: marketStats,
        comparablesCount: comparables.length,
      };
    }

    const advice = aiService.parseJSONResponse(result.content);

    if (!advice) {
      return {
        success: false,
        error: 'Could not parse AI rent advice',
        marketData: marketStats,
      };
    }

    // Log AI usage
    if (landlordId) {
      await aiService.logAIUsage({
        userId: landlordId,
        feature: 'rent_advisor',
        action: 'ai_rent_advised',
        tokensUsed: result.tokensUsed,
        responseTimeMs,
        success: true,
      });
    }

    return {
      success: true,
      isAIGenerated: true,
      suggestedMinRent: advice.suggestedMinRent,
      suggestedMaxRent: advice.suggestedMaxRent,
      recommendedRent: advice.recommendedRent,
      confidence: advice.confidence || 70,
      pricingStrategy: advice.pricingStrategy || 'competitive',
      reasoning: advice.reasoning,
      keyFactors: advice.keyFactors || [],
      improvements: advice.improvements || [],
      marketInsight: advice.marketInsight,
      warningIfTooHigh: advice.warningIfTooHigh || null,
      warningIfTooLow: advice.warningIfTooLow || null,
      marketData: marketStats,
      comparablesCount: comparables.length,
      tokensUsed: result.tokensUsed,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(`Rent advisor failed: ${error.message}`);
    return {
      success: false,
      error: 'Could not generate rent advice at this time. Please try again.',
    };
  }
};

/**
 * Get a quick rent estimate without full AI analysis.
 * Used for real-time feedback as landlord fills in property form.
 *
 * @param {Object} basicDetails - { subCity, propertyType, bedrooms, furnished }
 * @returns {Object} - { estimatedMin, estimatedMax }
 */
const getQuickEstimate = async (basicDetails) => {
  try {
    const comparables = await fetchComparableProperties(basicDetails);
    const stats = calculateMarketStats(comparables);

    if (stats.count === 0) {
      return {
        success: false,
        message: 'Not enough data for this area yet',
      };
    }

    // Apply furnished premium
    let multiplier = 1;
    if (basicDetails.furnished === 'fully_furnished') multiplier = 1.3;
    if (basicDetails.furnished === 'semi_furnished') multiplier = 1.15;

    return {
      success: true,
      estimatedMin: Math.round(stats.avgRent * 0.85 * multiplier),
      estimatedMax: Math.round(stats.avgRent * 1.15 * multiplier),
      basedOn: stats.count,
      currency: 'ETB',
    };
  } catch (error) {
    logger.error(`Quick estimate failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Analyze a landlord's entire portfolio for pricing optimization.
 * Shows which properties are overpriced or underpriced vs market.
 *
 * @param {string} landlordId - Landlord user ID
 * @returns {Object} - Portfolio pricing analysis
 */
const analyzePortfolioPricing = async (landlordId) => {
  try {
    const properties = await Property.find({
      landlord: landlordId,
      status: { $in: ['active', 'inactive'] },
      isDeleted: false,
    }).lean();

    if (properties.length === 0) {
      return {
        success: true,
        message: 'No properties found in portfolio',
        analysis: [],
      };
    }

    const analysis = await Promise.all(
      properties.map(async (property) => {
        const comparables = await fetchComparableProperties({
          subCity: property.location?.subCity,
          propertyType: property.propertyType,
          bedrooms: property.details?.bedrooms,
          furnished: property.details?.furnished,
        });

        const stats = calculateMarketStats(comparables);
        const currentRent = property.pricing?.monthlyRent;

        let pricingStatus = 'fair';
        let suggestion = null;

        if (stats.avgRent) {
          const deviation = ((currentRent - stats.avgRent) / stats.avgRent) * 100;
          if (deviation > 20) {
            pricingStatus = 'overpriced';
            suggestion = `Consider reducing by ETB ${Math.round(currentRent - stats.avgRent * 1.1).toLocaleString()} to attract more tenants`;
          } else if (deviation < -20) {
            pricingStatus = 'underpriced';
            suggestion = `You could increase by ETB ${Math.round(stats.avgRent * 0.9 - currentRent).toLocaleString()} and still be competitive`;
          }
        }

        return {
          propertyId: property._id,
          title: property.title,
          currentRent,
          marketAvg: stats.avgRent,
          pricingStatus,
          suggestion,
          comparablesFound: stats.count,
        };
      })
    );

    return {
      success: true,
      analysis,
      summary: {
        total: analysis.length,
        overpriced: analysis.filter((a) => a.pricingStatus === 'overpriced').length,
        underpriced: analysis.filter((a) => a.pricingStatus === 'underpriced').length,
        fair: analysis.filter((a) => a.pricingStatus === 'fair').length,
      },
    };
  } catch (error) {
    logger.error(`Portfolio pricing analysis failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getRentAdvice,
  getQuickEstimate,
  analyzePortfolioPricing,
  fetchComparableProperties,
  calculateMarketStats,
};