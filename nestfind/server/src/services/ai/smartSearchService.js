const aiService = require("./aiService");
const Property = require("../../models/Property");
const SavedSearch = require("../../models/SavedSearch");
const logger = require("../../utils/logger");

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MAX_SEARCH_RESULTS = 20;
const SEARCH_RESULTS_PER_PAGE = 12;

// ── ETHIOPIAN LOCATION MAPPINGS ───────────────────────────────────────────────
/**
 * Common Ethiopian location aliases and shortcuts.
 * Helps the AI understand informal location references.
 */
const LOCATION_ALIASES = {
  // Addis Ababa sub-cities
  bole: "Bole",
  CMC: "Bole",
  "airport area": "Bole",
  kirkos: "Kirkos",
  kazanchis: "Kirkos",
  piazza: "Arada",
  arada: "Arada",
  merkato: "Arada",
  yeka: "Yeka",
  entoto: "Yeka",
  lideta: "Lideta",
  gulele: "Gulele",
  kolfe: "Kolfe Keranyo",
  "nifas silk": "Nifas Silk-Lafto",
  akaky: "Akaky Kaliti",
  lemi: "Lemi Kura",
  megenagna: "Yeka",
  sarbet: "Nifas Silk-Lafto",
  summit: "Bole",
  imperial: "Kirkos",
  Mexico: "Kirkos",
  gofa: "Nifas Silk-Lafto",
};

/**
 * Property type aliases for natural language.
 */
const PROPERTY_TYPE_ALIASES = {
  apartment: "apartment",
  flat: "apartment",
  condo: "apartment",
  condominium: "apartment",
  villa: "villa",
  house: "house",
  home: "house",
  studio: "studio",
  "studio apartment": "studio",
  bedsitter: "studio",
  room: "studio",
  duplex: "duplex",
  commercial: "commercial",
  office: "commercial",
  shop: "commercial",
  penthouse: "penthouse",
};

// ── AI QUERY PARSING ──────────────────────────────────────────────────────────

/**
 * Use Claude to parse a natural language search query into structured filters.
 *
 * @param {string} naturalQuery - Raw natural language query
 * @returns {Object} - { filters, interpretation, confidence }
 */
const parseNaturalLanguageQuery = async (naturalQuery) => {
  const prompt = `Parse this Ethiopian rental property search query into structured JSON filters.

Query: "${naturalQuery}"

Ethiopian context:
- Currency is ETB (Ethiopian Birr). "k" means 1000 ETB (e.g. "30k" = 30,000 ETB)
- Common areas: Bole, Kirkos, Yeka, Arada, Lideta, Gulele, Kolfe, Nifas Silk, Akaky, Lemi
- Property types: apartment, villa, house, studio, duplex, commercial, penthouse
- "bedsitter" or "single room" means studio
- "furnished" means fully furnished unless specified otherwise

Return ONLY this JSON structure with no other text:
{
  "filters": {
    "keyword": null,
    "city": "Addis Ababa",
    "subCity": null,
    "propertyType": [],
    "minPrice": null,
    "maxPrice": null,
    "minBedrooms": null,
    "maxBedrooms": null,
    "minBathrooms": null,
    "furnished": null,
    "amenities": [],
    "minArea": null,
    "maxArea": null,
    "sortBy": "newest"
  },
  "interpretation": "Short sentence explaining what was searched for",
  "confidence": 85,
  "extractedEntities": {
    "locations": [],
    "priceRange": {"min": null, "max": null},
    "propertyFeatures": [],
    "amenities": [],
    "timeframe": null
  },
  "suggestions": []
}

Rules:
- furnished options: "fully_furnished", "semi_furnished", "unfurnished", null
- amenities can include: wifi, parking, pool, gym, generator, security24h, cctv, elevator, balcony, airConditioning, petFriendly
- sortBy options: "newest", "price_low", "price_high", "rating", "most_viewed"
- confidence: 0-100 (how confident the AI is in the interpretation)
- suggestions: 2-3 alternative search refinements if query is ambiguous
- If price is mentioned as "k" multiply by 1000
- Extract bedroom count from "2 bed", "2 bedroom", "2BR", "2 rooms" etc.`;

  const result = await aiService.sendMessage(prompt, "smart_search", {
    maxTokens: 800,
  });

  if (!result.success || !result.content) {
    logger.warn("AI query parsing failed, using basic extraction");
    return {
      filters: extractBasicFilters(naturalQuery),
      interpretation: `Searching for: ${naturalQuery}`,
      confidence: 40,
      extractedEntities: {},
      suggestions: [],
    };
  }

  const parsed = aiService.parseJSONResponse(result.content);

  if (!parsed || !parsed.filters) {
    return {
      filters: extractBasicFilters(naturalQuery),
      interpretation: `Searching for: ${naturalQuery}`,
      confidence: 40,
      extractedEntities: {},
      suggestions: [],
    };
  }

  // Apply location aliases
  if (parsed.filters.subCity) {
    const alias = LOCATION_ALIASES[parsed.filters.subCity.toLowerCase()];
    if (alias) parsed.filters.subCity = alias;
  }

  // Apply property type aliases
  if (parsed.filters.propertyType?.length > 0) {
    parsed.filters.propertyType = parsed.filters.propertyType
      .map((type) => PROPERTY_TYPE_ALIASES[type.toLowerCase()] || type)
      .filter(Boolean);
  }

  return {
    filters: parsed.filters,
    interpretation: parsed.interpretation || `Searching for: ${naturalQuery}`,
    confidence: parsed.confidence || 70,
    extractedEntities: parsed.extractedEntities || {},
    suggestions: parsed.suggestions || [],
    tokensUsed: result.tokensUsed,
  };
};

