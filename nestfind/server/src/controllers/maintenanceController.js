// nestfind/nestfind/server/src/controllers/maintenanceController.js

const { validationResult } = require("express-validator");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Rental = require("../models/Rental");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const cloudinaryService = require("../services/cloudinaryService");
const maintenanceAiService = require("../services/ai/maintenanceAiService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── DIAGNOSE ISSUE WITH AI (TENANT) ──────────────────────────────────────────
const diagnoseIssue = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!description)
    return sendError(res, "Issue description is required.", 400);

  const result = await maintenanceAiService.diagnoseIssue({
    title,
    description,
    tenantId: req.user._id,
    propertyType: "apartment",
  });

  if (!result.success) {
    return sendError(res, result.error, 400);
  }

  return sendSuccess(res, "Issue diagnosed successfully.", result);
});

// ── CREATE MAINTENANCE REQUEST (TENANT) ───────────────────────────────────────
const createMaintenanceRequest = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { title, description, category, urgency } = req.body;
  const tenantId = req.user._id;

  // Get active rental
  const rental = await Rental.findOne({
    tenant: tenantId,
    status: "active",
  })
    .populate("property", "title landlord")
    .populate("landlord", "firstName lastName email phone");

  if (!rental) {
    return sendError(
      res,
      "You do not have an active rental. Maintenance requests require an active rental.",
      404,
    );
  }

  // Upload photos if provided
  let photos = [];
  if (req.files && req.files.length > 0) {
    const uploadResults = await Promise.allSettled(
      req.files.map((file) =>
        cloudinaryService.uploadMaintenancePhoto(
          file.buffer,
          `new_${Date.now()}`,
        ),
      ),
    );
    photos = uploadResults
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => ({
        public_id: r.value.public_id,
        url: r.value.secureUrl,
        caption: "",
      }));
  }

  const request = await MaintenanceRequest.create({
    tenant: tenantId,
    landlord: rental.landlord._id,
    property: rental.property._id,
    rental: rental._id,
    title,
    description,
    category,
    urgency: urgency || "medium",
    photos,
    status: "submitted",
    landlordNotified: false,
    statusHistory: [
      {
        status: "submitted",
        changedBy: tenantId,
        changedAt: new Date(),
      },
    ],
  });

  // Run AI diagnosis in background
  setImmediate(async () => {
    try {
      const diagnosis = await maintenanceAiService.diagnoseIssue({
        title,
        description,
        tenantId,
      });
      if (diagnosis.success) {
        await maintenanceAiService.saveDiagnosisToRequest(
          request._id,
          diagnosis,
        );
      }
    } catch (err) {}
  });

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: rental.landlord._id,
    senderId: tenantId,
    type: "maintenance_submitted",
    data: {
      title,
      propertyTitle: rental.property.title,
      urgency,
    },
    channels: { inApp: true },
    resourceType: "MaintenanceRequest",
    resourceId: request._id,
  });

  await MaintenanceRequest.findByIdAndUpdate(request._id, {
    landlordNotified: true,
    landlordNotifiedAt: new Date(),
  });

  await AuditLog.logFromRequest(req, "maintenance_submitted", {
    resourceType: "MaintenanceRequest",
    resourceId: request._id,
  });

  return sendSuccess(
    res,
    "Maintenance request submitted. The landlord has been notified.",
    { request },
    201,
  );
});

// ── GET TENANT MAINTENANCE REQUESTS ──────────────────────────────────────────
const getTenantRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const tenantId = req.user._id;

  const query = { tenant: tenantId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    MaintenanceRequest.find(query)
      .populate("property", "title location coverImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MaintenanceRequest.countDocuments(query),
  ]);

  return sendPaginated(res, "Maintenance requests retrieved.", requests, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET LANDLORD MAINTENANCE REQUESTS ─────────────────────────────────────────
const getLandlordRequests = asyncHandler(async (req, res) => {
  const { status, urgency, page = 1, limit = 10 } = req.query;
  const landlordId = req.user._id;

  const query = { landlord: landlordId };
  if (status) query.status = status;
  if (urgency) query.urgency = urgency;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    MaintenanceRequest.find(query)
      .populate("tenant", "firstName lastName avatar phone email")
      .populate("property", "title location")
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MaintenanceRequest.countDocuments(query),
  ]);

  return sendPaginated(res, "Maintenance requests retrieved.", requests, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE REQUEST ────────────────────────────────────────────────────────
const getRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
  })
    .populate("tenant", "firstName lastName avatar phone email")
    .populate("landlord", "firstName lastName avatar phone email")
    .populate("property", "title location");

  if (!request) return sendError(res, "Maintenance request not found.", 404);

  return sendSuccess(res, "Maintenance request retrieved.", { request });
});

