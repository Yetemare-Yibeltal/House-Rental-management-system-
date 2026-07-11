const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    // ── CONTENT ───────────────────────────────────────────────────────────────
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters"],
      maxlength: [300, "Question cannot exceed 300 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      minlength: [20, "Answer must be at least 20 characters"],
      maxlength: [3000, "Answer cannot exceed 3000 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    // ── CATEGORIZATION ────────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "general",
          "tenant",
          "landlord",
          "payments",
          "contracts",
          "maintenance",
          "kyc",
          "ai_features",
          "account",
          "legal",
          "other",
        ],
        message: "Invalid FAQ category",
      },
    },
    tags: [{ type: String, trim: true, lowercase: true }],

    // ── DISPLAY ───────────────────────────────────────────────────────────────
    displayOrder: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // ── TARGET AUDIENCE ───────────────────────────────────────────────────────
    targetRole: {
      type: String,
      enum: ["all", "tenant", "landlord", "admin"],
      default: "all",
    },

    // ── STATS ─────────────────────────────────────────────────────────────────
    stats: {
      views: { type: Number, default: 0 },
      helpfulVotes: { type: Number, default: 0 },
      notHelpfulVotes: { type: Number, default: 0 },
    },

    // ── AUTHOR ────────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // Whether this FAQ was suggested by AI based on chat questions
      isAISuggested: {
        type: Boolean,
        default: false,
      },
      // AI generated answer alternative
      aiAnswer: {
        type: String,
        default: null,
      },
      // Related questions suggested by AI
      relatedQuestions: [{ type: String }],
      // Keywords extracted by AI for better search
      aiKeywords: [{ type: String }],
      analyzedAt: {
        type: Date,
        default: null,
      },
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
faqSchema.index({ category: 1, displayOrder: 1 });
faqSchema.index({ isPublished: 1 });
faqSchema.index({ isFeatured: 1 });
faqSchema.index({ targetRole: 1 });
faqSchema.index({ slug: 1 }, { unique: true });
faqSchema.index(
  { question: "text", answer: "text", tags: "text" },
  { weights: { question: 3, tags: 2, answer: 1 } },
);

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
faqSchema.virtual("helpfulPercentage").get(function () {
  const total = this.stats.helpfulVotes + this.stats.notHelpfulVotes;
  if (total === 0) return null;
  return Math.round((this.stats.helpfulVotes / total) * 100);
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Auto-generate slug from question
faqSchema.pre("save", function (next) {
  if (!this.isModified("question")) return next();
  const base = this.question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60);
  const suffix = Date.now().toString(36);
  this.slug = `${base}-${suffix}`;
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get published FAQs by category
faqSchema.statics.getByCategory = function (category = null, role = "all") {
  const query = { isPublished: true, isDeleted: false };
  if (category) query.category = category;
  if (role !== "all") {
    query.targetRole = { $in: [role, "all"] };
  }
  return this.find(query).sort({ isFeatured: -1, displayOrder: 1 });
};

// Get featured FAQs for landing page
faqSchema.statics.getFeatured = function (limit = 6) {
  return this.find({
    isPublished: true,
    isFeatured: true,
    isDeleted: false,
  })
    .sort({ displayOrder: 1 })
    .limit(limit);
};

// Search FAQs
faqSchema.statics.search = function (query, role = "all") {
  const searchQuery = {
    isPublished: true,
    isDeleted: false,
    $text: { $search: query },
  };
  if (role !== "all") {
    searchQuery.targetRole = { $in: [role, "all"] };
  }
  return this.find(searchQuery, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(10);
};

// Get all categories with counts
faqSchema.statics.getCategoriesWithCounts = async function () {
  return await this.aggregate([
    { $match: { isPublished: true, isDeleted: false } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalViews: { $sum: "$stats.views" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Increment view count
faqSchema.statics.incrementViews = async function (faqId) {
  return await this.findByIdAndUpdate(faqId, {
    $inc: { "stats.views": 1 },
  });
};

// Vote helpful
faqSchema.statics.voteHelpful = async function (faqId, isHelpful) {
  const update = isHelpful
    ? { $inc: { "stats.helpfulVotes": 1 } }
    : { $inc: { "stats.notHelpfulVotes": 1 } };
  return await this.findByIdAndUpdate(faqId, update, { new: true });
};

// Soft delete
faqSchema.statics.softDelete = async function (faqId) {
  return this.findByIdAndUpdate(faqId, {
    isDeleted: true,
    deletedAt: new Date(),
    isPublished: false,
  });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Publish FAQ
faqSchema.methods.publish = async function () {
  this.isPublished = true;
  return await this.save();
};

// Unpublish FAQ
faqSchema.methods.unpublish = async function () {
  this.isPublished = false;
  return await this.save();
};

// Update AI analysis
faqSchema.methods.updateAIAnalysis = async function (data) {
  this.ai = { ...this.ai, ...data, analyzedAt: new Date() };
  return await this.save();
};

// ── QUERY MIDDLEWARE ──────────────────────────────────────────────────────────
faqSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const FAQ = mongoose.model("FAQ", faqSchema);

module.exports = FAQ;
