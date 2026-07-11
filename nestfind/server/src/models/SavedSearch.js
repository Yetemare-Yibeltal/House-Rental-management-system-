const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant reference is required"],
    },

    // ── SEARCH IDENTITY ───────────────────────────────────────────────────────
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Search name cannot exceed 100 characters"],
      default: null,
    },

    // ── TRADITIONAL SEARCH FILTERS ────────────────────────────────────────────
    filters: {
      keyword: {
        type: String,
        trim: true,
        default: null,
      },
      city: {
        type: String,
        trim: true,
        default: null,
      },
      subCity: {
        type: String,
        trim: true,
        default: null,
      },
      propertyType: {
        type: [String],
        default: [],
      },
      minPrice: {
        type: Number,
        default: null,
      },
      maxPrice: {
        type: Number,
        default: null,
      },
      minBedrooms: {
        type: Number,
        default: null,
      },
      maxBedrooms: {
        type: Number,
        default: null,
      },
      minBathrooms: {
        type: Number,
        default: null,
      },
      furnished: {
        type: String,
        enum: ["fully_furnished", "semi_furnished", "unfurnished", null],
        default: null,
      },
      amenities: {
        type: [String],
        default: [],
      },
      minArea: {
        type: Number,
        default: null,
      },
      maxArea: {
        type: Number,
        default: null,
      },
      sortBy: {
        type: String,
        enum: [
          "newest",
          "price_low",
          "price_high",
          "rating",
          "most_viewed",
          null,
        ],
        default: null,
      },
    },

    // ── AI NATURAL LANGUAGE SEARCH ────────────────────────────────────────────
    ai: {
      // Original natural language query typed by user
      naturalLanguageQuery: {
        type: String,
        trim: true,
        default: null,
      },
      // Whether this was an AI-powered natural language search
      isAISearch: {
        type: Boolean,
        default: false,
      },
      // How AI interpreted the query (shown to user for transparency)
      aiInterpretation: {
        type: String,
        trim: true,
        default: null,
      },
      // Confidence score of AI interpretation (0-100)
      aiConfidenceScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI extracted entities from natural language query
      extractedEntities: {
        locations: [{ type: String }],
        priceRange: {
          min: { type: Number, default: null },
          max: { type: Number, default: null },
        },
        propertyFeatures: [{ type: String }],
        amenities: [{ type: String }],
        timeframe: { type: String, default: null },
      },
      // AI generated search summary shown to user
      searchSummary: {
        type: String,
        default: null,
      },
    },

    // ── ALERTS ────────────────────────────────────────────────────────────────
    alertEnabled: {
      type: Boolean,
      default: true,
    },
    alertFrequency: {
      type: String,
      enum: ["instant", "daily", "weekly"],
      default: "daily",
    },
    alertChannels: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    lastAlertSentAt: {
      type: Date,
      default: null,
    },
    totalAlertsReceived: {
      type: Number,
      default: 0,
    },

    // ── USAGE TRACKING ────────────────────────────────────────────────────────
    totalRuns: {
      type: Number,
      default: 1,
    },
    lastRunAt: {
      type: Date,
      default: Date.now,
    },
    lastResultCount: {
      type: Number,
      default: null,
    },
    newResultsSinceLastAlert: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
