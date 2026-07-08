const mongoose = require("mongoose");

const propertyImageSchema = new mongoose.Schema(
  {
    // ── REFERENCES ────────────────────────────────────────────────────────────
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },

    // ── CLOUDINARY DATA ───────────────────────────────────────────────────────
    public_id: {
      type: String,
      required: [true, "Cloudinary public_id is required"],
      unique: true,
    },
    url: {
      type: String,
      required: [true, "Image URL is required"],
    },
    secureUrl: {
      type: String,
      required: [true, "Secure image URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },

    // ── IMAGE METADATA ────────────────────────────────────────────────────────
    originalFilename: {
      type: String,
      trim: true,
    },
    format: {
      type: String,
      enum: ["jpg", "jpeg", "png", "webp"],
      lowercase: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    fileSize: {
      type: Number, // In bytes
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [200, "Caption cannot exceed 200 characters"],
    },

    // ── DISPLAY ───────────────────────────────────────────────────────────────
    isCover: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    imageType: {
      type: String,
      enum: [
        "exterior",
        "interior",
        "bedroom",
        "bathroom",
        "kitchen",
        "living_room",
        "dining_room",
        "balcony",
        "garden",
        "parking",
        "other",
      ],
      default: "other",
    },

    // ── AI ANALYSIS ───────────────────────────────────────────────────────────
    ai: {
      // Whether this image was analyzed by AI for fraud detection
      isAnalyzed: {
        type: Boolean,
        default: false,
      },
      // AI detected room/area type
      detectedType: {
        type: String,
        default: null,
      },
      // AI quality score (0-100)
      qualityScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      // Flags if image appears to be stock/stolen
      isStockImageSuspected: {
        type: Boolean,
        default: false,
      },
      // AI-generated alt text for accessibility
      altText: {
        type: String,
        default: null,
      },
      analyzedAt: {
        type: Date,
        default: null,
      },
    },

    // ── STATUS ────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── INDEXES ───────────────────────────────────────────────────────────────────
propertyImageSchema.index({ property: 1, displayOrder: 1 });
propertyImageSchema.index({ property: 1, isCover: 1 });
propertyImageSchema.index({ public_id: 1 }, { unique: true });
propertyImageSchema.index({ uploadedBy: 1 });
propertyImageSchema.index({ isDeleted: 1 });

// ── VIRTUALS ──────────────────────────────────────────────────────────────────
propertyImageSchema.virtual("aspectRatio").get(function () {
  if (this.width && this.height) {
    return (this.width / this.height).toFixed(2);
  }
  return null;
});

propertyImageSchema.virtual("fileSizeKB").get(function () {
  if (this.fileSize) {
    return (this.fileSize / 1024).toFixed(1);
  }
  return null;
});

// ── STATIC METHODS ────────────────────────────────────────────────────────────

// Get all images for a property ordered by display order
propertyImageSchema.statics.getPropertyImages = function (propertyId) {
  return this.find({
    property: propertyId,
    isDeleted: false,
    isActive: true,
  }).sort({ isCover: -1, displayOrder: 1 });
};

// Get cover image for a property
propertyImageSchema.statics.getCoverImage = function (propertyId) {
  return this.findOne({
    property: propertyId,
    isCover: true,
    isDeleted: false,
    isActive: true,
  });
};

// Set a new cover image for a property
propertyImageSchema.statics.setCoverImage = async function (
  propertyId,
  imageId,
) {
  // Remove cover flag from all images of this property
  await this.updateMany({ property: propertyId }, { isCover: false });

  // Set new cover image
  return await this.findByIdAndUpdate(
    imageId,
    { isCover: true, displayOrder: 0 },
    { new: true },
  );
};

// Reorder images for a property
propertyImageSchema.statics.reorderImages = async function (
  propertyId,
  imageOrders,
) {
  // imageOrders = [{ imageId, displayOrder }]
  const updatePromises = imageOrders.map(({ imageId, displayOrder }) =>
    this.findOneAndUpdate(
      { _id: imageId, property: propertyId },
      { displayOrder },
    ),
  );
  return await Promise.all(updatePromises);
};

// Soft delete all images for a property
propertyImageSchema.statics.deletePropertyImages = async function (propertyId) {
  return await this.updateMany(
    { property: propertyId },
    {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  );
};

// Count images for a property
propertyImageSchema.statics.countPropertyImages = function (propertyId) {
  return this.countDocuments({
    property: propertyId,
    isDeleted: false,
    isActive: true,
  });
};

// Get all public_ids for a property (for bulk Cloudinary deletion)
propertyImageSchema.statics.getPublicIds = async function (propertyId) {
  const images = await this.find(
    { property: propertyId, isDeleted: false },
    { public_id: 1 },
  );
  return images.map((img) => img.public_id);
};

// ── INSTANCE METHODS ──────────────────────────────────────────────────────────

// Soft delete this image
propertyImageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  await this.save();
};

// Update AI analysis results
propertyImageSchema.methods.updateAIAnalysis = async function (analysisData) {
  this.ai = {
    ...this.ai,
    ...analysisData,
    isAnalyzed: true,
    analyzedAt: new Date(),
  };
  await this.save();
};

// ── QUERY MIDDLEWARE ──────────────────────────────────────────────────────────
propertyImageSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const PropertyImage = mongoose.model("PropertyImage", propertyImageSchema);

module.exports = PropertyImage;