/**
 * Basic regex-based filter extraction as fallback.
 * Used when AI is unavailable.
 *
 * @param {string} query - Natural language query
 * @returns {Object} - Basic extracted filters
 */
const extractBasicFilters = (query) => {
  const filters = {
    keyword: null,
    city: "Addis Ababa",
    subCity: null,
    propertyType: [],
    minPrice: null,
    maxPrice: null,
    minBedrooms: null,
    maxBedrooms: null,
    furnished: null,
    amenities: [],
    sortBy: "newest",
  };

  const lowerQuery = query.toLowerCase();

  // Extract price (e.g. "under 30k", "30,000", "between 20k and 40k")
  const maxPriceMatch = lowerQuery.match(/under\s+(\d+(?:\.\d+)?)\s*k/);
  if (maxPriceMatch) {
    filters.maxPrice = parseFloat(maxPriceMatch[1]) * 1000;
  }

  const priceMatch = lowerQuery.match(/(\d+(?:,\d+)?)\s*etb/);
  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[1].replace(",", ""));
  }

  // Extract bedrooms (e.g. "3 bedroom", "2 bed", "3BR")
  const bedroomMatch = lowerQuery.match(/(\d+)\s*(?:bed(?:room)?s?|br)/);
  if (bedroomMatch) {
    filters.minBedrooms = parseInt(bedroomMatch[1]);
    filters.maxBedrooms = parseInt(bedroomMatch[1]);
  }

  // Extract sub-city
  for (const [alias, name] of Object.entries(LOCATION_ALIASES)) {
    if (lowerQuery.includes(alias.toLowerCase())) {
      filters.subCity = name;
      break;
    }
  }

  // Extract property type
  for (const [alias, type] of Object.entries(PROPERTY_TYPE_ALIASES)) {
    if (lowerQuery.includes(alias.toLowerCase())) {
      if (!filters.propertyType.includes(type)) {
        filters.propertyType.push(type);
      }
    }
  }

  // Extract amenities
  if (lowerQuery.includes("parking")) filters.amenities.push("parking");
  if (lowerQuery.includes("wifi") || lowerQuery.includes("internet"))
    filters.amenities.push("wifi");
  if (lowerQuery.includes("pool")) filters.amenities.push("pool");
  if (lowerQuery.includes("gym")) filters.amenities.push("gym");
  if (lowerQuery.includes("generator")) filters.amenities.push("generator");
  if (lowerQuery.includes("furnished")) filters.furnished = "fully_furnished";
  if (lowerQuery.includes("unfurnished")) filters.furnished = "unfurnished";

  return filters;
};

// ── MONGODB QUERY BUILDER ─────────────────────────────────────────────────────

