const aiService = require("./aiService");
const AIConversation = require("../../models/AIConversation");
const Property = require("../../models/Property");
const Rental = require("../../models/Rental");
const Contract = require("../../models/Contract");
const logger = require("../../utils/logger");
const crypto = require("crypto");

// ── CONTEXT BUILDERS ──────────────────────────────────────────────────────────

/**
 * Build page-specific context for the AI assistant.
 * The AI gives better answers when it knows what the user is looking at.
 */
const buildPageContext = async (pageName, resourceId, userId) => {
  let context = "";

  try {
    switch (pageName) {
      case "property_detail": {
        if (!resourceId) break;
        const property = await Property.findById(resourceId)
          .populate("landlord", "firstName lastName phone landlordProfile")
          .lean();
        if (property) {
          context = `
The user is currently viewing this property listing:
${aiService.buildPropertyContext(property)}
Landlord: ${property.landlord?.firstName} ${property.landlord?.lastName}
Response Rate: ${property.landlord?.landlordProfile?.responseRate || "Unknown"}%
`;
        }
        break;
      }

      case "my_contracts":
      case "contract_detail": {
        if (!resourceId || !userId) break;
        const contract = await Contract.findOne({
          _id: resourceId,
          $or: [{ tenant: userId }, { landlord: userId }],
        })
          .populate("property", "title location pricing")
          .lean();
        if (contract) {
          context = `
The user is viewing their lease contract:
- Contract #: ${contract.contractNumber}
- Property: ${contract.property?.title}
- Location: ${contract.property?.location?.address}, ${contract.property?.location?.subCity}
- Monthly Rent: ETB ${contract.terms?.monthlyRent?.toLocaleString()}
- Lease Period: ${new Date(contract.terms?.startDate).toLocaleDateString()} to ${new Date(contract.terms?.endDate).toLocaleDateString()}
- Status: ${contract.status}
- Payment Due: Day ${contract.terms?.paymentDueDay} of each month
- Security Deposit: ETB ${contract.terms?.securityDeposit?.toLocaleString() || 0}
`;
        }
        break;
      }

      case "active_rental": {
        if (!userId) break;
        const rental = await Rental.findOne({
          tenant: userId,
          status: "active",
        })
          .populate("property", "title location pricing")
          .populate("landlord", "firstName lastName phone")
          .lean();
        if (rental) {
          context = `
The user has an active rental:
- Property: ${rental.property?.title}
- Location: ${rental.property?.location?.address}, ${rental.property?.location?.subCity}
- Monthly Rent: ETB ${rental.monthlyRent?.toLocaleString()}
- Lease Ends: ${new Date(rental.endDate).toLocaleDateString()}
- Days Remaining: ${Math.max(0, Math.ceil((new Date(rental.endDate) - Date.now()) / (1000 * 60 * 60 * 24)))}
- Payment Due: Day ${rental.paymentDueDay} of each month
- Next Payment: ${rental.nextPaymentDue ? new Date(rental.nextPaymentDue).toLocaleDateString() : "Not set"}
- Landlord: ${rental.landlord?.firstName} ${rental.landlord?.lastName} (${rental.landlord?.phone})
`;
        }
        break;
      }

      default:
        context = "";
    }
  } catch (error) {
    logger.warn(
      `Failed to build page context for ${pageName}: ${error.message}`,
    );
  }

  return context;
};

/**
 * Build role-specific instructions for the AI.
 */
const buildRoleInstructions = (userRole) => {
  switch (userRole) {
    case "tenant":
      return `
You are helping a TENANT. Focus on:
- Finding properties that match their needs
- Understanding lease terms and tenant rights in Ethiopia
- Explaining payment schedules and what happens if rent is late
- Guiding them through the booking and signing process
- Answering maintenance request questions
- Explaining their rights as a tenant under Ethiopian law`;

    case "landlord":
      return `
You are helping a LANDLORD. Focus on:
- Property listing optimization and pricing advice
- Managing tenant relationships professionally
- Understanding landlord obligations under Ethiopian law
- Revenue optimization and occupancy improvement
- Handling maintenance requests and property upkeep
- KYC verification guidance and platform features`;

    case "admin":
      return `
You are helping a PLATFORM ADMIN. Focus on:
- Platform management and user support guidance
- Policy explanations and enforcement questions
- Analytics interpretation and business insights
- Technical platform questions`;

    default:
      return `
You are helping a visitor exploring NestFind. Focus on:
- Explaining how NestFind works
- Benefits of using the platform
- How to register and get started
- Overview of features for tenants and landlords`;
  }
};

