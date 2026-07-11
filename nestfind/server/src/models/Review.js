const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer reference is required"],
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      default: null,
    },

    // ── REVIEW TYPE ───────────────────────────────────────────────────────────
    reviewType: {
      type: String,
      required: [true, "Review type is required"],
      enum: {
        values: [
          "tenant_reviews_property",
          "tenant_reviews_landlord",
          "landlord_reviews_tenant",
        ],
        message: "Invalid review type",
      },
    },

    // ── RATINGS ───────────────────────────────────────────────────────────────
    rating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    // Sub-ratings for property reviews
    subRatings: {
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      accuracy: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      location: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      maintenance: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
    },

    // ── CONTENT ───────────────────────────────────────────────────────────────
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [20, "Review must be at least 20 characters"],
      maxlength: [2000, "Review cannot exceed 2000 characters"],
    },

    // ── RESPONSE ──────────────────────────────────────────────────────────────
    // Landlord/tenant can respond to reviews
    response: {
      content: {
        type: String,
        trim: true,
        maxlength: [1000, "Response cannot exceed 1000 characters"],
      },
      respondedAt: { type: Date, default: null },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // ── MODERATION ────────────────────────────────────────────────────────────
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      trim: true,
      default: null,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },

    // ── VISIBILITY ────────────────────────────────────────────────────────────
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── HELPFUL VOTES ─────────────────────────────────────────────────────────
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI sentiment analysis
      sentiment: {
        type: String,
        enum: [
          "very_positive",
          "positive",
          "neutral",
          "negative",
          "very_negative",
          null,
        ],
        default: null,
      },
      sentimentScore: {
        type: Number,
        default: null,
        min: -1,
        max: 1,
      },
      // AI summary of the review
      aiSummary: {
        type: String,
        default: null,
      },
      // AI detected topics in the review
      detectedTopics: [{ type: String }],
      // Whether AI flagged review as inappropriate
      isAIFlagged: {
        type: Boolean,
        default: false,
      },
      aiFlagReason: {
        type: String,
        default: null,
      },
      // AI fake review detection score (0-100, higher = more suspicious)
      fakeReviewScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      analyzedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1, isApproved: 1 });
reviewSchema.index({ property: 1, isApproved: 1 });
reviewSchema.index({ rental: 1 });
reviewSchema.index({ reviewType: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1, isFlagged: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
reviewSchema.virtual("averageSubRating").get(function () {
  const ratings = Object.values(this.subRatings || {}).filter(
    (r) => r !== null && r !== undefined,
  );
  if (ratings.length === 0) return null;
  return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
});

reviewSchema.virtual("starDisplay").get(function () {
  return "★".repeat(this.rating) + "☆".repeat(5 - this.rating);
});

reviewSchema.virtual("hasResponse").get(function () {
  return !!(this.response && this.response.content);
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Auto-approve reviews from verified rentals
reviewSchema.pre("save", function (next) {
  if (this.isNew && this.isVerified) {
    this.isApproved = true;
    this.approvedAt = new Date();
  }
  next();
});

// Update property/user ratings after save
reviewSchema.post("save", async function () {
  try {
    if (this.property && this.isApproved) {
      await mongoose.model("Property").updateRating(this.property);
    }
    if (this.reviewee) {
      const Review = mongoose.model("Review");
      const stats = await Review.aggregate([
        {
          $match: {
            reviewee: this.reviewee,
            isApproved: true,
          },
        },
        {
          $group: {
            _id: "$reviewee",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        await mongoose.model("User").findByIdAndUpdate(this.reviewee, {
          "landlordProfile.averageRating":
            Math.round(stats[0].averageRating * 10) / 10,
          "landlordProfile.totalReviews": stats[0].totalReviews,
        });
      }
    }
  } catch (error) {
    console.error("Error updating ratings after review save:", error);
  }
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get approved reviews for a property
reviewSchema.statics.getPropertyReviews = function (
  propertyId,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;
  return this.find({
    property: propertyId,
    isApproved: true,
    isPublic: true,
  })
    .populate("reviewer", "firstName lastName avatar createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Get approved reviews for a landlord
reviewSchema.statics.getLandlordReviews = function (
  landlordId,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;
  return this.find({
    reviewee: landlordId,
    reviewType: "tenant_reviews_landlord",
    isApproved: true,
    isPublic: true,
  })
    .populate("reviewer", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Check if tenant already reviewed a property/landlord for a rental
reviewSchema.statics.hasReviewed = async function (
  reviewerId,
  reviewType,
  targetId,
) {
  const query = { reviewer: reviewerId, reviewType };
  if (reviewType === "tenant_reviews_property") query.property = targetId;
  if (reviewType === "tenant_reviews_landlord") query.reviewee = targetId;
  if (reviewType === "landlord_reviews_tenant") query.reviewee = targetId;

  const existing = await this.findOne(query);
  return !!existing;
};

// Get reviews pending moderation
reviewSchema.statics.getPendingModeration = function () {
  return this.find({
    isApproved: false,
    isRejected: false,
    isFlagged: false,
  })
    .populate("reviewer", "firstName lastName avatar")
    .populate("property", "title location")
    .populate("reviewee", "firstName lastName")
    .sort({ createdAt: -1 });
};

// Get platform review statistics
reviewSchema.statics.getPlatformStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$reviewType",
        count: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        approved: {
          $sum: { $cond: ["$isApproved", 1, 0] },
        },
        flagged: {
          $sum: { $cond: ["$isFlagged", 1, 0] },
        },
      },
    },
  ]);
  return stats;
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Approve review
reviewSchema.methods.approve = async function (approvedByUserId) {
  this.isApproved = true;
  this.isRejected = false;
  this.approvedAt = new Date();
  this.approvedBy = approvedByUserId;
  return await this.save();
};

// Reject review
reviewSchema.methods.reject = async function (reason, rejectedByUserId) {
  this.isRejected = true;
  this.isApproved = false;
  this.rejectionReason = reason;
  return await this.save();
};

// Flag review
reviewSchema.methods.flag = async function (reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedAt = new Date();
  return await this.save();
};

// Add helpful vote
reviewSchema.methods.addHelpfulVote = async function (userId) {
  if (!this.voters.includes(userId)) {
    this.voters.push(userId);
    this.helpfulVotes += 1;
    await this.save();
    return true;
  }
  return false;
};

// Add response to review
reviewSchema.methods.addResponse = async function (content, respondedByUserId) {
  this.response = {
    content,
    respondedAt: new Date(),
    respondedBy: respondedByUserId,
  };
  return await this.save();
};

// Save AI analysis
reviewSchema.methods.saveAIAnalysis = async function (analysisData) {
  this.ai = {
    ...this.ai,
    ...analysisData,
    analyzedAt: new Date(),
  };
  return await this.save();
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
