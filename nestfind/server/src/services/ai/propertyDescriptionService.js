// nestfind/nestfind/server/src/services/ai/propertyDescriptionService.js

const aiService = require('./aiService');
const logger = require('../../utils/logger');

// ── SUB-CITY DESCRIPTIONS ─────────────────────────────────────────────────────
const SUB_CITY_HIGHLIGHTS = {
  Bole: 'Bole is Addis Ababa\'s most prestigious neighborhood, home to the international airport, top restaurants, embassies, and modern shopping centers.',
  Kirkos: 'Kirkos is a central business hub with excellent connectivity, close to government offices, hospitals, and commercial centers.',
  Yeka: 'Yeka offers a peaceful residential atmosphere with cooler temperatures, green spaces, and easy access to Entoto mountains.',
  Arada: 'Arada is the historical heart of Addis Ababa, featuring Piazza, St. George Cathedral, and vibrant local markets.',
  Lideta: 'Lideta is a well-connected central district with good transport links and proximity to key city amenities.',
  Gulele: 'Gulele is a tranquil residential area known for its green environment and family-friendly atmosphere.',
  'Kolfe Keranyo': 'Kolfe Keranyo is an affordable residential district with growing infrastructure and community amenities.',
  'Nifas Silk-Lafto': 'Nifas Silk-Lafto is a rapidly developing area with modern condominiums and good road connections.',
  'Akaky Kaliti': 'Akaky Kaliti is an industrial and residential area on the southern edge of Addis Ababa with affordable living options.',
  'Lemi Kura': 'Lemi Kura is one of Addis Ababa\'s newest sub-cities with modern urban planning and developing infrastructure.',
};

// ── MAIN DESCRIPTION GENERATOR ────────────────────────────────────────────────

/**
 * Generate a professional property listing description using AI.
 *
 * @param {Object} propertyDetails - Property information provided by landlord
 * @param {string} landlordId - Landlord user ID
 * @param {Object} options - Generation options
 * @returns {Object} - Generated description and metadata
 */
const generatePropertyDescription = async (
  propertyDetails,
  landlordId = null,
  options = {}
) => {
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
      totalFloors,
      pricing,
      leaseTerms,
      targetTenant,
      tone = 'professional',
      length = 'medium',
      language = 'en',
    } = propertyDetails;

    // Build amenities list
    const amenitiesList = Object.entries(amenities)
      .filter(([, val]) => val === true)
      .map(([key]) => formatAmenityName(key))
      .join(', ');

    // Get sub-city highlight
    const subCityHighlight = SUB_CITY_HIGHLIGHTS[subCity] || '';

    // Build length instructions
    const lengthInstructions = {
      short: 'Write 80-120 words.',
      medium: 'Write 150-220 words.',
      long: 'Write 250-350 words.',
    };

    // Build tone instructions
    const toneInstructions = {
      professional: 'Use a professional, informative tone.',
      warm: 'Use a warm, welcoming, and friendly tone.',
      luxury: 'Use an elegant, premium, and sophisticated tone that emphasizes exclusivity.',
      simple: 'Use simple, clear, and straightforward language.',
    };

    const prompt = `You are a professional property listing copywriter for NestFind, an Ethiopian rental platform.

Write a compelling property description for this listing:

PROPERTY DETAILS:
- Property Type: ${propertyType || 'apartment'}
- Title/Name: ${title || `${bedrooms}-bedroom ${propertyType} in ${subCity}`}
- Location: ${address || ''}, ${subCity || ''}, ${city}
- Bedrooms: ${bedrooms || 'Not specified'}
- Bathrooms: ${bathrooms || 'Not specified'}
- Area: ${area || 'Not specified'} sqm
- Floor: ${floorNumber ? `${floorNumber} of ${totalFloors || '?'} floors` : 'Not specified'}
- Furnishing: ${furnished || 'Not specified'}
- Year Built: ${yearBuilt || 'Not specified'}
- Monthly Rent: ${pricing?.monthlyRent ? `ETB ${pricing.monthlyRent.toLocaleString()}` : 'Not specified'}
- Amenities: ${amenitiesList || 'Standard amenities'}
- Target Tenant: ${targetTenant || 'Professionals and families'}
- Minimum Lease: ${leaseTerms?.minimumLease || 6} months

NEIGHBORHOOD CONTEXT:
${subCityHighlight}

WRITING INSTRUCTIONS:
- ${lengthInstructions[length] || lengthInstructions.medium}
- ${toneInstructions[tone] || toneInstructions.professional}
- Start with the most compelling feature, not with "This property"
- Mention the neighborhood benefits naturally
- Highlight the best amenities
- End with a clear call to action
- Do NOT include the price or contact information
- Do NOT use generic phrases like "beautiful," "nice," or "great"
- Use specific, descriptive language
- Write in ${language === 'am' ? 'simple English suitable for Ethiopian readers' : 'clear English'}

Return ONLY the property description text. No JSON, no title, no extra formatting.`;

    const result = await aiService.sendMessage(
      prompt,
      'property_description',
      { maxTokens: 600 }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!result.success || !result.content) {
      return {
        success: false,
        error: 'Description generator temporarily unavailable. Please write your description manually.',
      };
    }

    // Clean up the description
    const description = result.content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks

    // Generate a title suggestion if not provided
    let suggestedTitle = title;
    if (!title || title.length < 10) {
      suggestedTitle = await generateTitle(propertyDetails);
    }

    // Generate tags for the property
    const tags = await generatePropertyTags(propertyDetails, description);

    // Log AI usage
    if (landlordId) {
      await aiService.logAIUsage({
        userId: landlordId,
        feature: 'property_description',
        action: 'ai_description_generated',
        tokensUsed: result.tokensUsed,
        responseTimeMs,
        success: true,
      });
    }

    logger.info(
      `Property description generated for landlord ${landlordId} in ${responseTimeMs}ms`
    );

    return {
      success: true,
      description,
      suggestedTitle,
      tags,
      wordCount: description.split(/\s+/).length,
      characterCount: description.length,
      isAIGenerated: true,
      tokensUsed: result.tokensUsed,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(`Property description generation failed: ${error.message}`);
    return {
      success: false,
      error: 'Failed to generate description. Please write it manually.',
    };
  }
};

