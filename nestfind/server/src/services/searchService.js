// nestfind/nestfind/server/src/services/searchService.js

const Property = require("../models/Property");
const logger = require("../utils/logger");

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

// ── QUERY BUILDER ─────────────────────────────────────────────────────────────

/**
 * Build MongoDB query from request query parameters.
 *
 * @param {Object} queryParams - Express req.query
 * @returns {Object} - MongoDB query object
 */
const buildSearchQuery = (queryParams) => {
  const query = {
    status: "active",
    isOccupied: false,
    isDeleted: false,
    "ai.isFraudSuspected": { $ne: true },
  };

  const {
    keyword,
    city,
    subCity,
    propertyType,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    furnished,
    amenities,
    minArea,
    maxArea,
    isFeatured,
    isVerified,
  } = queryParams;

  // Full-text search
  if (keyword && keyword.trim()) {
    query.$text = { $search: keyword.trim() };
  }

  // Location filters
  if (city) {
    query["location.city"] = { $regex: city, $options: "i" };
  }
  if (subCity) {
    query["location.subCity"] = { $regex: subCity, $options: "i" };
  }

  // Property type - supports multiple values
  if (propertyType) {
    const types = Array.isArray(propertyType) ? propertyType : [propertyType];
    if (types.length > 0) query.propertyType = { $in: types };
  }

  // Price range
  if (minPrice || maxPrice) {
    query["pricing.monthlyRent"] = {};
    if (minPrice) query["pricing.monthlyRent"].$gte = parseFloat(minPrice);
    if (maxPrice) query["pricing.monthlyRent"].$lte = parseFloat(maxPrice);
  }

  // Bedrooms
  if (minBedrooms || maxBedrooms) {
    query["details.bedrooms"] = {};
    if (minBedrooms) query["details.bedrooms"].$gte = parseInt(minBedrooms);
    if (maxBedrooms) query["details.bedrooms"].$lte = parseInt(maxBedrooms);
  }

  // Bathrooms
  if (minBathrooms) {
    query["details.bathrooms"] = { $gte: parseInt(minBathrooms) };
  }

  // Furnished status
  if (furnished) {
    query["details.furnished"] = furnished;
  }

  // Amenities - supports multiple values
  if (amenities) {
    const amenityList = Array.isArray(amenities) ? amenities : [amenities];
    amenityList.forEach((amenity) => {
      query[`amenities.${amenity}`] = true;
    });
  }

  // Area range
  if (minArea || maxArea) {
    query["details.area"] = {};
    if (minArea) query["details.area"].$gte = parseFloat(minArea);
    if (maxArea) query["details.area"].$lte = parseFloat(maxArea);
  }

  // Featured filter
  if (isFeatured === "true" || isFeatured === true) {
    query.isFeatured = true;
  }

  // Verified filter
  if (isVerified === "true" || isVerified === true) {
    query.isVerified = true;
  }

  return query;
};

/**
 * Build sort options from query parameters.
 *
 * @param {string} sortBy - Sort parameter
 * @param {Object} hasKeyword - Whether text search is active (affects sort)
 * @returns {Object} - Mongoose sort object
 */
const buildSortOptions = (sortBy, hasKeyword = false) => {
  // If text search active, default to relevance score
  if (hasKeyword && !sortBy) {
    return { score: { $meta: "textScore" }, "stats.averageRating": -1 };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_low: { "pricing.monthlyRent": 1 },
    price_high: { "pricing.monthlyRent": -1 },
    rating: { "stats.averageRating": -1, "stats.totalReviews": -1 },
    most_viewed: { "stats.totalViews": -1 },
    most_saved: { "stats.totalSaves": -1 },
    featured: { isFeatured: -1, "stats.averageRating": -1 },
  };

  return sortMap[sortBy] || { isFeatured: -1, createdAt: -1 };
};

// ── MAIN SEARCH FUNCTION ──────────────────────────────────────────────────────

/**
 * Search properties with full filter support.
 *
 * @param {Object} queryParams - Search parameters
 * @param {Object} options - Additional options
 * @returns {Object} - { properties, pagination, filters }
 */