/**
 * Convert extracted filters to a MongoDB query.
 *
 * @param {Object} filters - Extracted search filters
 * @returns {Object} - MongoDB query object
 */
const buildMongoQuery = (filters) => {
  const query = {
    status: "active",
    isOccupied: false,
    isDeleted: false,
    "ai.isFraudSuspected": { $ne: true },
  };

  // Keyword full-text search
  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }

  // Location filters
  if (filters.city) {
    query["location.city"] = { $regex: filters.city, $options: "i" };
  }

  if (filters.subCity) {
    query["location.subCity"] = { $regex: filters.subCity, $options: "i" };
  }

  // Property type
  if (filters.propertyType?.length > 0) {
    query.propertyType = { $in: filters.propertyType };
  }

  // Price range
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    query["pricing.monthlyRent"] = {};
    if (filters.minPrice) query["pricing.monthlyRent"].$gte = filters.minPrice;
    if (filters.maxPrice) query["pricing.monthlyRent"].$lte = filters.maxPrice;
  }

  // Bedrooms
  if (filters.minBedrooms !== null || filters.maxBedrooms !== null) {
    query["details.bedrooms"] = {};
    if (filters.minBedrooms !== null) {
      query["details.bedrooms"].$gte = filters.minBedrooms;
    }
    if (filters.maxBedrooms !== null) {
      query["details.bedrooms"].$lte = filters.maxBedrooms;
    }
  }

  // Bathrooms
  if (filters.minBathrooms) {
    query["details.bathrooms"] = { $gte: filters.minBathrooms };
  }

  // Furnished status
  if (filters.furnished) {
    query["details.furnished"] = filters.furnished;
  }

  // Amenities
  if (filters.amenities?.length > 0) {
    filters.amenities.forEach((amenity) => {
      query[`amenities.${amenity}`] = true;
    });
  }

  // Area range
  if (filters.minArea || filters.maxArea) {
    query["details.area"] = {};
    if (filters.minArea) query["details.area"].$gte = filters.minArea;
    if (filters.maxArea) query["details.area"].$lte = filters.maxArea;
  }

  return query;
};

/**
 * Build sort options from filter sortBy value.
 *
 * @param {string} sortBy - Sort option
 * @returns {Object} - Mongoose sort object
 */
const buildSortOptions = (sortBy) => {
  const sortMap = {
    newest: { createdAt: -1 },
    price_low: { "pricing.monthlyRent": 1 },
    price_high: { "pricing.monthlyRent": -1 },
    rating: { "stats.averageRating": -1 },
    most_viewed: { "stats.totalViews": -1 },
  };
  return sortMap[sortBy] || sortMap.newest;
};

// ── MAIN SEARCH FUNCTION ──────────────────────────────────────────────────────

/**
 * Perform an AI-powered natural language property search.
 *
 * @param {Object} params - Search parameters
 * @returns {Object} - { properties, interpretation, filters, total }
 */
const naturalLanguageSearch = async ({
  query,
  tenantId = null,
  page = 1,
  limit = SEARCH_RESULTS_PER_PAGE,
  saveSearch = false,
}) => {
  const startTime = Date.now();

  try {
    logger.info(`AI search query: "${query}" by user ${tenantId}`);

    // Parse natural language query with AI
    const {
      filters,
      interpretation,
      confidence,
      extractedEntities,
      suggestions,
      tokensUsed,
    } = await parseNaturalLanguageQuery(query);

    // Build MongoDB query
    const mongoQuery = buildMongoQuery(filters);
    const sortOptions = buildSortOptions(filters.sortBy);

    // Execute search
    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(mongoQuery)
        .populate(
          "landlord",
          "firstName lastName avatar landlordProfile isKYCVerified",
        )
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments(mongoQuery),
    ]);

    const searchTimeMs = Date.now() - startTime;

    // Save search if requested and user is logged in
    if (saveSearch && tenantId && query.trim().length > 3) {
      try {
        await SavedSearch.create({
          tenant: tenantId,
          filters,
          ai: {
            naturalLanguageQuery: query,
            isAISearch: true,
            aiInterpretation: interpretation,
            aiConfidenceScore: confidence,
            extractedEntities,
            searchSummary: interpretation,
          },
          alertEnabled: false,
          lastRunAt: new Date(),
          lastResultCount: total,
        });
      } catch (saveError) {
        // Don't fail if save fails
        logger.warn(`Failed to save search: ${saveError.message}`);
      }
    }

    // Log AI usage
    if (tenantId) {
      await aiService.logAIUsage({
        userId: tenantId,
        feature: "smart_search",
        action: "ai_search_performed",
        tokensUsed: tokensUsed || 0,
        responseTimeMs: searchTimeMs,
        success: true,
      });
    }

    logger.info(
      `AI search completed: "${query}" → ${total} results in ${searchTimeMs}ms`,
    );

    return {
      success: true,
      properties,
      interpretation,
      confidence,
      filters,
      suggestions,
      extractedEntities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      searchTimeMs,
    };
  } catch (error) {
    logger.error(`Smart search failed: ${error.message}`);
    return {
      success: false,
      error: "Search failed. Please try again or use the filter options.",
    };
  }
};