// ── TITLE GENERATOR ───────────────────────────────────────────────────────────

/**
 * Generate a compelling property listing title.
 *
 * @param {Object} propertyDetails - Property information
 * @returns {string} - Generated title
 */
const generateTitle = async (propertyDetails) => {
  try {
    const {
      propertyType,
      subCity,
      city = 'Addis Ababa',
      bedrooms,
      furnished,
      amenities = {},
    } = propertyDetails;

    const topAmenity = Object.entries(amenities)
      .filter(([, v]) => v)
      .map(([k]) => k)[0];

    const prompt = `Generate 5 compelling property listing titles for this Ethiopian rental property.

Property: ${bedrooms}-bedroom ${furnished || ''} ${propertyType} in ${subCity || city}
${topAmenity ? `Key feature: ${formatAmenityName(topAmenity)}` : ''}

Rules:
- Maximum 70 characters each
- Be specific and descriptive
- Avoid generic words like "beautiful" or "nice"
- Include bedroom count, property type, and location
- One title per line
- No numbering or bullets

Return ONLY the 5 titles, one per line.`;

    const result = await aiService.sendMessage(
      prompt,
      'property_description',
      { maxTokens: 200 }
    );

    if (!result.success || !result.content) {
      return `${bedrooms}-Bedroom ${propertyType} in ${subCity || city}`;
    }

    // Return first generated title
    const titles = result.content
      .trim()
      .split('\n')
      .filter((t) => t.trim().length > 0);

    return titles[0] || `${bedrooms}-Bedroom ${propertyType} in ${subCity || city}`;
  } catch (error) {
    logger.warn(`Title generation failed: ${error.message}`);
    const { bedrooms, propertyType, subCity, city } = propertyDetails;
    return `${bedrooms}-Bedroom ${propertyType} in ${subCity || city || 'Addis Ababa'}`;
  }
};

// ── TAG GENERATOR ─────────────────────────────────────────────────────────────

/**
 * Generate relevant search tags for a property.
 *
 * @param {Object} propertyDetails - Property information
 * @param {string} description - Generated description
 * @returns {Array} - Array of relevant tags
 */
const generatePropertyTags = async (propertyDetails, description = '') => {
  try {
    const {
      propertyType,
      subCity,
      furnished,
      amenities = {},
      bedrooms,
    } = propertyDetails;

    // Base tags from structured data
    const baseTags = [
      propertyType,
      subCity,
      furnished,
      `${bedrooms} bedroom`,
      'Addis Ababa',
      'Ethiopia',
    ].filter(Boolean);

    // Add amenity tags
    const amenityTags = Object.entries(amenities)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const allTags = [...baseTags, ...amenityTags]
      .map((t) => t.toLowerCase().replace(/_/g, ' '))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 15);

    return allTags;
  } catch (error) {
    logger.warn(`Tag generation failed: ${error.message}`);
    return [propertyDetails.propertyType, propertyDetails.subCity].filter(Boolean);
  }
};

