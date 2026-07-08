const mongoose = require("mongoose");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema(
  {
    // ── OWNERSHIP ─────────────────────────────────────────────────────────────
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Landlord reference is required"],
    },

    // ── BASIC INFO ────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: {
        values: [
          "apartment",
          "villa",
          "house",
          "studio",
          "commercial",
          "duplex",
          "penthouse",
          "other",
        ],
        message: "Invalid property type",
      },
    },

    // ── LOCATION ──────────────────────────────────────────────────────────────
    location: {
      address: {
        type: String,
        required: [true, "Property address is required"],
        trim: true,
      },
      subCity: {
        type: String,
        required: [true, "Sub-city is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        default: "Addis Ababa",
      },
      region: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: "Ethiopia",
      },
      landmark: {
        type: String,
        trim: true,
      },
      // GeoJSON coordinates for map display and location-based search
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [38.7614, 9.0248], // Default: Addis Ababa center
        },
      },
    },

    // ── PROPERTY DETAILS ──────────────────────────────────────────────────────
    details: {
      bedrooms: {
        type: Number,
        required: [true, "Number of bedrooms is required"],
        min: [0, "Bedrooms cannot be negative"],
        max: [20, "Bedrooms cannot exceed 20"],
      },
      bathrooms: {
        type: Number,
        required: [true, "Number of bathrooms is required"],
        min: [1, "At least 1 bathroom is required"],
        max: [20, "Bathrooms cannot exceed 20"],
      },
      area: {
        type: Number,
        required: [true, "Property area is required"],
        min: [10, "Area must be at least 10 square meters"],
      },
      areaUnit: {
        type: String,
        enum: ["sqm", "sqft"],
        default: "sqm",
      },
      floorNumber: {
        type: Number,
        min: [0, "Floor number cannot be negative"],
      },
      totalFloors: {
        type: Number,
        min: [1, "Building must have at least 1 floor"],
      },
      parkingSpaces: {
        type: Number,
        default: 0,
        min: [0, "Parking spaces cannot be negative"],
      },
      furnished: {
        type: String,
        enum: ["fully_furnished", "semi_furnished", "unfurnished"],
        required: [true, "Furnishing status is required"],
      },
      yearBuilt: {
        type: Number,
        min: [1900, "Year built cannot be before 1900"],
        max: [
          new Date().getFullYear() + 1,
          "Year built cannot be in the future",
        ],
      },
      facing: {
        type: String,
        enum: [
          "north",
          "south",
          "east",
          "west",
          "northeast",
          "northwest",
          "southeast",
          "southwest",
        ],
      },
    },

    // ── AMENITIES ─────────────────────────────────────────────────────────────
    amenities: {
      // Utilities
      wifi: { type: Boolean, default: false },
      generator: { type: Boolean, default: false },
      waterTank: { type: Boolean, default: false },
      solarPower: { type: Boolean, default: false },
      // Security
      security24h: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      intercom: { type: Boolean, default: false },
      securityDoor: { type: Boolean, default: false },
      // Transport & Access
      parking: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      wheelchairAccess: { type: Boolean, default: false },
      // Recreation
      pool: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      rooftopTerrace: { type: Boolean, default: false },
      // Living
      airConditioning: { type: Boolean, default: false },
      heating: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      storageRoom: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      dishwasher: { type: Boolean, default: false },
      // Policies
      petFriendly: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      childFriendly: { type: Boolean, default: false },
    },

    // ── PRICING ───────────────────────────────────────────────────────────────
    pricing: {
      monthlyRent: {
        type: Number,
        required: [true, "Monthly rent is required"],
        min: [0, "Monthly rent cannot be negative"],
      },
      currency: {
        type: String,
        default: "ETB",
      },
      securityDeposit: {
        type: Number,
        default: 0,
        min: [0, "Security deposit cannot be negative"],
      },
      utilityBills: {
        type: String,
        enum: ["included", "excluded", "negotiable"],
        default: "negotiable",
      },
      latePaymentFee: {
        type: Number,
        default: 0,
      },
      latePaymentFeeType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "percentage",
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
    },

    // ── LEASE TERMS ───────────────────────────────────────────────────────────
    leaseTerms: {
      minimumLease: {
        type: Number,
        default: 6,
        min: [1, "Minimum lease must be at least 1 month"],
      },
      minimumLeaseUnit: {
        type: String,
        enum: ["months", "years"],
        default: "months",
      },
      maximumLease: {
        type: Number,
        default: 24,
      },
      availableFrom: {
        type: Date,
        default: Date.now,
      },
      noticePeriod: {
        type: Number,
        default: 30,
        min: [0, "Notice period cannot be negative"],
      },
      noticePeriodUnit: {
        type: String,
        enum: ["days", "months"],
        default: "days",
      },
    },

    // ── IMAGES ────────────────────────────────────────────────────────────────
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        isCover: { type: Boolean, default: false },
        caption: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    coverImage: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    videoTour: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    virtualTour360: {
      type: String,
      default: null,
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "pending_review",
          "active",
          "inactive",
          "rented",
          "unlisted",
        ],
        message: "Invalid property status",
      },
      default: "pending_review",
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    currentTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentRental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },

    // ── VISIBILITY & PROMOTION ────────────────────────────────────────────────
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },

    // ── STATISTICS ────────────────────────────────────────────────────────────
    stats: {
      totalViews: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalSaves: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      viewsThisWeek: { type: Number, default: 0 },
      viewsThisMonth: { type: Number, default: 0 },
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // Whether the description was AI-generated
      isDescriptionAIGenerated: {
        type: Boolean,
        default: false,
      },
      // AI-generated description (landlord can edit it)
      aiGeneratedDescription: {
        type: String,
        default: null,
      },
      // AI fraud detection score (0-100, higher = more suspicious)
      fraudScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      fraudFlags: [
        {
          flag: String,
          severity: {
            type: String,
            enum: ["low", "medium", "high"],
          },
          detectedAt: { type: Date, default: Date.now },
        },
      ],
      isFraudSuspected: {
        type: Boolean,
        default: false,
      },
      // AI recommendation score for tenants (calculated per tenant)
      baseRecommendationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      // AI-extracted tags for better search
      aiTags: [{ type: String }],
      // AI rent price suggestion
      aiSuggestedMinRent: { type: Number, default: null },
      aiSuggestedMaxRent: { type: Number, default: null },
      aiPriceSuggestedAt: { type: Date, default: null },
      // AI summary of the property (shown on listings)
      aiSummary: {
        type: String,
        default: null,
      },
      // Last time AI analyzed this property
      lastAIAnalysisAt: {
        type: Date,
        default: null,
      },
    },

    // ── MODERATION ────────────────────────────────────────────────────────────
    moderation: {
      isReported: { type: Boolean, default: false },
      reportCount: { type: Number, default: 0 },
      reportReasons: [{ type: String }],
      isFlagged: { type: Boolean, default: false },
      flaggedAt: { type: Date, default: null },
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      adminNotes: { type: String, default: null },
    },

    // ── SOFT DELETE ───────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