/**
 * Perform a traditional filter-based property search.
 * Used when tenant uses the filter panel instead of natural language.
 *
 * @param {Object} filters - Search filters
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} - Search results
 */
const filterSearch = async (
  filters,
  page = 1,
  limit = SEARCH_RESULTS_PER_PAGE,
) => {
  try {
    const mongoQuery = buildMongoQuery(filters);
    const sortOptions = buildSortOptions(filters.sortBy);
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(mongoQuery)
        .populate(
          "landlord",
          "firstName lastName avatar landlordProfile isKYCVerified",
        )
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments(mongoQuery),
    ]);

    return {
      success: true,
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Filter search failed: ${error.message}`);
    return {
      success: false,
      error: "Search failed. Please try again.",
    };
  }
};

/**
 * Get AI search suggestions as the user types.
 * Returns 5 suggested completions for the partial query.
 *
 * @param {string} partialQuery - Partial search query
 * @returns {Array} - Suggested completions
 */
const getSearchSuggestions = async (partialQuery) => {
  if (!partialQuery || partialQuery.length < 3) return [];

  try {
    const prompt = `Generate 5 natural language property search suggestions for Ethiopian rental platform NestFind.

Partial query: "${partialQuery}"

Return ONLY a JSON array of 5 complete search phrases (no other text):
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]

Rules:
- Complete the partial query naturally
- Use ETB for prices, "k" for thousands
- Reference real Addis Ababa sub-cities (Bole, Kirkos, Yeka, etc.)
- Mix price ranges, bedroom counts, and area names
- Keep each suggestion under 15 words`;

    const result = await aiService.sendMessage(prompt, "smart_search", {
      maxTokens: 200,
    });

    if (!result.success) return [];

    const suggestions = aiService.parseJSONResponse(result.content);
    return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
  } catch (error) {
    logger.warn(`Search suggestions failed: ${error.message}`);
    return [];
  }
};

/**
 * Get popular search queries on the platform.
 * Used to show trending searches on the listings page.
 *
 * @returns {Array} - Popular search terms
 */
const getPopularSearches = async () => {
  try {
    const popular = await SavedSearch.aggregate([
      { $match: { "ai.isAISearch": true } },
      {
        $group: {
          _id: "$ai.naturalLanguageQuery",
          count: { $sum: "$totalRuns" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { query: "$_id", count: 1, _id: 0 } },
    ]);

    if (popular.length > 0) return popular;

    // Return defaults if no data yet
    return [
      { query: "3 bedroom apartment in Bole under 30k", count: 0 },
      { query: "furnished studio in Kirkos", count: 0 },
      { query: "2 bedroom house with parking in Yeka", count: 0 },
      { query: "villa with pool in Bole", count: 0 },
      { query: "apartment near CMC under 25k", count: 0 },
    ];
  } catch (error) {
    logger.error(`Failed to get popular searches: ${error.message}`);
    return [];
  }
};

module.exports = {
  naturalLanguageSearch,
  filterSearch,
  parseNaturalLanguageQuery,
  getSearchSuggestions,
  getPopularSearches,
  buildMongoQuery,
  buildSortOptions,
  extractBasicFilters,
  LOCATION_ALIASES,
  PROPERTY_TYPE_ALIASES,
};