// ── MAIN CHAT FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Start a new AI chat conversation.
 * Creates a new AIConversation record and returns the session.
 *
 * @param {Object} params - Conversation parameters
 * @returns {Object} - { conversationId, sessionId, greeting }
 */
const startConversation = async ({
  userId,
  userRole = "tenant",
  pageName = null,
  pageUrl = null,
  resourceId = null,
  language = "en",
  deviceInfo = {},
}) => {
  try {
    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString("hex");

    // Create conversation record
    const conversation = await AIConversation.create({
      user: userId,
      sessionId,
      feature: "chat_assistant",
      context: {
        pageName,
        pageUrl,
        relatedResourceType: null,
        relatedResourceId: resourceId || null,
        userRole,
        language,
      },
      deviceInfo,
      messages: [],
    });

    // Generate contextual greeting
    const greetings = {
      tenant:
        "Hello! I'm NestFind AI. I can help you find the perfect home, understand your lease, or answer any rental questions. What can I help you with today?",
      landlord:
        "Hello! I'm NestFind AI. I can help you manage your properties, optimize your listings, or answer questions about the platform. How can I assist you?",
      admin: "Hello Admin! I'm NestFind AI. How can I assist you today?",
      guest:
        "Welcome to NestFind! I'm your AI assistant. I can help you explore properties, understand how our platform works, or answer any questions. What would you like to know?",
    };

    const greeting = greetings[userRole] || greetings.guest;

    // Add greeting as first assistant message
    await conversation.addMessage("assistant", greeting, { tokens: 50 });

    logger.info(
      `AI conversation started: userId=${userId}, sessionId=${sessionId}`,
    );

    return {
      success: true,
      conversationId: conversation._id,
      sessionId,
      greeting,
    };
  } catch (error) {
    logger.error(`Failed to start AI conversation: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send a message in an existing conversation.
 * Handles context injection and response generation.
 *
 * @param {Object} params - Message parameters
 * @returns {Object} - { response, conversationId, tokensUsed }
 */
const sendMessage = async ({
  conversationId,
  userId,
  userRole = "tenant",
  message,
  pageName = null,
  resourceId = null,
  isVoiceMessage = false,
}) => {
  try {
    // Load conversation
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: userId,
      status: "active",
    });

    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found or has ended",
      };
    }

    // Build page context for better AI responses
    const pageContext = await buildPageContext(
      pageName || conversation.context.pageName,
      resourceId,
      userId,
    );

    // Build role-specific instructions
    const roleInstructions = buildRoleInstructions(userRole);

    // Build enhanced system prompt with current context
    const systemPrompt = `${aiService.FEATURE_PROMPTS.chat_assistant}

${roleInstructions}

${pageContext ? `Current Page Context:\n${pageContext}` : ""}

Important guidelines:
- Keep responses concise (2-4 paragraphs maximum)
- Use bullet points for lists
- Always be helpful and professional
- If asked about specific property prices or availability, refer to the context provided
- For legal questions, provide general guidance and recommend consulting a legal professional
- Never make up specific property listings or prices not provided in context`;

    // Get conversation history for API
    const historyMessages = conversation.getMessagesForAPI(10);

    // Send to Claude
    const result = await aiService.sendMessage(message, "chat_assistant", {
      systemPrompt,
      conversationHistory: historyMessages,
      maxTokens: 800,
    });

    if (!result.success) {
      return {
        success: false,
        error: "AI service temporarily unavailable. Please try again.",
      };
    }

    // Save messages to conversation
    await conversation.addMessage("user", message, {
      tokens: result.inputTokens,
      isVoiceMessage,
    });
    await conversation.addMessage("assistant", result.content, {
      tokens: result.outputTokens,
      responseTimeMs: result.responseTimeMs,
    });

    // Log AI usage
    await aiService.logAIUsage({
      userId,
      feature: "chat_assistant",
      action: "ai_chat_initiated",
      tokensUsed: result.tokensUsed,
      responseTimeMs: result.responseTimeMs,
      success: true,
    });

    return {
      success: true,
      response: result.content,
      conversationId,
      tokensUsed: result.tokensUsed,
      responseTimeMs: result.responseTimeMs,
    };
  } catch (error) {
    logger.error(`Chat message failed: ${error.message}`);
    return {
      success: false,
      error: "Failed to process your message. Please try again.",
    };
  }
};

/**
 * Stream a chat response to the client.
 * Used when real-time word-by-word response is needed.
 *
 * @param {Object} params - Stream parameters
 * @param {Response} res - Express response object
 */
const streamChatResponse = async (
  {
    conversationId,
    userId,
    userRole = "tenant",
    message,
    pageName = null,
    resourceId = null,
  },
  res,
) => {
  try {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: userId,
      status: "active",
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const pageContext = await buildPageContext(pageName, resourceId, userId);
    const roleInstructions = buildRoleInstructions(userRole);

    const systemPrompt = `${aiService.FEATURE_PROMPTS.chat_assistant}
${roleInstructions}
${pageContext ? `\nCurrent Context:\n${pageContext}` : ""}`;

    const historyMessages = conversation.getMessagesForAPI(10);

    // Save user message immediately
    await conversation.addMessage("user", message);

    // Stream response
    await aiService.streamMessage(
      message,
      res,
      "chat_assistant",
      historyMessages,
      { systemPrompt, maxTokens: 800 },
    );
  } catch (error) {
    logger.error(`Chat stream failed: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Streaming failed",
      });
    }
  }
};

