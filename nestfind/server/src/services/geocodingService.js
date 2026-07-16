// nestfind/nestfind/server/src/services/geocodingService.js

const logger = require("../utils/logger");

// ── ADDIS ABABA SUB-CITY COORDINATES ─────────────────────────────────────────
// Default center coordinates for each sub-city
// Used when exact address geocoding is not available
const SUB_CITY_COORDINATES = {
  Bole: { lat: 8.9989, lng: 38.786 },
  Kirkos: { lat: 9.0197, lng: 38.76 },
  Yeka: { lat: 9.06, lng: 38.82 },
  Arada: { lat: 9.0367, lng: 38.7467 },
  Lideta: { lat: 9.0033, lng: 38.7267 },
  Gulele: { lat: 9.07, lng: 38.73 },
  "Kolfe Keranyo": { lat: 9.01, lng: 38.69 },
  "Nifas Silk-Lafto": { lat: 8.97, lng: 38.77 },
  "Akaky Kaliti": { lat: 8.87, lng: 38.79 },
  "Lemi Kura": { lat: 9.08, lng: 38.85 },
  "Addis Ketema": { lat: 9.03, lng: 38.74 },
  Chirkos: { lat: 9.0197, lng: 38.76 },
};

// Default Addis Ababa center
const ADDIS_ABABA_CENTER = { lat: 9.0248, lng: 38.7614 };

// ── GEOCODING FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Get coordinates for an Ethiopian address.
 * Uses OpenStreetMap Nominatim API (free, no key required).
 * Falls back to sub-city center coordinates if API fails.
 *
 * @param {Object} address - Address object
 * @returns {Object} - { lat, lng, accuracy }
 */
const geocodeAddress = async (address) => {
  const {
    street,
    subCity,
    city = "Addis Ababa",
    country = "Ethiopia",
  } = address;

  try {
    // Build search query for Nominatim
    const searchQuery = [street, subCity, city, country]
      .filter(Boolean)
      .join(", ");

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=et`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NestFind-Ethiopia/1.0 (support@nestfind.et)",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results = await response.json();

    if (results && results.length > 0) {
      const result = results[0];
      return {
        success: true,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        accuracy: "address",
        displayName: result.display_name,
      };
    }

    // Fall back to sub-city coordinates
    return geocodeSubCity(subCity);
  } catch (error) {
    logger.warn(
      `Geocoding failed for address, using sub-city fallback: ${error.message}`,
    );
    return geocodeSubCity(address.subCity);
  }
};

/**
 * Get coordinates for a sub-city.
 * Returns center coordinates for the sub-city.
 *
 * @param {string} subCity - Sub-city name
 * @returns {Object} - { lat, lng, accuracy }
 */
const geocodeSubCity = (subCity) => {
  if (subCity && SUB_CITY_COORDINATES[subCity]) {
    const coords = SUB_CITY_COORDINATES[subCity];
    return {
      success: true,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: "subcity",
    };
  }

  // Default to Addis Ababa center
  return {
    success: true,
    lat: ADDIS_ABABA_CENTER.lat,
    lng: ADDIS_ABABA_CENTER.lng,
    accuracy: "city",
  };
};

/**
 * Reverse geocode coordinates to address.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - Address information
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NestFind-Ethiopia/1.0 (support@nestfind.et)",
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      displayName: result.display_name,
      address: {
        street: result.address?.road || result.address?.pedestrian,
        neighbourhood: result.address?.neighbourhood,
        suburb: result.address?.suburb,
        city: result.address?.city || result.address?.town,
        country: result.address?.country,
        countryCode: result.address?.country_code,
      },
    };
  } catch (error) {
    logger.warn(`Reverse geocoding failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate distance between two coordinates in kilometers.
 *
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get coordinates for a property from its address fields.
 * Used when saving a new property to the database.
 *
 * @param {Object} property - Property document
 * @returns {Array} - [longitude, latitude] for GeoJSON
 */
const getPropertyCoordinates = async (property) => {
  const address = {
    street: property.location?.address,
    subCity: property.location?.subCity,
    city: property.location?.city || "Addis Ababa",
    country: "Ethiopia",
  };

  const result = await geocodeAddress(address);

  if (result.success) {
    return [result.lng, result.lat]; // GeoJSON format: [longitude, latitude]
  }

  // Return Addis Ababa center as fallback
  return [ADDIS_ABABA_CENTER.lng, ADDIS_ABABA_CENTER.lat];
};

/**
 * Validate that coordinates are within Ethiopia's boundaries.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - true if within Ethiopia
 */
const isWithinEthiopia = (lat, lng) => {
  // Ethiopia approximate bounding box
  return lat >= 3.4 && lat <= 14.9 && lng >= 33.0 && lng <= 47.9;
};

/**
 * Get nearby landmarks for a location (mock implementation).
 * In production this would use Google Places or similar API.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Array} - Nearby landmarks
 */
const getNearbyLandmarks = async (lat, lng) => {
  // Find which sub-city this is closest to
  let closestSubCity = null;
  let minDistance = Infinity;

  for (const [name, coords] of Object.entries(SUB_CITY_COORDINATES)) {
    const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestSubCity = name;
    }
  }

  return {
    success: true,
    closestSubCity,
    distanceToCenter: Math.round(minDistance * 10) / 10,
    landmarks: [],
  };
};

module.exports = {
  geocodeAddress,
  geocodeSubCity,
  reverseGeocode,
  calculateDistance,
  getPropertyCoordinates,
  isWithinEthiopia,
  getNearbyLandmarks,
  SUB_CITY_COORDINATES,
  ADDIS_ABABA_CENTER,
};
