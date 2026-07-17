// nestfind/nestfind/server/src/controllers/propertyController.js

const { validationResult } = require("express-validator");
const Property = require("../models/Property");
const PropertyImage = require("../models/PropertyImage");
const SavedProperty = require("../models/SavedProperty");
const Review = require("../models/Review");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const cloudinaryService = require("../services/cloudinaryService");
const searchService = require("../services/searchService");
const geocodingService = require("../services/geocodingService");
const notificationService = require("../services/notificationService");
const fraudDetectionService = require("../services/ai/fraudDetectionService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");
const logger = require("../utils/logger");

// ── GET ALL PROPERTIES (PUBLIC) ───────────────────────────────────────────────
const getProperties = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    keyword,
    city,
    subCity,
    propertyType,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    furnished,
    amenities,
    sortBy = "newest",
    isFeatured,
    lat,
    lng,
    radius,
  } = req.query;

  const filters = {
    keyword,
    city,
    subCity,
    propertyType: propertyType ? propertyType.split(",") : [],
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    minBedrooms: minBedrooms ? Number(minBedrooms) : null,
    maxBedrooms: maxBedrooms ? Number(maxBedrooms) : null,
    furnished,
    amenities: amenities ? amenities.split(",") : [],
    isFeatured: isFeatured === "true" ? true : undefined,
    lat,
    lng,
    radius,
  };

  const result = await searchService.searchProperties(
    filters,
    { page: Number(page), limit: Math.min(Number(limit), 50) },
    sortBy,
  );

  if (!result.success) {
    return sendError(res, "Failed to fetch properties.", 500);
  }

  return sendPaginated(
    res,
    "Properties retrieved successfully.",
    result.properties,
    {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  );
});

// ── GET FEATURED PROPERTIES (PUBLIC) ─────────────────────────────────────────
const getFeaturedProperties = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const properties = await searchService.getFeaturedProperties(Number(limit));
  return sendSuccess(res, "Featured properties retrieved.", { properties });
});

// ── GET SINGLE PROPERTY (PUBLIC) ──────────────────────────────────────────────
const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id)
    .populate(
      "landlord",
      "firstName lastName avatar phone email landlordProfile isKYCVerified createdAt",
    )
    .populate("currentTenant", "firstName lastName avatar");

  if (!property) {
    return sendError(res, "Property not found.", 404);
  }

  // Increment view count
  await Property.incrementViews(id);

  // Check if current user has saved this property
  let isSaved = false;
  if (req.user) {
    isSaved = await SavedProperty.isSaved(req.user._id, id);
  }

  // Get similar properties
  const similarProperties = await searchService.getSimilarProperties(
    property,
    4,
  );

  // Get recent reviews
  const reviews = await Review.getPropertyReviews(id, 1, 5);

  // Get property images
  const images = await PropertyImage.getPropertyImages(id);

  return sendSuccess(res, "Property retrieved successfully.", {
    property,
    isSaved,
    similarProperties,
    reviews,
    images,
  });
});

// ── CREATE PROPERTY (LANDLORD) ────────────────────────────────────────────────
const createProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const landlordId = req.user._id;

  // Check listing limit based on subscription
  const existingCount = await Property.countDocuments({
    landlord: landlordId,
    isDeleted: false,
    status: { $ne: "unlisted" },
  });

  if (existingCount >= req.user.maxListings) {
    return sendError(
      res,
      `You have reached your listing limit of ${req.user.maxListings}. Please upgrade your subscription to list more properties.`,
      403,
    );
  }

  // Geocode the address
  const locationData = req.body.location || {};
  const coords = await geocodingService.geocodeAddress({
    address: locationData.address,
    subCity: locationData.subCity,
    city: locationData.city,
  });

  if (coords.success) {
    locationData.coordinates = geocodingService.toGeoJSON(
      coords.lat,
      coords.lng,
    );
  }

  const property = await Property.create({
    ...req.body,
    location: locationData,
    landlord: landlordId,
    status: "pending_review",
  });

  // Run fraud detection in background
  setImmediate(async () => {
    try {
      await fraudDetectionService.analyzePropertyForFraud(
        property._id,
        landlordId,
      );
    } catch (err) {
      logger.error(`Fraud detection failed for new property: ${err.message}`);
    }
  });

  await AuditLog.logFromRequest(req, "property_created", {
    resourceType: "Property",
    resourceId: property._id,
    description: `New property created: ${property.title}`,
  });

  logger.info(`Property created: ${property._id} by landlord ${landlordId}`);

  return sendSuccess(
    res,
    "Property listing created successfully. It will be reviewed and published within 24 hours.",
    { property },
    201,
  );
});