/**
 * End a conversation and generate a summary.
 *
 * @param {string} conversationId - Conversation to end
 * @param {string} userId - User ID for verification
 * @returns {Object} - { success, summary }
 */
const endConversation = async (conversationId, userId) => {
  try {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: userId,
    });

    if (!conversation || conversation.messages.length === 0) {
      return { success: true };
    }

    // Generate conversation summary if there were multiple messages
    let summary = null;
    if (conversation.messages.length > 4) {
      const historyText = conversation.messages
        .slice(-10)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const summaryResult = await aiService.sendMessage(
        `Summarize this conversation in 1-2 sentences: ${historyText}`,
        "chat_assistant",
        { maxTokens: 100 },
      );

      if (summaryResult.success) {
        summary = summaryResult.content;
      }
    }

    await conversation.endConversation("user_ended", null, summary);

    return { success: true, summary };
  } catch (error) {
    logger.error(`Failed to end conversation: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get conversation history for a user.
 *
 * @param {string} userId - User ID
 * @param {number} limit - Number of conversations to return
 * @returns {Array} - Array of conversation summaries
 */
const getConversationHistory = async (userId, limit = 10) => {
  try {
    return await AIConversation.getUserConversations(
      userId,
      "chat_assistant",
      limit,
    );
  } catch (error) {
    logger.error(`Failed to get conversation history: ${error.message}`);
    return [];
  }
};

/**
 * Get quick suggested replies based on user context.
 * Shown as clickable buttons below the AI response.
 *
 * @param {string} userRole - User's role
 * @param {string} pageName - Current page
 * @returns {Array} - Array of suggested reply strings
 */
const getSuggestedReplies = (userRole, pageName) => {
  const suggestions = {
    tenant: {
      default: [
        "How do I book a property visit?",
        "What documents do I need to rent?",
        "How does the payment process work?",
        "What are my rights as a tenant?",
      ],
      property_detail: [
        "Is this property available?",
        "How do I schedule a visit?",
        "Can I negotiate the rent?",
        "What utilities are included?",
      ],
      my_contracts: [
        "Explain my lease terms",
        "What happens if I pay late?",
        "How do I request maintenance?",
        "Can I terminate early?",
      ],
      active_rental: [
        "When is my next payment due?",
        "How do I submit a maintenance request?",
        "How do I renew my lease?",
        "What is my notice period?",
      ],
    },
    landlord: {
      default: [
        "How do I list a property?",
        "What is the platform commission?",
        "How do I verify tenant identity?",
        "Tips to improve my listing",
      ],
      property_detail: [
        "How do I edit this listing?",
        "How do I feature this property?",
        "What makes a good listing?",
        "How do I set the right price?",
      ],
    },
    guest: {
      default: [
        "How does NestFind work?",
        "How do I register?",
        "Is this platform safe?",
        "How are listings verified?",
      ],
    },
  };

  const roleSuggestions = suggestions[userRole] || suggestions.guest;
  return roleSuggestions[pageName] || roleSuggestions.default || [];
};

module.exports = {
  startConversation,
  sendMessage,
  streamChatResponse,
  endConversation,
  getConversationHistory,
  getSuggestedReplies,
  buildPageContext,
  buildRoleInstructions,
};