const searchProperties = async (queryParams, options = {}) => {
  try {
    const page = Math.max(1, parseInt(queryParams.page) || DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      parseInt(queryParams.limit) || DEFAULT_LIMIT,
    );
    const skip = (page - 1) * limit;
    const sortBy = queryParams.sortBy || queryParams.sort;

    const mongoQuery = buildSearchQuery(queryParams);
    const sortOptions = buildSortOptions(sortBy, !!queryParams.keyword);

    // Build projection for text score if needed
    const projection = queryParams.keyword
      ? { score: { $meta: "textScore" } }
      : {};

    const [properties, total] = await Promise.all([
      Property.find(mongoQuery, projection)
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

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
      appliedFilters: mongoQuery,
    };
  } catch (error) {
    logger.error(`Property search failed: ${error.message}`);
    return { success: false, error: "Search failed. Please try again." };
  }
};

/**
 * Get properties near a location using geospatial query.
 *
 * @param {number} longitude - Longitude
 * @param {number} latitude - Latitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {Object} additionalFilters - Extra filters
 * @returns {Object} - Search results
 */
const searchNearby = async (
  longitude,
  latitude,
  radiusKm = 5,
  additionalFilters = {},
) => {
  try {
    const query = {
      status: "active",
      isOccupied: false,
      isDeleted: false,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
      ...additionalFilters,
    };

    const properties = await Property.find(query)
      .populate("landlord", "firstName lastName avatar landlordProfile")
      .limit(20)
      .lean();

    return { success: true, properties, count: properties.length };
  } catch (error) {
    logger.error(`Nearby search failed: ${error.message}`);
    return { success: false, error: "Location search failed." };
  }
};

/**
 * Get search suggestions (autocomplete) for search bar.
 *
 * @param {string} query - Partial search query
 * @returns {Array} - Suggestion list
 */
const getSearchSuggestions = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    const regex = new RegExp(query, "i");

    const [titleMatches, locationMatches] = await Promise.all([
      Property.find(
        {
          status: "active",
          isDeleted: false,
          title: regex,
        },
        { title: 1, propertyType: 1, "location.subCity": 1 },
      )
        .limit(5)
        .lean(),

      Property.distinct("location.subCity", {
        status: "active",
        isDeleted: false,
        "location.subCity": regex,
      }),
    ]);

    const suggestions = [
      ...locationMatches.slice(0, 3).map((loc) => ({
        type: "location",
        label: loc,
        value: loc,
      })),
      ...titleMatches.map((p) => ({
        type: "property",
        label: p.title,
        value: p.title,
        subLabel: `${p.propertyType} in ${p.location?.subCity}`,
        id: p._id,
      })),
    ];

    return suggestions.slice(0, 8);
  } catch (error) {
    logger.error(`Search suggestions failed: ${error.message}`);
    return [];
  }
};

/**
 * Get available filter options based on current listings.
 * Used to populate filter dropdowns dynamically.
 *
 * @returns {Object} - Available filter options
 */
const getFilterOptions = async () => {
  try {
    const [cities, subCities, propertyTypes, priceStats] = await Promise.all([
      Property.distinct("location.city", {
        status: "active",
        isDeleted: false,
      }),
      Property.distinct("location.subCity", {
        status: "active",
        isDeleted: false,
      }),
      Property.distinct("propertyType", {
        status: "active",
        isDeleted: false,
      }),
      Property.aggregate([
        { $match: { status: "active", isDeleted: false } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$pricing.monthlyRent" },
            maxPrice: { $max: "$pricing.monthlyRent" },
            avgPrice: { $avg: "$pricing.monthlyRent" },
            minBedrooms: { $min: "$details.bedrooms" },
            maxBedrooms: { $max: "$details.bedrooms" },
            totalListings: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      success: true,
      filters: {
        cities: cities.filter(Boolean).sort(),
        subCities: subCities.filter(Boolean).sort(),
        propertyTypes: propertyTypes.filter(Boolean),
        priceRange: priceStats[0] || {
          minPrice: 0,
          maxPrice: 100000,
          avgPrice: 25000,
        },
        bedroomRange: {
          min: priceStats[0]?.minBedrooms || 0,
          max: priceStats[0]?.maxBedrooms || 6,
        },
        totalListings: priceStats[0]?.totalListings || 0,
      },
    };
  } catch (error) {
    logger.error(`Get filter options failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get similar properties for a property detail page.
 *
 * @param {Object} property - Current property
 * @param {number} limit - Number of similar properties
 * @returns {Array} - Similar properties
 */
const getSimilarProperties = async (property, limit = 4) => {
  try {
    const query = {
      _id: { $ne: property._id },
      status: "active",
      isOccupied: false,
      isDeleted: false,
      $or: [
        { "location.subCity": property.location?.subCity },
        { propertyType: property.propertyType },
        {
          "details.bedrooms": {
            $gte: (property.details?.bedrooms || 1) - 1,
            $lte: (property.details?.bedrooms || 1) + 1,
          },
        },
      ],
      "pricing.monthlyRent": {
        $gte: property.pricing?.monthlyRent * 0.7,
        $lte: property.pricing?.monthlyRent * 1.3,
      },
    };

    return await Property.find(query)
      .populate("landlord", "firstName lastName avatar")
      .sort({ "stats.averageRating": -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    logger.error(`Similar properties search failed: ${error.message}`);
    return [];
  }
};

module.exports = {
  searchProperties,
  searchNearby,
  getSearchSuggestions,
  getFilterOptions,
  getSimilarProperties,
  buildSearchQuery,
  buildSortOptions,
};