// ── UPDATE PROPERTY (LANDLORD) ────────────────────────────────────────────────
const updateProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;

  const property = await Property.findOne({
    _id: id,
    landlord: req.user._id,
    isDeleted: false,
  });

  if (!property) {
    return sendError(
      res,
      "Property not found or you do not own this listing.",
      404,
    );
  }

  // Prevent editing if under review
  if (property.status === "pending_review" && req.user.role !== "admin") {
    return sendError(
      res,
      "This property is currently under review and cannot be edited.",
      400,
    );
  }

  const allowedUpdates = [
    "title",
    "description",
    "propertyType",
    "location",
    "details",
    "amenities",
    "pricing",
    "leaseTerms",
    "videoTour",
    "virtualTour360",
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Re-geocode if location changed
  if (updates.location) {
    const coords = await geocodingService.geocodeAddress({
      address: updates.location.address,
      subCity: updates.location.subCity,
      city: updates.location.city,
    });
    if (coords.success) {
      updates["location.coordinates"] = geocodingService.toGeoJSON(
        coords.lat,
        coords.lng,
      );
    }
  }

  // Set back to pending review if significant changes
  if (updates.title || updates.description || updates.pricing) {
    updates.status = "pending_review";
  }

  const updatedProperty = await Property.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate("landlord", "firstName lastName avatar");

  await AuditLog.logFromRequest(req, "property_updated", {
    resourceType: "Property",
    resourceId: id,
    description: `Property updated: ${property.title}`,
  });

  return sendSuccess(res, "Property updated successfully.", {
    property: updatedProperty,
  });
});

// ── DELETE PROPERTY (LANDLORD) ────────────────────────────────────────────────
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findOne({
    _id: id,
    landlord: req.user._id,
    isDeleted: false,
  });

  if (!property) {
    return sendError(
      res,
      "Property not found or you do not own this listing.",
      404,
    );
  }

  if (property.isOccupied) {
    return sendError(
      res,
      "This property has an active tenant. Please end the rental before deleting.",
      400,
    );
  }

  // Soft delete
  await Property.softDelete(id);

  // Delete all images from Cloudinary
  const imagePublicIds = await PropertyImage.getPublicIds(id);
  if (imagePublicIds.length > 0) {
    await cloudinaryService.deleteImages(imagePublicIds);
  }
  await PropertyImage.deletePropertyImages(id);

  await AuditLog.logFromRequest(req, "property_deleted", {
    resourceType: "Property",
    resourceId: id,
    description: `Property deleted: ${property.title}`,
  });

  return sendSuccess(res, "Property listing deleted successfully.");
});

// ── UPLOAD PROPERTY IMAGES (LANDLORD) ────────────────────────────────────────
const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return sendError(res, "Please upload at least one image.", 400);
  }

  const property = await Property.findOne({
    _id: id,
    landlord: req.user._id,
    isDeleted: false,
  });

  if (!property) {
    return sendError(res, "Property not found.", 404);
  }

  // Check existing image count
  const existingCount = await PropertyImage.countPropertyImages(id);
  const maxImages = 10;

  if (existingCount + req.files.length > maxImages) {
    return sendError(
      res,
      `Cannot upload ${req.files.length} images. Maximum ${maxImages} images allowed. You have ${existingCount} existing images.`,
      400,
    );
  }

  // Upload all images to Cloudinary
  const uploadResults = await cloudinaryService.uploadPropertyImages(
    req.files.map((f) => f.buffer),
    id,
  );

  const successfulUploads = uploadResults.filter((r) => r.success);
  const failedUploads = uploadResults.filter((r) => !r.success);

  if (successfulUploads.length === 0) {
    return sendError(res, "All image uploads failed. Please try again.", 500);
  }

  // Save image records to database
  const imageRecords = await PropertyImage.insertMany(
    successfulUploads.map((result, index) => ({
      property: id,
      uploadedBy: req.user._id,
      public_id: result.public_id,
      url: result.url,
      secureUrl: result.secureUrl,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      format: result.format,
      fileSize: result.size,
      displayOrder: existingCount + index,
      isCover: existingCount === 0 && index === 0,
    })),
  );

  // Update property images array
  const imageDataForProperty = imageRecords.map((img) => ({
    public_id: img.public_id,
    url: img.secureUrl,
    isCover: img.isCover,
    caption: "",
  }));

  await Property.findByIdAndUpdate(id, {
    $push: { images: { $each: imageDataForProperty } },
  });

  // Set cover image if this is the first upload
  if (existingCount === 0 && imageRecords.length > 0) {
    await Property.findByIdAndUpdate(id, {
      coverImage: {
        public_id: imageRecords[0].public_id,
        url: imageRecords[0].secureUrl,
      },
    });
  }

  return sendSuccess(
    res,
    `${successfulUploads.length} image(s) uploaded successfully.${failedUploads.length > 0 ? ` ${failedUploads.length} failed.` : ""}`,
    { images: imageRecords, failedCount: failedUploads.length },
  );
});

