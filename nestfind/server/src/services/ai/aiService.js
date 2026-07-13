const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../../utils/logger");
const AIConversation = require("../../models/AIConversation");
const AuditLog = require("../../models/AuditLog");

// ── INITIALIZE ANTHROPIC CLIENT ───────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;
const MAX_CONVERSATION_MESSAGES = 20;

// ── SYSTEM PROMPTS ────────────────────────────────────────────────────────────
/**
 * Base system prompt that gives Claude context about NestFind.
 * All AI features extend this with their specific instructions.
 */
const BASE_SYSTEM_PROMPT = `You are NestFind AI, an intelligent assistant for NestFind — Ethiopia's premier AI-powered house rental management platform based in Addis Ababa.

Your role is to help tenants find their perfect home, assist landlords in managing their properties effectively, and provide helpful guidance about the rental process in Ethiopia.

Key facts about NestFind:
- Platform serves Addis Ababa and major Ethiopian cities
- Currency used is Ethiopian Birr (ETB)
- Properties are measured in square meters (sqm)
- Ethiopian rental market context: typical leases are 6-24 months
- Sub-cities in Addis Ababa include: Bole, Kirkos, Yeka, Arada, Lideta, Gulele, Kolfe, Nifas Silk, Akaky, Lemi

Guidelines:
- Be helpful, professional, and culturally sensitive to Ethiopian context
- Use ETB for all currency references
- Provide specific, actionable advice
- If unsure about something, say so honestly
- Keep responses concise and clear
- Support both English and Amharic contexts when mentioned`;

/**
 * Feature-specific system prompts that extend the base prompt.
 */
const FEATURE_PROMPTS = {
  chat_assistant: `${BASE_SYSTEM_PROMPT}

You are a general-purpose rental assistant. Help users with:
- Finding properties that match their needs
- Understanding the rental process
- Explaining lease terms and tenant rights
- Answering questions about payments and deposits
- Providing advice on property management
- Guiding users through the NestFind platform`,

  smart_search: `${BASE_SYSTEM_PROMPT}

You are a property search specialist. Your job is to:
- Parse natural language search queries into structured property filters
- Understand Ethiopian location names and areas
- Convert price mentions to ETB amounts
- Extract bedroom, bathroom, and amenity requirements
- Return ONLY valid JSON with extracted search filters
- Never add explanatory text outside the JSON`,

  property_recommendation: `${BASE_SYSTEM_PROMPT}

You are a property recommendation specialist. Your job is to:
- Analyze tenant preferences and behavior patterns
- Match properties to tenant needs intelligently
- Explain why each property is a good match
- Consider budget, location, size, and lifestyle factors
- Rank recommendations by compatibility score
- Return structured JSON with recommendations and scores`,

  rent_advisor: `${BASE_SYSTEM_PROMPT}

You are a rental price advisor for the Ethiopian market. Your job is to:
- Analyze property details and location
- Compare with market rates in the same area
- Suggest optimal rent price ranges
- Explain pricing factors specific to Ethiopian cities
- Consider property type, size, amenities, and area
- Provide data-driven pricing recommendations in ETB`,

  lease_explainer: `${BASE_SYSTEM_PROMPT}

You are a lease contract specialist. Your job is to:
- Explain lease terms in simple, plain language
- Identify important dates (start, end, payment due)
- Highlight tenant obligations and rights
- Flag potentially risky or unusual clauses
- Summarize key financial terms (rent, deposit, fees)
- Use simple English that anyone can understand
- Alert tenants to anything they should negotiate`,

  maintenance_diagnosis: `${BASE_SYSTEM_PROMPT}

You are a home maintenance specialist. Your job is to:
- Diagnose maintenance issues from tenant descriptions
- Identify the likely cause of the problem
- Assess the urgency level (low/medium/high/emergency)
- Suggest immediate safety steps if needed
- Recommend whether professional help is required
- Provide simple DIY fixes for minor issues
- Help tenants describe issues clearly to landlords`,

  fraud_detection: `${BASE_SYSTEM_PROMPT}

You are a property listing fraud detection specialist. Your job is to:
- Analyze property listings for suspicious patterns
- Detect unrealistic pricing (too cheap for the area)
- Identify copied or stolen descriptions
- Flag inconsistencies in property details
- Assess the overall fraud risk score (0-100)
- Return structured JSON with fraud analysis
- Be thorough but avoid false positives`,

  property_description: `${BASE_SYSTEM_PROMPT}

You are a professional property listing copywriter. Your job is to:
- Write compelling, accurate property descriptions
- Highlight key features and selling points
- Use professional yet approachable language
- Follow Ethiopian rental market conventions
- Keep descriptions between 150-300 words
- Make properties sound attractive without being misleading
- Include neighborhood highlights when relevant`,
};

