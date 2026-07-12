const mongoose = require("mongoose");

const recommendedPropertySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    // Overall match score (0-100)
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Individual scoring breakdown
    scoreBreakdown: {
      locationScore: { type: Number, default: 0, min: 0, max: 100 },
      priceScore: { type: Number, default: 0, min: 0, max: 100 },
      bedroomsScore: { type: Number, default: 0, min: 0, max: 100 },
      amenitiesScore: { type: Number, default: 0, min: 0, max: 100 },
      ratingScore: { type: Number, default: 0, min: 0, max: 100 },
      availabilityScore: { type: Number, default: 0, min: 0, max: 100 },
    },
    // Human-readable reasons shown to tenant
    matchReasons: [{ type: String }],
    // Rank in the recommendation list
    rank: {
      type: Number,
      required: true,
    },
    // Recommendation category
    category: {
      type: String,
      enum: [
        "best_match",
        "budget_friendly",
        "top_rated",
        "newly_listed",
        "similar_to_saved",
        "popular_in_area",
        "ai_pick",
      ],
      default: "best_match",
    },
    // Tenant interaction with this recommendation
    interaction: {
      wasViewed: { type: Boolean, default: false },
      viewedAt: { type: Date, default: null },
      wasSaved: { type: Boolean, default: false },
      savedAt: { type: Date, default: null },
      wasBooked: { type: Boolean, default: false },
      bookedAt: { type: Date, default: null },
      wasClicked: { type: Boolean, default: false },
      clickedAt: { type: Date, default: null },
      wasSkipped: { type: Boolean, default: false },
      skippedAt: { type: Date, default: null },
    },
  },
  { _id: true },
);

const aiRecommendationSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant reference is required"],
    },

    // ── RECOMMENDATION BATCH ──────────────────────────────────────────────────
    // Unique identifier for this recommendation batch
    batchId: {
      type: String,
      required: true,
      unique: true,
    },

    // ── RECOMMENDED PROPERTIES ────────────────────────────────────────────────
    recommendations: [recommendedPropertySchema],

    // ── TENANT PREFERENCES USED ───────────────────────────────────────────────
    // Snapshot of preferences used to generate these recommendations
    preferencesUsed: {
      preferredCities: [{ type: String }],
      preferredSubCities: [{ type: String }],
      preferredPropertyTypes: [{ type: String }],
      preferredAmenities: [{ type: String }],
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 0 },
      preferredBedrooms: { type: Number, default: null },
      // Signals from saved properties
      savedPropertySignals: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      // Search history signals
      searchHistorySignals: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    // ── GENERATION DETAILS ────────────────────────────────────────────────────
    generationMethod: {
      type: String,
      enum: [
        "collaborative_filtering",
        "content_based",
        "hybrid",
        "ai_claude",
        "rule_based",
      ],
      default: "ai_claude",
    },
    aiModel: {
      type: String,
      default: "claude-sonnet-4-6",
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    generationTimeMs: {
      type: Number,
      default: 0,
    },
    totalPropertiesConsidered: {
      type: Number,
      default: 0,
    },
    aiReasoning: {
      type: String,
      default: null,
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "expired", "refreshed"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // ── PERFORMANCE METRICS ───────────────────────────────────────────────────
    metrics: {
      totalViewed: { type: Number, default: 0 },
      totalClicked: { type: Number, default: 0 },
      totalSaved: { type: Number, default: 0 },
      totalBooked: { type: Number, default: 0 },
      totalSkipped: { type: Number, default: 0 },
      clickThroughRate: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },

    // ── TRIGGER ───────────────────────────────────────────────────────────────
    // What triggered this recommendation generation
    trigger: {
      type: String,
      enum: [
        "user_login",
        "new_search",
        "property_saved",
        "schedule",
        "manual_refresh",
        "new_property_available",
      ],
      default: "schedule",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
aiRecommendationSchema.index({ tenant: 1, status: 1 });
aiRecommendationSchema.index({ tenant: 1, createdAt: -1 });
aiRecommendationSchema.index({ batchId: 1 }, { unique: true });
aiRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiRecommendationSchema.index({ status: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
aiRecommendationSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

aiRecommendationSchema.virtual("totalRecommendations").get(function () {
  return this.recommendations ? this.recommendations.length : 0;
});

aiRecommendationSchema.virtual("topRecommendation").get(function () {
  if (!this.recommendations || this.recommendations.length === 0) return null;
  return this.recommendations.reduce((best, current) =>
    current.matchScore > best.matchScore ? current : best,
  );
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Generate unique batch ID
aiRecommendationSchema.pre("save", function (next) {
  if (this.isNew && !this.batchId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const userId = this.tenant.toString().slice(-6).toUpperCase();
    this.batchId = `REC-${userId}-${timestamp}`;
  }
  next();
});

// Update metrics
aiRecommendationSchema.pre("save", function (next) {
  if (this.isModified("recommendations")) {
    const recs = this.recommendations;
    this.metrics.totalViewed = recs.filter(
      (r) => r.interaction.wasViewed,
    ).length;
    this.metrics.totalClicked = recs.filter(
      (r) => r.interaction.wasClicked,
    ).length;
    this.metrics.totalSaved = recs.filter((r) => r.interaction.wasSaved).length;
    this.metrics.totalBooked = recs.filter(
      (r) => r.interaction.wasBooked,
    ).length;
    this.metrics.totalSkipped = recs.filter(
      (r) => r.interaction.wasSkipped,
    ).length;

    // Calculate rates
    const total = recs.length;
    if (total > 0) {
      this.metrics.clickThroughRate = Math.round(
        (this.metrics.totalClicked / total) * 100,
      );
      this.metrics.conversionRate = Math.round(
        (this.metrics.totalBooked / total) * 100,
      );
    }
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get latest active recommendations for a tenant
aiRecommendationSchema.statics.getActiveForTenant = async function (tenantId) {
  return await this.findOne({
    tenant: tenantId,
    status: "active",
    expiresAt: { $gt: new Date() },
  })
    .populate({
      path: "recommendations.property",
      select:
        "title location details pricing amenities coverImage stats ai propertyType isOccupied status",
      populate: {
        path: "landlord",
        select: "firstName lastName avatar landlordProfile isKYCVerified",
      },
    })
    .sort({ createdAt: -1 });
};

// Mark old recommendations as expired when new ones are generated
aiRecommendationSchema.statics.expireOldRecommendations = async function (
  tenantId,
) {
  return await this.updateMany(
    { tenant: tenantId, status: "active" },
    { status: "expired" },
  );
};

// Get recommendation performance stats for admin
aiRecommendationSchema.statics.getPerformanceStats = async function (
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
        _id: null,
        totalBatches: { $sum: 1 },
        avgClickThroughRate: { $avg: "$metrics.clickThroughRate" },
        avgConversionRate: { $avg: "$metrics.conversionRate" },
        totalClicks: { $sum: "$metrics.totalClicked" },
        totalBookings: { $sum: "$metrics.totalBooked" },
        totalSaves: { $sum: "$metrics.totalSaved" },
        avgTokensUsed: { $avg: "$tokensUsed" },
        avgGenerationTime: { $avg: "$generationTimeMs" },
      },
    },
  ]);
};

// Get recommendation history for a tenant
aiRecommendationSchema.statics.getTenantHistory = function (
  tenantId,
  limit = 5,
) {
  return this.find({ tenant: tenantId })
    .select("batchId status metrics trigger createdAt totalRecommendations")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Record tenant interaction with a specific recommendation
aiRecommendationSchema.methods.recordInteraction = async function (
  propertyId,
  interactionType,
) {
  const validTypes = [
    "wasViewed",
    "wasSaved",
    "wasBooked",
    "wasClicked",
    "wasSkipped",
  ];

  if (!validTypes.includes(interactionType)) return null;

  const recommendation = this.recommendations.find(
    (r) => r.property.toString() === propertyId.toString(),
  );

  if (!recommendation) return null;

  recommendation.interaction[interactionType] = true;
  recommendation.interaction[interactionType.replace("was", "") + "At"] =
    new Date();

  return await this.save();
};

// Mark batch as delivered to tenant
aiRecommendationSchema.methods.markDelivered = async function () {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  return await this.save();
};

// Expire this recommendation batch
aiRecommendationSchema.methods.expire = async function () {
  this.status = "expired";
  return await this.save();
};

// Get top N recommendations by score
aiRecommendationSchema.methods.getTopRecommendations = function (n = 6) {
  return this.recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, n);
};

const AIRecommendation = mongoose.model(
  "AIRecommendation",
  aiRecommendationSchema,
);

module.exports = AIRecommendation;
