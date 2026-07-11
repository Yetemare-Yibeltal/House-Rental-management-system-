const mongoose = require("mongoose");
const slugify = require("slugify");

const blogPostSchema = new mongoose.Schema(
  {
    // ── AUTHOR ────────────────────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
    },

    // ── CONTENT ───────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Blog post title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Blog post content is required"],
      trim: true,
      minlength: [100, "Content must be at least 100 characters"],
    },

    // ── COVER IMAGE ───────────────────────────────────────────────────────────
    coverImage: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
      alt: { type: String, trim: true, default: null },
    },

    // ── CATEGORIZATION ────────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "rental_tips",
          "landlord_guide",
          "tenant_guide",
          "market_news",
          "legal_advice",
          "neighborhood_guide",
          "home_improvement",
          "ai_features",
          "company_news",
          "other",
        ],
        message: "Invalid blog category",
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // ── STATUS ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["draft", "scheduled", "published", "archived"],
        message: "Invalid blog post status",
      },
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },

    // ── SEO ───────────────────────────────────────────────────────────────────
    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: [70, "Meta title cannot exceed 70 characters"],
      },
      metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, "Meta description cannot exceed 160 characters"],
      },
      keywords: [{ type: String, trim: true }],
      canonicalUrl: { type: String, trim: true },
    },

    // ── STATS ─────────────────────────────────────────────────────────────────
    stats: {
      views: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      readTimeMinutes: { type: Number, default: 0 },
    },

    // ── SETTINGS ──────────────────────────────────────────────────────────────
    isFeatured: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: false,
    },
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

    // ── AI FEATURES ───────────────────────────────────────────────────────────
    ai: {
      // AI generated summary of the post
      aiSummary: {
        type: String,
        default: null,
      },
      // AI suggested tags
      suggestedTags: [{ type: String }],
      // AI readability score (0-100)
      readabilityScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // AI SEO score (0-100)
      seoScore: {
        type: Number,
        default: null,
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
blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ isFeatured: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index(
  { title: "text", content: "text", tags: "text" },
  { weights: { title: 3, tags: 2, content: 1 } },
);

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
blogPostSchema.virtual("isPublished").get(function () {
  return this.status === "published" && this.publishedAt <= new Date();
});

blogPostSchema.virtual("readTimeLabel").get(function () {
  const mins = this.stats.readTimeMinutes;
  if (!mins || mins < 1) return "Less than 1 min read";
  return `${mins} min read`;
});

// ── PRE-SAVE HOOKS ────────────────────────────────────────────────────────────

// Auto-generate slug from title
blogPostSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();
  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  const suffix = Date.now().toString(36);
  this.slug = `${baseSlug}-${suffix}`;
  next();
});

// Auto-generate excerpt from content
blogPostSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.excerpt) {
    const plainText = this.content.replace(/<[^>]+>/g, "");
    this.excerpt = plainText.substring(0, 300).trim() + "...";
  }
  next();
});

// Calculate read time
blogPostSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordCount = this.content.replace(/<[^>]+>/g, "").split(/\s+/).length;
    this.stats.readTimeMinutes = Math.ceil(wordCount / 200);
  }
  next();
});

// Set publishedAt when status changes to published
blogPostSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get published posts with pagination
blogPostSchema.statics.getPublished = function (
  page = 1,
  limit = 10,
  category = null,
) {
  const skip = (page - 1) * limit;
  const query = {
    status: "published",
    publishedAt: { $lte: new Date() },
    isDeleted: false,
  };
  if (category) query.category = category;

  return this.find(query)
    .populate("author", "firstName lastName avatar")
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("-content");
};

// Get featured posts
blogPostSchema.statics.getFeatured = function (limit = 3) {
  return this.find({
    status: "published",
    isFeatured: true,
    isDeleted: false,
  })
    .populate("author", "firstName lastName avatar")
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("-content");
};

// Get related posts by category and tags
blogPostSchema.statics.getRelated = function (
  postId,
  category,
  tags,
  limit = 3,
) {
  return this.find({
    _id: { $ne: postId },
    status: "published",
    isDeleted: false,
    $or: [{ category }, { tags: { $in: tags } }],
  })
    .populate("author", "firstName lastName avatar")
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("-content");
};

// Increment view count
blogPostSchema.statics.incrementViews = async function (postId) {
  return await this.findByIdAndUpdate(postId, {
    $inc: { "stats.views": 1 },
  });
};

// Soft delete
blogPostSchema.statics.softDelete = async function (postId) {
  return this.findByIdAndUpdate(postId, {
    isDeleted: true,
    deletedAt: new Date(),
    status: "archived",
  });
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Publish the post
blogPostSchema.methods.publish = async function () {
  this.status = "published";
  this.publishedAt = new Date();
  return await this.save();
};

// Archive the post
blogPostSchema.methods.archive = async function () {
  this.status = "archived";
  return await this.save();
};

// Update AI analysis
blogPostSchema.methods.updateAIAnalysis = async function (analysisData) {
  this.ai = { ...this.ai, ...analysisData, analyzedAt: new Date() };
  return await this.save();
};

// ── QUERY MIDDLEWARE ──────────────────────────────────────────────────────────
blogPostSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = BlogPost;
