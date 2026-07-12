const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // For voice messages
    isVoiceMessage: {
      type: Boolean,
      default: false,
    },
    // Audio URL if voice response was generated
    audioUrl: {
      type: String,
      default: null,
    },
    // Token count for this message
    tokens: {
      type: Number,
      default: 0,
    },
    // Time taken to generate response in ms
    responseTimeMs: {
      type: Number,
      default: null,
    },
    // Whether user found this helpful
    feedback: {
      isHelpful: { type: Boolean, default: null },
      comment: { type: String, trim: true, default: null },
      givenAt: { type: Date, default: null },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const aiConversationSchema = new mongoose.Schema(
  {
    // ── USER REFERENCE ────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // ── SESSION ───────────────────────────────────────────────────────────────
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },

    // ── AI FEATURE ────────────────────────────────────────────────────────────
    feature: {
      type: String,
      required: [true, "AI feature is required"],
      enum: {
        values: [
          "chat_assistant",
          "smart_search",
          "property_recommendation",
          "rent_advisor",
          "lease_explainer",
          "maintenance_diagnosis",
          "fraud_detection",
          "property_description",
          "general",
        ],
        message: "Invalid AI feature",
      },
      default: "chat_assistant",
    },

    // ── CONTEXT ───────────────────────────────────────────────────────────────
    context: {
      // Which page user was on when they started the conversation
      pageName: {
        type: String,
        trim: true,
        default: null,
      },
      pageUrl: {
        type: String,
        trim: true,
        default: null,
      },
      // Related resource (e.g. which property they were viewing)
      relatedResourceType: {
        type: String,
        enum: [
          "Property",
          "Contract",
          "Rental",
          "MaintenanceRequest",
          "Payment",
          null,
        ],
        default: null,
      },
      relatedResourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      // User role context
      userRole: {
        type: String,
        enum: ["tenant", "landlord", "admin", "guest"],
        default: "tenant",
      },
      // User's preferred language for AI responses
      language: {
        type: String,
        enum: ["en", "am"],
        default: "en",
      },
    },

    // ── MESSAGES ──────────────────────────────────────────────────────────────
    messages: [aiMessageSchema],

    // ── TOKEN USAGE ───────────────────────────────────────────────────────────
    tokenUsage: {
      totalInputTokens: { type: Number, default: 0 },
      totalOutputTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUSD: { type: Number, default: 0 },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "ended", "error"],
      default: "active",
    },
    endedAt: {
      type: Date,
      default: null,
    },
    endReason: {
      type: String,
      enum: ["user_ended", "timeout", "error", "max_messages_reached", null],
      default: null,
    },

    // ── QUALITY METRICS ───────────────────────────────────────────────────────
    metrics: {
      totalMessages: { type: Number, default: 0 },
      userMessages: { type: Number, default: 0 },
      assistantMessages: { type: Number, default: 0 },
      averageResponseTimeMs: { type: Number, default: 0 },
      helpfulRatings: { type: Number, default: 0 },
      unhelpfulRatings: { type: Number, default: 0 },
      durationSeconds: { type: Number, default: 0 },
    },

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    // AI generated summary of the conversation (generated on end)
    conversationSummary: {
      type: String,
      default: null,
    },

    // ── OUTCOME ───────────────────────────────────────────────────────────────
    // What action the user took after the conversation
    outcome: {
      type: String,
      enum: [
        "property_viewed",
        "property_saved",
        "booking_made",
        "search_performed",
        "contract_viewed",
        "payment_made",
        "maintenance_submitted",
        "no_action",
        null,
      ],
      default: null,
    },

    // ── MODERATION ────────────────────────────────────────────────────────────
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },

    // ── DEVICE INFO ───────────────────────────────────────────────────────────
    deviceInfo: {
      platform: {
        type: String,
        enum: ["web", "mobile", "desktop"],
        default: "web",
      },
      userAgent: { type: String, default: null },
      ipAddress: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
aiConversationSchema.index({ user: 1, createdAt: -1 });
aiConversationSchema.index({ user: 1, feature: 1 });
aiConversationSchema.index({ sessionId: 1 });
aiConversationSchema.index({ status: 1 });
aiConversationSchema.index({ createdAt: -1 });
aiConversationSchema.index({ isFlagged: 1 });
// TTL index — auto-delete conversations older than 90 days
aiConversationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
aiConversationSchema.virtual("messageCount").get(function () {
  return this.messages ? this.messages.length : 0;
});

aiConversationSchema.virtual("lastMessage").get(function () {
  if (!this.messages || this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

aiConversationSchema.virtual("satisfactionRate").get(function () {
  const total = this.metrics.helpfulRatings + this.metrics.unhelpfulRatings;
  if (total === 0) return null;
  return Math.round((this.metrics.helpfulRatings / total) * 100);
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Find or create an active conversation for a user session
aiConversationSchema.statics.findOrCreateSession = async function (
  userId,
  sessionId,
  feature = "chat_assistant",
  context = {},
) {
  let conversation = await this.findOne({
    user: userId,
    sessionId,
    feature,
    status: "active",
  });

  if (!conversation) {
    conversation = await this.create({
      user: userId,
      sessionId,
      feature,
      context,
      messages: [],
    });
  }

  return conversation;
};

// Get recent conversations for a user
aiConversationSchema.statics.getUserConversations = function (
  userId,
  feature = null,
  limit = 10,
) {
  const query = { user: userId };
  if (feature) query.feature = feature;

  return this.find(query)
    .select(
      "feature context status metrics tokenUsage createdAt conversationSummary",
    )
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get AI usage statistics for admin
aiConversationSchema.statics.getUsageStats = async function (
  startDate = null,
  endDate = null,
) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$feature",
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: "$metrics.totalMessages" },
        totalTokens: { $sum: "$tokenUsage.totalTokens" },
        avgSatisfaction: { $avg: "$metrics.helpfulRatings" },
        avgDuration: { $avg: "$metrics.durationSeconds" },
      },
    },
    { $sort: { totalConversations: -1 } },
  ]);
};

// Get flagged conversations for moderation
aiConversationSchema.statics.getFlaggedConversations = function (
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;
  return this.find({ isFlagged: true })
    .populate("user", "firstName lastName email role")
    .sort({ flaggedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Add a message to the conversation
aiConversationSchema.methods.addMessage = async function (
  role,
  content,
  options = {},
) {
  const message = {
    role,
    content,
    isVoiceMessage: options.isVoiceMessage || false,
    audioUrl: options.audioUrl || null,
    tokens: options.tokens || 0,
    responseTimeMs: options.responseTimeMs || null,
    timestamp: new Date(),
  };

  this.messages.push(message);

  // Update metrics
  this.metrics.totalMessages += 1;
  if (role === "user") this.metrics.userMessages += 1;
  if (role === "assistant") this.metrics.assistantMessages += 1;

  // Update token usage
  if (options.tokens) {
    this.tokenUsage.totalTokens += options.tokens;
    if (role === "user") {
      this.tokenUsage.totalInputTokens += options.tokens;
    } else {
      this.tokenUsage.totalOutputTokens += options.tokens;
    }
    // Estimate cost (Claude Sonnet: ~$0.003 per 1K tokens)
    this.tokenUsage.estimatedCostUSD =
      (this.tokenUsage.totalTokens / 1000) * 0.003;
  }

  return await this.save();
};

// End a conversation
aiConversationSchema.methods.endConversation = async function (
  reason = "user_ended",
  outcome = null,
  summary = null,
) {
  this.status = "ended";
  this.endedAt = new Date();
  this.endReason = reason;
  if (outcome) this.outcome = outcome;
  if (summary) this.conversationSummary = summary;

  // Calculate duration
  this.metrics.durationSeconds = Math.floor(
    (this.endedAt.getTime() - this.createdAt.getTime()) / 1000,
  );

  return await this.save();
};

// Add feedback to a message
aiConversationSchema.methods.addMessageFeedback = async function (
  messageId,
  isHelpful,
  comment = null,
) {
  const message = this.messages.id(messageId);
  if (!message) return null;

  message.feedback = {
    isHelpful,
    comment,
    givenAt: new Date(),
  };

  if (isHelpful) {
    this.metrics.helpfulRatings += 1;
  } else {
    this.metrics.unhelpfulRatings += 1;
  }

  return await this.save();
};

// Get messages formatted for Claude API
aiConversationSchema.methods.getMessagesForAPI = function (maxMessages = 10) {
  const relevantMessages = this.messages
    .filter((m) => m.role !== "system")
    .slice(-maxMessages);

  return relevantMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
};

// Flag conversation for moderation
aiConversationSchema.methods.flag = async function (reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedAt = new Date();
  return await this.save();
};

const AIConversation = mongoose.model("AIConversation", aiConversationSchema);

module.exports = AIConversation;