// ── DELETE IMAGE (LANDLORD) ───────────────────────────────────────────────────
const deleteImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const image = await PropertyImage.findOne({
    _id: imageId,
    property: id,
    uploadedBy: req.user._id,
  });

  if (!image) {
    return sendError(res, "Image not found.", 404);
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteImage(image.public_id);

  // Soft delete image record
  await image.softDelete();

  // Remove from property images array
  await Property.findByIdAndUpdate(id, {
    $pull: { images: { public_id: image.public_id } },
  });

  // If deleted image was cover, set new cover
  if (image.isCover) {
    const nextImage = await PropertyImage.findOne({
      property: id,
      isDeleted: false,
    });
    if (nextImage) {
      await PropertyImage.setCoverImage(id, nextImage._id);
      await Property.findByIdAndUpdate(id, {
        coverImage: {
          public_id: nextImage.public_id,
          url: nextImage.secureUrl,
        },
      });
    }
  }

  return sendSuccess(res, "Image deleted successfully.");
});

// ── SET COVER IMAGE (LANDLORD) ────────────────────────────────────────────────
const setCoverImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const image = await PropertyImage.findOne({
    _id: imageId,
    property: id,
  });

  if (!image) {
    return sendError(res, "Image not found.", 404);
  }

  await PropertyImage.setCoverImage(id, imageId);
  await Property.findByIdAndUpdate(id, {
    coverImage: {
      public_id: image.public_id,
      url: image.secureUrl,
    },
  });

  return sendSuccess(res, "Cover image updated successfully.");
});

// ── CREATE REVIEW (TENANT) ────────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { rating, comment, title, subRatings, reviewType } = req.body;

  const property = await Property.findById(id);
  if (!property) {
    return sendError(res, "Property not found.", 404);
  }

  // Check if already reviewed
  const alreadyReviewed = await Review.hasReviewed(
    req.user._id,
    reviewType || "tenant_reviews_property",
    id,
  );

  if (alreadyReviewed) {
    return sendError(res, "You have already reviewed this property.", 409);
  }

  const review = await Review.create({
    reviewer: req.user._id,
    property: id,
    reviewee: property.landlord,
    reviewType: reviewType || "tenant_reviews_property",
    rating,
    comment,
    title,
    subRatings,
    isVerified: true,
    isApproved: true,
    approvedAt: new Date(),
  });

  await review.populate("reviewer", "firstName lastName avatar");

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: property.landlord,
    senderId: req.user._id,
    type: "review_received",
    data: {
      propertyTitle: property.title,
      rating,
      reviewerName: `${req.user.firstName} ${req.user.lastName}`,
    },
    channels: { inApp: true },
    resourceType: "Property",
    resourceId: id,
  });

  return sendSuccess(res, "Review submitted successfully.", { review }, 201);
});

// ── GET PROPERTY REVIEWS (PUBLIC) ─────────────────────────────────────────────
const getPropertyReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.getPropertyReviews(
    id,
    Number(page),
    Number(limit),
  );
  const total = await Review.countDocuments({
    property: id,
    isApproved: true,
    isPublic: true,
  });

  return sendPaginated(res, "Reviews retrieved successfully.", reviews, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── REPORT PROPERTY (TENANT) ──────────────────────────────────────────────────
const reportProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { reportType, description } = req.body;

  const property = await Property.findById(id);
  if (!property) {
    return sendError(res, "Property not found.", 404);
  }

  // Check for duplicate report
  const existing = await Report.findOne({
    reportedBy: req.user._id,
    resourceType: "property",
    resourceId: id,
  });

  if (existing) {
    return sendError(res, "You have already reported this property.", 409);
  }

  const report = await Report.create({
    reportedBy: req.user._id,
    resourceType: "property",
    resourceId: id,
    reportType,
    description,
    resourceSnapshot: {
      title: property.title,
      landlord: property.landlord,
      price: property.pricing?.monthlyRent,
    },
  });

  // Update property moderation
  await Property.findByIdAndUpdate(id, {
    $inc: { "moderation.reportCount": 1 },
    $push: { "moderation.reportReasons": reportType },
    "moderation.isReported": true,
  });

  return sendSuccess(
    res,
    "Report submitted successfully. Our team will investigate within 24 hours.",
    { reportId: report._id },
  );
});

// ── GET PROPERTY IMAGES (PUBLIC) ──────────────────────────────────────────────
const getPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const images = await PropertyImage.getPropertyImages(id);
  return sendSuccess(res, "Property images retrieved.", { images });
});

// ── REORDER IMAGES (LANDLORD) ─────────────────────────────────────────────────
const reorderImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageOrders } = req.body;

  if (!Array.isArray(imageOrders)) {
    return sendError(res, "imageOrders must be an array.", 400);
  }

  await PropertyImage.reorderImages(id, imageOrders);
  return sendSuccess(res, "Image order updated successfully.");
});

module.exports = {
  getProperties,
  getFeaturedProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadImages,
  deleteImage,
  setCoverImage,
  createReview,
  getPropertyReviews,
  reportProperty,
  getPropertyImages,
  reorderImages,
};