savedSearchSchema.index({ tenant: 1, createdAt: -1 });
savedSearchSchema.index({ tenant: 1, alertEnabled: 1 });
savedSearchSchema.index({ alertEnabled: 1, alertFrequency: 1 });
savedSearchSchema.index({ lastAlertSentAt: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
savedSearchSchema.virtual("searchLabel").get(function () {
  if (this.name) return this.name;
  if (this.ai.isAISearch && this.ai.naturalLanguageQuery) {
    return this.ai.naturalLanguageQuery;
  }
  const parts = [];
  if (this.filters.keyword) parts.push(this.filters.keyword);
  if (this.filters.subCity) parts.push(this.filters.subCity);
  if (this.filters.city) parts.push(this.filters.city);
  if (this.filters.propertyType?.length > 0) {
    parts.push(this.filters.propertyType.join("/"));
  }
  if (this.filters.minBedrooms) {
    parts.push(`${this.filters.minBedrooms}+ beds`);
  }
  if (this.filters.maxPrice) {
    parts.push(`Under ETB ${this.filters.maxPrice.toLocaleString()}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Custom search";
});

savedSearchSchema.virtual("isDue").get(function () {
  if (!this.alertEnabled || !this.lastAlertSentAt) return true;
  const now = Date.now();
  const last = this.lastAlertSentAt.getTime();
  if (this.alertFrequency === "instant") return true;
  if (this.alertFrequency === "daily") {
    return now - last > 24 * 60 * 60 * 1000;
  }
  if (this.alertFrequency === "weekly") {
    return now - last > 7 * 24 * 60 * 60 * 1000;
  }
  return false;
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get all saved searches for a tenant
savedSearchSchema.statics.getTenantSearches = function (tenantId) {
  return this.find({ tenant: tenantId }).sort({ lastRunAt: -1 });
};

// Get saved searches due for alert notifications
savedSearchSchema.statics.getDueForAlert = async function () {
  const now = new Date();
  const dailyThreshold = new Date(now - 24 * 60 * 60 * 1000);
  const weeklyThreshold = new Date(now - 7 * 24 * 60 * 60 * 1000);

  return await this.find({
    alertEnabled: true,
    $or: [
      { alertFrequency: "instant" },
      {
        alertFrequency: "daily",
        $or: [
          { lastAlertSentAt: null },
          { lastAlertSentAt: { $lt: dailyThreshold } },
        ],
      },
      {
        alertFrequency: "weekly",
        $or: [
          { lastAlertSentAt: null },
          { lastAlertSentAt: { $lt: weeklyThreshold } },
        ],
      },
    ],
  }).populate(
    "tenant",
    "firstName lastName email phone notificationPreferences",
  );
};

// Build MongoDB query from saved search filters
savedSearchSchema.statics.buildPropertyQuery = function (filters) {
  const query = {
    status: "active",
    isOccupied: false,
    isDeleted: false,
  };

  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }
  if (filters.city) {
    query["location.city"] = { $regex: filters.city, $options: "i" };
  }
  if (filters.subCity) {
    query["location.subCity"] = { $regex: filters.subCity, $options: "i" };
  }
  if (filters.propertyType?.length > 0) {
    query.propertyType = { $in: filters.propertyType };
  }
  if (filters.minPrice || filters.maxPrice) {
    query["pricing.monthlyRent"] = {};
    if (filters.minPrice) query["pricing.monthlyRent"].$gte = filters.minPrice;
    if (filters.maxPrice) query["pricing.monthlyRent"].$lte = filters.maxPrice;
  }
  if (filters.minBedrooms || filters.maxBedrooms) {
    query["details.bedrooms"] = {};
    if (filters.minBedrooms) {
      query["details.bedrooms"].$gte = filters.minBedrooms;
    }
    if (filters.maxBedrooms) {
      query["details.bedrooms"].$lte = filters.maxBedrooms;
    }
  }
  if (filters.furnished) {
    query["details.furnished"] = filters.furnished;
  }
  if (filters.amenities?.length > 0) {
    filters.amenities.forEach((amenity) => {
      query[`amenities.${amenity}`] = true;
    });
  }
  if (filters.minArea || filters.maxArea) {
    query["details.area"] = {};
    if (filters.minArea) query["details.area"].$gte = filters.minArea;
    if (filters.maxArea) query["details.area"].$lte = filters.maxArea;
  }

  return query;
};

// Record that alert was sent
savedSearchSchema.statics.recordAlertSent = async function (
  searchId,
  resultCount,
) {
  return await this.findByIdAndUpdate(searchId, {
    lastAlertSentAt: new Date(),
    $inc: { totalAlertsReceived: 1 },
    newResultsSinceLastAlert: 0,
    lastResultCount: resultCount,
  });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Record that search was run
savedSearchSchema.methods.recordRun = async function (resultCount = null) {
  this.totalRuns += 1;
  this.lastRunAt = new Date();
  if (resultCount !== null) this.lastResultCount = resultCount;
  return await this.save();
};

// Update alert settings
savedSearchSchema.methods.updateAlertSettings = async function (settings) {
  if (settings.alertEnabled !== undefined) {
    this.alertEnabled = settings.alertEnabled;
  }
  if (settings.alertFrequency) {
    this.alertFrequency = settings.alertFrequency;
  }
  if (settings.alertChannels) {
    this.alertChannels = { ...this.alertChannels, ...settings.alertChannels };
  }
  return await this.save();
};

// Rename saved search
savedSearchSchema.methods.rename = async function (name) {
  this.name = name;
  return await this.save();
};

const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);

module.exports = SavedSearch;