// ── DESCRIPTION IMPROVER ──────────────────────────────────────────────────────

/**
 * Improve an existing property description written by landlord.
 * Makes it more professional and compelling without changing facts.
 *
 * @param {string} existingDescription - Landlord's original description
 * @param {Object} propertyDetails - Property context
 * @param {string} landlordId - Landlord user ID
 * @returns {Object} - Improved description
 */
const improveDescription = async (
  existingDescription,
  propertyDetails,
  landlordId = null
) => {
  const startTime = Date.now();

  try {
    if (!existingDescription || existingDescription.trim().length < 20) {
      return {
        success: false,
        error: 'Please provide an existing description to improve',
      };
    }

    const prompt = `You are a professional copywriter improving a rental property description for NestFind, an Ethiopian platform.

ORIGINAL DESCRIPTION:
"${existingDescription}"

PROPERTY CONTEXT:
- Type: ${propertyDetails.propertyType || 'apartment'}
- Location: ${propertyDetails.subCity || 'Addis Ababa'}
- Bedrooms: ${propertyDetails.bedrooms || 'Not specified'}
- Monthly Rent: ${propertyDetails.pricing?.monthlyRent ? `ETB ${propertyDetails.pricing.monthlyRent.toLocaleString()}` : 'Not specified'}

IMPROVEMENT INSTRUCTIONS:
- Keep all factual information accurate — do NOT add features not mentioned
- Fix grammar and spelling errors
- Make it more engaging and professional
- Remove clichés and generic phrases
- Improve flow and readability
- Keep similar length to the original
- Do NOT include prices or contact info

Return ONLY the improved description text. No explanations.`;

    const result = await aiService.sendMessage(
      prompt,
      'property_description',
      { maxTokens: 500 }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!result.success || !result.content) {
      return { success: false, error: 'Could not improve description' };
    }

    const improved = result.content.trim();

    if (landlordId) {
      await aiService.logAIUsage({
        userId: landlordId,
        feature: 'property_description',
        action: 'ai_description_generated',
        tokensUsed: result.tokensUsed,
        responseTimeMs,
        success: true,
      });
    }

    return {
      success: true,
      original: existingDescription,
      improved,
      wordCount: improved.split(/\s+/).length,
      isAIGenerated: true,
      tokensUsed: result.tokensUsed,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(`Description improvement failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Format amenity key to readable name.
 *
 * @param {string} key - Amenity key (e.g. 'security24h')
 * @returns {string} - Readable name (e.g. '24-Hour Security')
 */
const formatAmenityName = (key) => {
  const amenityNames = {
    wifi: 'Wi-Fi',
    generator: 'Backup Generator',
    waterTank: 'Water Tank',
    solarPower: 'Solar Power',
    security24h: '24-Hour Security',
    cctv: 'CCTV Cameras',
    intercom: 'Intercom System',
    securityDoor: 'Security Door',
    parking: 'Private Parking',
    elevator: 'Elevator',
    wheelchairAccess: 'Wheelchair Access',
    pool: 'Swimming Pool',
    gym: 'Fitness Center',
    garden: 'Garden',
    rooftopTerrace: 'Rooftop Terrace',
    airConditioning: 'Air Conditioning',
    heating: 'Central Heating',
    balcony: 'Balcony',
    storageRoom: 'Storage Room',
    laundry: 'Laundry Facility',
    dishwasher: 'Dishwasher',
    petFriendly: 'Pet Friendly',
    smokingAllowed: 'Smoking Allowed',
    childFriendly: 'Child Friendly',
  };

  return amenityNames[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Translate a property description to Amharic.
 * Basic translation support for Ethiopian users.
 *
 * @param {string} description - English description
 * @returns {Object} - Translated description
 */
const translateToAmharic = async (description) => {
  try {
    const prompt = `Translate this Ethiopian rental property description from English to Amharic.
Keep property-specific terms (like ETB, sqm, bedrooms) in their standard form.
Return ONLY the Amharic translation.

English description:
"${description}"`;

    const result = await aiService.sendMessage(
      prompt,
      'chat_assistant',
      { maxTokens: 500 }
    );

    if (!result.success) {
      return { success: false, error: 'Translation failed' };
    }

    return {
      success: true,
      amharic: result.content.trim(),
      english: description,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error(`Translation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generatePropertyDescription,
  generateTitle,
  generatePropertyTags,
  improveDescription,
  translateToAmharic,
  formatAmenityName,
  SUB_CITY_HIGHLIGHTS,
};