// ── ACKNOWLEDGE REQUEST (LANDLORD) ────────────────────────────────────────────
const acknowledgeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, estimatedCompletionDate } = req.body;
  const landlordId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    landlord: landlordId,
    status: "submitted",
  })
    .populate("tenant", "firstName lastName email")
    .populate("property", "title");

  if (!request) return sendError(res, "Maintenance request not found.", 404);

  await request.acknowledge(
    message,
    estimatedCompletionDate ? new Date(estimatedCompletionDate) : null,
    landlordId,
  );

  await notificationService.sendNotification({
    recipientId: request.tenant._id,
    senderId: landlordId,
    type: "maintenance_acknowledged",
    data: { title: request.title },
    channels: { inApp: true },
    resourceType: "MaintenanceRequest",
    resourceId: id,
  });

  return sendSuccess(res, "Request acknowledged successfully.", { request });
});

// ── MARK IN PROGRESS (LANDLORD) ───────────────────────────────────────────────
const markInProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { contractorInfo } = req.body;
  const landlordId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    landlord: landlordId,
    status: { $in: ["submitted", "acknowledged"] },
  });

  if (!request) return sendError(res, "Request not found.", 404);

  await request.startProgress(contractorInfo, landlordId);

  return sendSuccess(res, "Request marked as in progress.", { request });
});

// ── COMPLETE REQUEST (LANDLORD) ───────────────────────────────────────────────
const completeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, repairCost } = req.body;
  const landlordId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    landlord: landlordId,
    status: { $in: ["acknowledged", "in_progress"] },
  })
    .populate("tenant", "firstName lastName email")
    .populate("property", "title");

  if (!request) return sendError(res, "Request not found.", 404);

  // Upload completion photos if provided
  if (req.files && req.files.length > 0) {
    const uploadResults = await Promise.allSettled(
      req.files.map((file) =>
        cloudinaryService.uploadMaintenancePhoto(file.buffer, `complete_${id}`),
      ),
    );
    const completionPhotos = uploadResults
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => ({ public_id: r.value.public_id, url: r.value.secureUrl }));

    await MaintenanceRequest.findByIdAndUpdate(id, {
      $push: { completionPhotos: { $each: completionPhotos } },
    });
  }

  await request.markCompleted(notes, repairCost, landlordId);

  await notificationService.sendNotification({
    recipientId: request.tenant._id,
    senderId: landlordId,
    type: "maintenance_completed",
    data: { title: request.title },
    channels: { inApp: true },
    resourceType: "MaintenanceRequest",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "maintenance_completed", {
    resourceType: "MaintenanceRequest",
    resourceId: id,
  });

  return sendSuccess(
    res,
    "Request marked as completed. Waiting for tenant confirmation.",
    { request },
  );
});

// ── CONFIRM COMPLETION (TENANT) ───────────────────────────────────────────────
const confirmCompletion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const tenantId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    tenant: tenantId,
    status: "pending_tenant_confirmation",
  });

  if (!request) return sendError(res, "Request not found.", 404);

  await request.confirmCompletion(rating, comment);

  return sendSuccess(
    res,
    "Completion confirmed. Thank you for your feedback.",
    { request },
  );
});

// ── REJECT REQUEST (LANDLORD) ─────────────────────────────────────────────────
const rejectRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const landlordId = req.user._id;

  const request = await MaintenanceRequest.findOne({
    _id: id,
    landlord: landlordId,
    status: { $in: ["submitted", "acknowledged"] },
  }).populate("tenant", "firstName lastName");

  if (!request) return sendError(res, "Request not found.", 404);

  request.status = "rejected";
  request.landlordResponse.rejectionReason = reason;
  request.statusHistory.push({
    status: "rejected",
    changedBy: landlordId,
    changedAt: new Date(),
    note: reason,
  });
  await request.save();

  await notificationService.sendNotification({
    recipientId: request.tenant._id,
    senderId: landlordId,
    type: "maintenance_rejected",
    data: { title: request.title },
    channels: { inApp: true },
    resourceType: "MaintenanceRequest",
    resourceId: id,
  });

  return sendSuccess(res, "Request declined.", { request });
});

// ── GET MAINTENANCE STATS ─────────────────────────────────────────────────────
const getMaintenanceStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  const query = role === "landlord" ? { landlord: userId } : { tenant: userId };
  const stats = await MaintenanceRequest.getPlatformStats();

  const myStats = await MaintenanceRequest.aggregate([
    { $match: query },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return sendSuccess(res, "Statistics retrieved.", { stats: myStats });
});

// ── ANALYZE MAINTENANCE PATTERNS (LANDLORD) ───────────────────────────────────
const analyzePatterns = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const property = await require("../models/Property").findOne({
    _id: propertyId,
    landlord: req.user._id,
  });

  if (!property) return sendError(res, "Property not found.", 404);

  const analysis =
    await maintenanceAiService.analyzeMaintenancePatterns(propertyId);

  return sendSuccess(res, "Maintenance patterns analyzed.", analysis);
});

module.exports = {
  diagnoseIssue,
  createMaintenanceRequest,
  getTenantRequests,
  getLandlordRequests,
  getRequest,
  acknowledgeRequest,
  markInProgress,
  completeRequest,
  confirmCompletion,
  rejectRequest,
  getMaintenanceStats,
  analyzePatterns,
};