// ── CORE AI SERVICE FUNCTIONS ─────────────────────────────────────────────────

/**
 * Send a single message to Claude and get a response.
 * Used for one-shot AI tasks (fraud detection, rent advice, etc.)
 *
 * @param {string} prompt - The user message/prompt
 * @param {string} feature - Which AI feature is being used
 * @param {Object} options - Additional options
 * @returns {Object} - { content, tokensUsed, responseTimeMs }
 */
const sendMessage = async (
  prompt,
  feature = "chat_assistant",
  options = {},
) => {
  const startTime = Date.now();

  try {
    const systemPrompt =
      options.systemPrompt || FEATURE_PROMPTS[feature] || BASE_SYSTEM_PROMPT;

    const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
    const model = options.model || DEFAULT_MODEL;

    const messages = options.conversationHistory
      ? [...options.conversationHistory, { role: "user", content: prompt }]
      : [{ role: "user", content: prompt }];

    logger.info(`AI request: feature=${feature}, tokens_limit=${maxTokens}`);

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    const responseTimeMs = Date.now() - startTime;
    const content = response.content[0]?.text || "";
    const tokensUsed =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    logger.info(
      `AI response: feature=${feature}, tokens=${tokensUsed}, time=${responseTimeMs}ms`,
    );

    return {
      success: true,
      content,
      tokensUsed,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      responseTimeMs,
      model,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error(`AI error: feature=${feature}, error=${error.message}`);

    return {
      success: false,
      content: null,
      error: error.message,
      tokensUsed: 0,
      responseTimeMs,
    };
  }
};

/**
 * Send a message in a conversation context (maintains history).
 * Used for the AI chat assistant where conversation continuity matters.
 *
 * @param {string} conversationId - AIConversation document ID
 * @param {string} userMessage - The user's message
 * @param {Object} options - Additional options
 * @returns {Object} - { content, tokensUsed, responseTimeMs }
 */
const sendConversationMessage = async (
  conversationId,
  userMessage,
  options = {},
) => {
  const startTime = Date.now();

  try {
    // Load conversation from database
    const conversation = await AIConversation.findById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get recent message history for context
    const historyMessages = conversation.getMessagesForAPI(
      MAX_CONVERSATION_MESSAGES,
    );

    // Add current user message
    const messages = [
      ...historyMessages,
      { role: "user", content: userMessage },
    ];

    const feature = conversation.feature || "chat_assistant";
    const systemPrompt =
      options.systemPrompt || FEATURE_PROMPTS[feature] || BASE_SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: options.model || DEFAULT_MODEL,
      max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    const responseTimeMs = Date.now() - startTime;
    const content = response.content[0]?.text || "";
    const tokensUsed =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    // Save both messages to conversation
    await conversation.addMessage("user", userMessage, {
      tokens: response.usage?.input_tokens || 0,
    });
    await conversation.addMessage("assistant", content, {
      tokens: response.usage?.output_tokens || 0,
      responseTimeMs,
      isVoiceMessage: options.isVoiceMessage || false,
    });

    return {
      success: true,
      content,
      tokensUsed,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      responseTimeMs,
      conversationId,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error(
      `AI conversation error: id=${conversationId}, error=${error.message}`,
    );

    return {
      success: false,
      content: null,
      error: error.message,
      tokensUsed: 0,
      responseTimeMs,
    };
  }
};

/**
 * Send a message and get a streaming response.
 * Used when we want to stream AI responses to the frontend in real-time.
 *
 * @param {string} prompt - The user message
 * @param {Response} res - Express response object for streaming
 * @param {string} feature - Which AI feature
 * @param {Array} conversationHistory - Previous messages
 * @param {Object} options - Additional options
 */
const streamMessage = async (
  prompt,
  res,
  feature = "chat_assistant",
  conversationHistory = [],
  options = {},
) => {
  const startTime = Date.now();

  try {
    const systemPrompt =
      options.systemPrompt || FEATURE_PROMPTS[feature] || BASE_SYSTEM_PROMPT;

    const messages = [
      ...conversationHistory,
      { role: "user", content: prompt },
    ];

    // Set headers for SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL || "*");

    let fullContent = "";
    let totalTokens = 0;

    const stream = await anthropic.messages.stream({
      model: options.model || DEFAULT_MODEL,
      max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    // Stream each text chunk to client
    stream.on("text", (text) => {
      fullContent += text;
      res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
    });

    // Handle stream completion
    const finalMessage = await stream.finalMessage();
    totalTokens =
      (finalMessage.usage?.input_tokens || 0) +
      (finalMessage.usage?.output_tokens || 0);

    const responseTimeMs = Date.now() - startTime;

    // Send completion signal
    res.write(
      `data: ${JSON.stringify({
        type: "done",
        tokensUsed: totalTokens,
        responseTimeMs,
      })}\n\n`,
    );

    res.end();

    logger.info(
      `AI stream complete: feature=${feature}, tokens=${totalTokens}, time=${responseTimeMs}ms`,
    );

    return {
      success: true,
      content: fullContent,
      tokensUsed: totalTokens,
      responseTimeMs,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error(`AI stream error: feature=${feature}, error=${error.message}`);

    // Send error to client if stream is still open
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "AI streaming failed",
        error: error.message,
      });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`,
      );
      res.end();
    }

    return {
      success: false,
      error: error.message,
      responseTimeMs,
    };
  }
};

/**
 * Parse JSON from AI response safely.
 * Claude sometimes wraps JSON in markdown code blocks — this strips them.
 *
 * @param {string} content - Raw AI response content
 * @returns {Object|null} - Parsed JSON or null if parsing fails
 */
const parseJSONResponse = (content) => {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```json\n?/i, "");
    cleaned = cleaned.replace(/^```\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/i, "");
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  } catch (error) {
    logger.warn(`Failed to parse AI JSON response: ${error.message}`);

    // Try to extract JSON from response if it's embedded in text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
};

/**
 * Build a property context string for AI prompts.
 * Formats property data into a readable context block.
 *
 * @param {Object} property - Property document
 * @returns {string} - Formatted property context
 */
const buildPropertyContext = (property) => {
  if (!property) return "";

  return `
Property Details:
- Title: ${property.title}
- Type: ${property.propertyType}
- Location: ${property.location?.address}, ${property.location?.subCity}, ${property.location?.city}
- Bedrooms: ${property.details?.bedrooms}
- Bathrooms: ${property.details?.bathrooms}
- Area: ${property.details?.area} sqm
- Furnished: ${property.details?.furnished}
- Monthly Rent: ETB ${property.pricing?.monthlyRent?.toLocaleString()}
- Security Deposit: ETB ${property.pricing?.securityDeposit?.toLocaleString() || 0}
- Amenities: ${
    Object.entries(property.amenities || {})
      .filter(([, val]) => val === true)
      .map(([key]) => key)
      .join(", ") || "None listed"
  }
- Description: ${property.description}
- Rating: ${property.stats?.averageRating || 0}/5 (${property.stats?.totalReviews || 0} reviews)
`.trim();
};

/**
 * Build tenant preference context for AI prompts.
 * Formats tenant data into a readable context block.
 *
 * @param {Object} user - User document
 * @param {Object} savedSignals - Signals from saved properties
 * @returns {string} - Formatted tenant context
 */
const buildTenantContext = (user, savedSignals = {}) => {
  if (!user) return "";

  const prefs = user.aiPreferences || {};

  return `
Tenant Profile:
- Name: ${user.firstName} ${user.lastName}
- Preferred Cities: ${prefs.preferredCities?.join(", ") || "Not specified"}
- Preferred Sub-Cities: ${prefs.preferredSubCities?.join(", ") || "Not specified"}
- Preferred Property Types: ${prefs.preferredPropertyTypes?.join(", ") || "Not specified"}
- Budget Range: ETB ${prefs.budgetMin?.toLocaleString() || 0} - ETB ${prefs.budgetMax?.toLocaleString() || "No limit"}
- Preferred Bedrooms: ${prefs.preferredBedrooms || "Any"}
- Preferred Amenities: ${prefs.preferredAmenities?.join(", ") || "Not specified"}
- Employment: ${user.tenantProfile?.employmentStatus || "Not specified"}
${savedSignals.propertyTypes?.length > 0 ? `- Saved Property Types: ${savedSignals.propertyTypes.join(", ")}` : ""}
${savedSignals.subCities?.length > 0 ? `- Frequently Saved Areas: ${savedSignals.subCities.join(", ")}` : ""}
`.trim();
};

/**
 * Log AI usage to audit log.
 * Tracks which features are being used and their performance.
 *
 * @param {Object} params - Audit log parameters
 */
const logAIUsage = async ({
  userId,
  feature,
  action,
  tokensUsed,
  responseTimeMs,
  success,
  errorMessage = null,
}) => {
  try {
    await AuditLog.log({
      actorId: userId,
      actorRole: "tenant",
      action,
      status: success ? "success" : "failure",
      errorMessage,
      severity: success ? "info" : "warning",
      aiContext: {
        isAIAction: true,
        aiFeature: feature,
        tokensUsed,
        modelUsed: DEFAULT_MODEL,
        responseTimeMs,
      },
    });
  } catch (error) {
    logger.error(`Failed to log AI usage: ${error.message}`);
  }
};

/**
 * Check if the Anthropic API is configured and reachable.
 * Used during server startup to validate AI configuration.
 *
 * @returns {boolean} - true if API is available
 */
const verifyAIConfig = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.error("ANTHROPIC_API_KEY is not set in environment variables");
    return false;
  }

  try {
    // Send a minimal test message to verify API connectivity
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }],
    });

    if (response.content && response.content.length > 0) {
      logger.info("Anthropic AI API connected successfully");
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Anthropic AI API connection failed: ${error.message}`);
    return false;
  }
};

/**
 * Estimate token count for a string.
 * Rough approximation — Claude uses ~4 characters per token.
 *
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Check if AI features are enabled in system settings.
 *
 * @param {string} featureName - Feature to check
 * @returns {boolean}
 */
const isAIFeatureEnabled = async (featureName) => {
  try {
    const SystemSettings = require("../../models/SystemSettings");
    return await SystemSettings.isAIFeatureEnabled(featureName);
  } catch {
    return true; // Default to enabled if settings unavailable
  }
};

// ── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = {
  anthropic,
  sendMessage,
  sendConversationMessage,
  streamMessage,
  parseJSONResponse,
  buildPropertyContext,
  buildTenantContext,
  logAIUsage,
  verifyAIConfig,
  estimateTokens,
  isAIFeatureEnabled,
  FEATURE_PROMPTS,
  BASE_SYSTEM_PROMPT,
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
};