propertySchema.index({ slug: 1 }, { unique: true });
propertySchema.index({ landlord: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ "location.city": 1 });
propertySchema.index({ "location.subCity": 1 });
propertySchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index
propertySchema.index({ propertyType: 1 });
propertySchema.index({ "pricing.monthlyRent": 1 });
propertySchema.index({ "details.bedrooms": 1 });
propertySchema.index({ isFeatured: 1 });
propertySchema.index({ isOccupied: 1 });
propertySchema.index({ "stats.averageRating": -1 });
propertySchema.index({ "ai.fraudScore": 1 });
propertySchema.index({ createdAt: -1 });
// Full-text search index
propertySchema.index({
  title: "text",
  description: "text",
  "location.address": "text",
  "location.subCity": "text",
  "ai.aiTags": "text",
});

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
propertySchema.virtual("coverImageUrl").get(function () {
  if (this.coverImage && this.coverImage.url) return this.coverImage.url;
  if (this.images && this.images.length > 0) {
    const cover = this.images.find((img) => img.isCover);
    return cover ? cover.url : this.images[0].url;
  }
  return null;
});

propertySchema.virtual("isAvailable").get(function () {
  return this.status === "active" && !this.isOccupied && !this.isDeleted;
});

propertySchema.virtual("bedroomsLabel").get(function () {
  if (this.details.bedrooms === 0) return "Studio";
  return `${this.details.bedrooms} Bedroom${this.details.bedrooms > 1 ? "s" : ""}`;
});

propertySchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "property",
});

propertySchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "property",
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Auto-generate slug from title
propertySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  let baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.floor(Math.random() * 10000);
  this.slug = `${baseSlug}-${randomSuffix}`;

  next();
});

// Set cover image from images array
propertySchema.pre("save", function (next) {
  if (this.isModified("images") && this.images.length > 0) {
    const coverImg = this.images.find((img) => img.isCover);
    if (coverImg) {
      this.coverImage = {
        public_id: coverImg.public_id,
        url: coverImg.url,
      };
    } else if (!this.coverImage || !this.coverImage.url) {
      this.coverImage = {
        public_id: this.images[0].public_id,
        url: this.images[0].url,
      };
    }
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get featured properties for landing page
propertySchema.statics.getFeatured = function (limit = 8) {
  return this.find({
    isFeatured: true,
    status: "active",
    isOccupied: false,
    isDeleted: false,
  })
    .sort({ "stats.averageRating": -1 })
    .limit(limit)
    .populate("landlord", "firstName lastName avatar landlordProfile");
};

// Increment view count
propertySchema.statics.incrementViews = async function (propertyId) {
  return await this.findByIdAndUpdate(propertyId, {
    $inc: {
      "stats.totalViews": 1,
      "stats.viewsThisWeek": 1,
      "stats.viewsThisMonth": 1,
    },
  });
};

// Update average rating after a new review
propertySchema.statics.updateRating = async function (propertyId) {
  const Review = mongoose.model("Review");
  const stats = await Review.aggregate([
    { $match: { property: propertyId, isApproved: true } },
    {
      $group: {
        _id: "$property",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(propertyId, {
      "stats.averageRating": Math.round(stats[0].averageRating * 10) / 10,
      "stats.totalReviews": stats[0].totalReviews,
    });
  }
};

// Get platform property statistics for admin
propertySchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        occupied: {
          $sum: { $cond: ["$isOccupied", 1, 0] },
        },
        featured: {
          $sum: { $cond: ["$isFeatured", 1, 0] },
        },
        pendingReview: {
          $sum: {
            $cond: [{ $eq: ["$status", "pending_review"] }, 1, 0],
          },
        },
        flagged: {
          $sum: { $cond: ["$moderation.isFlagged", 1, 0] },
        },
        averageRent: { $avg: "$pricing.monthlyRent" },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      active: 0,
      occupied: 0,
      featured: 0,
      pendingReview: 0,
      flagged: 0,
      averageRent: 0,
    }
  );
};

// Soft delete
propertySchema.statics.softDelete = async function (propertyId) {
  return this.findByIdAndUpdate(propertyId, {
    isDeleted: true,
    deletedAt: new Date(),
    status: "unlisted",
  });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Check if property belongs to a landlord
propertySchema.methods.isOwnedBy = function (userId) {
  return this.landlord.toString() === userId.toString();
};

// Add AI fraud flag
propertySchema.methods.addFraudFlag = async function (
  flag,
  severity = "medium",
) {
  this.ai.fraudFlags.push({ flag, severity });
  this.ai.fraudScore = Math.min(
    100,
    this.ai.fraudScore +
      (severity === "high" ? 30 : severity === "medium" ? 15 : 5),
  );
  this.ai.isFraudSuspected = this.ai.fraudScore >= 50;
  await this.save();
};

// Update AI summary
propertySchema.methods.updateAISummary = async function (summary, tags = []) {
  this.ai.aiSummary = summary;
  this.ai.aiTags = tags;
  this.ai.lastAIAnalysisAt = new Date();
  await this.save();
};

// ── QUERY MIDDLEWARE ──────────────────────────────────────────────────────────
propertySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
