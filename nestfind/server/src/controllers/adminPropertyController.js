// nestfind/nestfind/server/src/controllers/adminPropertyController.js

const { validationResult } = require("express-validator");
const Property = require("../models/Property");
const PropertyImage = require("../models/PropertyImage");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const fraudDetectionService = require("../services/ai/fraudDetectionService");
const cloudinaryService = require("../services/cloudinaryService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET ALL PROPERTIES (ADMIN) ────────────────────────────────────────────────
const getProperties = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    isFeatured,
    isVerified,
    isFlagged,
    landlordId,
    city,
    search,
  } = req.query;

  const query = { isDeleted: false };
  if (status) query.status = status;
  if (isFeatured !== undefined) query.isFeatured = isFeatured === "true";
  if (isVerified !== undefined) query.isVerified = isVerified === "true";
  if (isFlagged !== undefined)
    query["moderation.isFlagged"] = isFlagged === "true";
  if (landlordId) query.landlord = landlordId;
  if (city) query["location.city"] = { $regex: city, $options: "i" };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { "location.address": { $regex: search, $options: "i" } },
      { "location.subCity": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find(query)
      .populate("landlord", "firstName lastName email phone isKYCVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(query),
  ]);

  return sendPaginated(res, "Properties retrieved.", properties, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET PENDING REVIEW PROPERTIES ─────────────────────────────────────────────
const getPendingReview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find({ status: "pending_review", isDeleted: false })
      .populate(
        "landlord",
        "firstName lastName email phone isKYCVerified landlordProfile",
      )
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments({ status: "pending_review", isDeleted: false }),
  ]);

  return sendPaginated(res, "Pending properties retrieved.", properties, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE PROPERTY (ADMIN) ───────────────────────────────────────────────
const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id)
    .setOptions({ includeDeleted: true })
    .populate(
      "landlord",
      "firstName lastName email phone isKYCVerified landlordProfile",
    )
    .populate("currentTenant", "firstName lastName email phone");

  if (!property) return sendError(res, "Property not found.", 404);

  const images = await PropertyImage.getPropertyImages(id);
  const reports = await Report.getResourceReports("property", id);

  return sendSuccess(res, "Property retrieved.", { property, images, reports });
});

// ── APPROVE PROPERTY ──────────────────────────────────────────────────────────
const approveProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { action, reason, adminNotes } = req.body;

  const property = await Property.findById(id).populate(
    "landlord",
    "firstName lastName email",
  );

  if (!property) return sendError(res, "Property not found.", 404);

  let updateData = {};
  let notificationType;
  let message;

  switch (action) {
    case "approve":
      updateData = {
        status: "active",
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        "moderation.adminNotes": adminNotes,
      };
      notificationType = "property_approved";
      message = "Property approved and published successfully.";
      break;

    case "reject":
      updateData = {
        status: "unlisted",
        "moderation.adminNotes": adminNotes || reason,
      };
      notificationType = "property_rejected";
      message = "Property rejected.";
      break;

    case "feature":
      updateData = {
        isFeatured: true,
        featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      message = "Property featured successfully.";
      break;

    case "unfeature":
      updateData = { isFeatured: false, featuredUntil: null };
      message = "Property unfeatured.";
      break;

    case "suspend":
      updateData = {
        status: "inactive",
        "moderation.isFlagged": true,
        "moderation.adminNotes": adminNotes || reason,
      };
      notificationType = "property_rejected";
      message = "Property suspended.";
      break;

    default:
      return sendError(res, "Invalid action.", 400);
  }

  await Property.findByIdAndUpdate(id, { $set: updateData });

  if (notificationType) {
    await notificationService.sendNotification({
      recipientId: property.landlord._id,
      type: notificationType,
      data: {
        propertyTitle: property.title,
        reason: reason || adminNotes || "",
      },
      channels: { inApp: true },
      resourceType: "Property",
      resourceId: id,
    });
  }

  await AuditLog.logFromRequest(req, `property_${action}d`, {
    resourceType: "Property",
    resourceId: id,
    description: `Property ${action}d: ${property.title}. Reason: ${reason || "N/A"}`,
  });

  return sendSuccess(res, message);
});

// ── RUN FRAUD CHECK (ADMIN) ───────────────────────────────────────────────────
const runFraudCheck = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id);
  if (!property) return sendError(res, "Property not found.", 404);

  const result = await fraudDetectionService.analyzePropertyForFraud(id, null);

  if (!result.success) return sendError(res, result.error, 500);

  return sendSuccess(res, "Fraud analysis complete.", result);
});

// ── BATCH FRAUD CHECK ─────────────────────────────────────────────────────────
const runBatchFraudCheck = asyncHandler(async (req, res) => {
  const { propertyIds } = req.body;

  if (!propertyIds || !Array.isArray(propertyIds)) {
    return sendError(res, "Property IDs array is required.", 400);
  }

  if (propertyIds.length > 50) {
    return sendError(res, "Maximum 50 properties per batch check.", 400);
  }

  const results = await fraudDetectionService.batchFraudCheck(propertyIds);

  return sendSuccess(res, "Batch fraud check complete.", results);
});

// ── GET FLAGGED PROPERTIES ────────────────────────────────────────────────────
const getFlaggedProperties = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find({
      $or: [{ "moderation.isFlagged": true }, { "ai.isFraudSuspected": true }],
      isDeleted: false,
    })
      .populate("landlord", "firstName lastName email phone isKYCVerified")
      .sort({ "ai.fraudScore": -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments({
      $or: [{ "moderation.isFlagged": true }, { "ai.isFraudSuspected": true }],
      isDeleted: false,
    }),
  ]);

  return sendPaginated(res, "Flagged properties retrieved.", properties, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── DELETE PROPERTY (ADMIN) ───────────────────────────────────────────────────
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const property = await Property.findById(id).populate(
    "landlord",
    "firstName lastName email",
  );

  if (!property) return sendError(res, "Property not found.", 404);

  await Property.softDelete(id);

  const imagePublicIds = await PropertyImage.getPublicIds(id);
  if (imagePublicIds.length > 0) {
    await cloudinaryService.deleteImages(imagePublicIds);
  }
  await PropertyImage.deletePropertyImages(id);

  await notificationService.sendNotification({
    recipientId: property.landlord._id,
    type: "property_rejected",
    data: {
      propertyTitle: property.title,
      reason: reason || "Property removed by admin",
    },
    channels: { inApp: true },
    resourceType: "Property",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "property_deleted", {
    resourceType: "Property",
    resourceId: id,
    description: `Property deleted by admin: ${property.title}. Reason: ${reason || "N/A"}`,
    severity: "warning",
  });

  return sendSuccess(res, "Property deleted successfully.");
});

// ── GET PROPERTY STATS (ADMIN) ────────────────────────────────────────────────
const getPropertyStats = asyncHandler(async (req, res) => {
  const stats = await Property.getPlatformStats();
  const fraudStats = await fraudDetectionService.getFraudStats();

  return sendSuccess(res, "Property statistics retrieved.", {
    properties: stats,
    fraud: fraudStats.stats,
  });
});

module.exports = {
  getProperties,
  getPendingReview,
  getProperty,
  approveProperty,
  runFraudCheck,
  runBatchFraudCheck,
  getFlaggedProperties,
  deleteProperty,
  getPropertyStats,
};
