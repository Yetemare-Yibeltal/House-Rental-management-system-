const mongoose = require("mongoose");

const savedPropertySchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant reference is required"],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },

    // ── ORGANIZATION ──────────────────────────────────────────────────────────
    // Optional folder/collection name for organizing saved properties
    collection: {
      type: String,
      trim: true,
      maxlength: [50, "Collection name cannot exceed 50 characters"],
      default: "default",
    },
    // Optional personal note about the property
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: null,
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    // Notify tenant if price drops
    notifyOnPriceDrop: {
      type: Boolean,
      default: false,
    },
    // Notify tenant if property becomes available
    notifyOnAvailability: {
      type: Boolean,
      default: true,
    },
    priceAtSaveTime: {
      type: Number,
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI match score for this tenant-property pair (0-100)
      matchScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // Why AI thinks this is a good match
      matchReasons: [{ type: String }],
      // Whether AI recommended this property
      wasAIRecommended: {
        type: Boolean,
        default: false,
      },
      // How tenant found this property
      discoverySource: {
        type: String,
        enum: [
          "search",
          "ai_recommendation",
          "featured",
          "similar_properties",
          "direct",
          "other",
        ],
        default: "direct",
      },
    },

    // ── INTERACTION TRACKING ──────────────────────────────────────────────────
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
// Compound unique index — tenant can only save a property once
savedPropertySchema.index({ tenant: 1, property: 1 }, { unique: true });
savedPropertySchema.index({ tenant: 1, collection: 1 });
savedPropertySchema.index({ tenant: 1, createdAt: -1 });
savedPropertySchema.index({ property: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
savedPropertySchema.virtual("priceDrop").get(function () {
  if (!this.priceAtSaveTime || !this.property?.pricing?.monthlyRent)
    return null;
  const drop = this.priceAtSaveTime - this.property.pricing.monthlyRent;
  return drop > 0 ? drop : 0;
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get all saved properties for a tenant
savedPropertySchema.statics.getTenantSaved = function (
  tenantId,
  collection = null,
  page = 1,
  limit = 12,
) {
  const skip = (page - 1) * limit;
  const query = { tenant: tenantId };
  if (collection) query.collection = collection;

  return this.find(query)
    .populate({
      path: "property",
      select:
        "title location details pricing amenities coverImage status isOccupied stats ai propertyType",
      populate: {
        path: "landlord",
        select: "firstName lastName avatar landlordProfile isKYCVerified",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Check if tenant has saved a specific property
savedPropertySchema.statics.isSaved = async function (tenantId, propertyId) {
  const saved = await this.findOne({
    tenant: tenantId,
    property: propertyId,
  });
  return !!saved;
};

// Toggle saved status — save if not saved, unsave if already saved
savedPropertySchema.statics.toggleSave = async function (
  tenantId,
  propertyId,
  propertyPrice = null,
) {
  const existing = await this.findOne({
    tenant: tenantId,
    property: propertyId,
  });

  if (existing) {
    await existing.deleteOne();
    return { saved: false, message: "Property removed from saved list" };
  }

  await this.create({
    tenant: tenantId,
    property: propertyId,
    priceAtSaveTime: propertyPrice,
  });

  return { saved: true, message: "Property saved successfully" };
};

// Get collections for a tenant
savedPropertySchema.statics.getTenantCollections = async function (tenantId) {
  const collections = await this.aggregate([
    { $match: { tenant: new mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: "$collection",
        count: { $sum: 1 },
        lastSaved: { $max: "$createdAt" },
      },
    },
    { $sort: { lastSaved: -1 } },
  ]);
  return collections;
};

// Get properties with price drops for tenant
savedPropertySchema.statics.getPriceDropAlerts = async function (tenantId) {
  const saved = await this.find({
    tenant: tenantId,
    notifyOnPriceDrop: true,
    priceAtSaveTime: { $ne: null },
  }).populate("property", "title location coverImage pricing status");

  return saved.filter(
    (s) => s.property && s.property.pricing.monthlyRent < s.priceAtSaveTime,
  );
};

// Count saved properties for a tenant
savedPropertySchema.statics.countTenantSaved = function (tenantId) {
  return this.countDocuments({ tenant: tenantId });
};

// Get AI recommendation data from saved properties
// Used by AI recommendation service to understand tenant preferences
savedPropertySchema.statics.getTenantPreferenceSignals = async function (
  tenantId,
) {
  const saved = await this.find({ tenant: tenantId })
    .populate("property", "propertyType location details pricing amenities ai")
    .sort({ createdAt: -1 })
    .limit(20);

  // Extract preference signals from saved properties
  const signals = {
    propertyTypes: [],
    subCities: [],
    cities: [],
    minBedrooms: Infinity,
    maxBedrooms: 0,
    minPrice: Infinity,
    maxPrice: 0,
    commonAmenities: {},
    aiTags: [],
  };

  saved.forEach((s) => {
    if (!s.property) return;
    const p = s.property;

    if (p.propertyType) signals.propertyTypes.push(p.propertyType);
    if (p.location?.subCity) signals.subCities.push(p.location.subCity);
    if (p.location?.city) signals.cities.push(p.location.city);

    if (p.details?.bedrooms !== undefined) {
      signals.minBedrooms = Math.min(signals.minBedrooms, p.details.bedrooms);
      signals.maxBedrooms = Math.max(signals.maxBedrooms, p.details.bedrooms);
    }

    if (p.pricing?.monthlyRent) {
      signals.minPrice = Math.min(signals.minPrice, p.pricing.monthlyRent);
      signals.maxPrice = Math.max(signals.maxPrice, p.pricing.monthlyRent);
    }

    if (p.amenities) {
      Object.entries(p.amenities).forEach(([key, val]) => {
        if (val === true) {
          signals.commonAmenities[key] =
            (signals.commonAmenities[key] || 0) + 1;
        }
      });
    }

    if (p.ai?.aiTags) {
      signals.aiTags.push(...p.ai.aiTags);
    }
  });

  // Normalize signals
  signals.minBedrooms =
    signals.minBedrooms === Infinity ? 0 : signals.minBedrooms;
  signals.minPrice = signals.minPrice === Infinity ? 0 : signals.minPrice;
  signals.maxPrice = signals.maxPrice === 0 ? 100000 : signals.maxPrice;

  return signals;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Update note on saved property
savedPropertySchema.methods.updateNote = async function (note) {
  this.note = note;
  return await this.save();
};

// Move to different collection
savedPropertySchema.methods.moveToCollection = async function (collectionName) {
  this.collection = collectionName;
  return await this.save();
};

// Increment view count
savedPropertySchema.methods.recordView = async function () {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  await this.save();
};

const SavedProperty = mongoose.model("SavedProperty", savedPropertySchema);

module.exports = SavedProperty;
