// nestfind/nestfind/server/src/controllers/bookingController.js

const { validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");
const logger = require("../utils/logger");

// ── CREATE BOOKING (TENANT) ───────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    propertyId,
    preferredDate,
    preferredTime,
    alternativeDate,
    alternativeTime,
    tenantMessage,
  } = req.body;
  const tenantId = req.user._id;

  // Get property
  const property = await Property.findById(propertyId).populate(
    "landlord",
    "firstName lastName email phone",
  );

  if (!property) {
    return sendError(res, "Property not found.", 404);
  }

  if (property.status !== "active" || property.isOccupied) {
    return sendError(res, "This property is not available for booking.", 400);
  }

  if (property.landlord._id.toString() === tenantId.toString()) {
    return sendError(res, "You cannot book your own property.", 400);
  }

  // Check for existing pending booking
  const hasPending = await Booking.hasPendingBooking(tenantId, propertyId);
  if (hasPending) {
    return sendError(
      res,
      "You already have a pending or approved booking for this property.",
      409,
    );
  }

  const booking = await Booking.create({
    tenant: tenantId,
    landlord: property.landlord._id,
    property: propertyId,
    preferredDate: new Date(preferredDate),
    preferredTime,
    alternativeDate: alternativeDate ? new Date(alternativeDate) : null,
    alternativeTime,
    tenantMessage,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        changedBy: tenantId,
        changedAt: new Date(),
      },
    ],
  });

  await booking.populate([
    { path: "tenant", select: "firstName lastName avatar phone email" },
    { path: "property", select: "title location coverImage pricing" },
    { path: "landlord", select: "firstName lastName email phone" },
  ]);

  // Update property booking stats
  await Property.findByIdAndUpdate(propertyId, {
    $inc: { "stats.totalBookings": 1 },
  });

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: property.landlord._id,
    senderId: tenantId,
    type: "booking_received",
    data: {
      tenantName: `${req.user.firstName} ${req.user.lastName}`,
      propertyTitle: property.title,
      preferredDate: new Date(preferredDate).toLocaleDateString("en-ET"),
    },
    channels: { inApp: true, email: true, email: property.landlord.email },
    resourceType: "Booking",
    resourceId: booking._id,
  });

  // Send booking confirmation email to tenant
  await emailService.sendBookingConfirmationEmail(
    req.user.email,
    req.user.firstName,
    {
      propertyTitle: property.title,
      location: `${property.location?.address}, ${property.location?.subCity}`,
      preferredDate: new Date(preferredDate).toLocaleDateString("en-ET"),
      preferredTime,
      landlordName: `${property.landlord.firstName} ${property.landlord.lastName}`,
    },
  );

  await AuditLog.logFromRequest(req, "booking_created", {
    resourceType: "Booking",
    resourceId: booking._id,
    description: `Booking created for property: ${property.title}`,
  });

  return sendSuccess(
    res,
    "Visit request submitted successfully. The landlord will respond within 24 hours.",
    { booking },
    201,
  );
});

// ── GET TENANT BOOKINGS ───────────────────────────────────────────────────────
const getTenantBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const tenantId = req.user._id;

  const query = { tenant: tenantId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("property", "title location coverImage pricing propertyType")
      .populate("landlord", "firstName lastName avatar phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(query),
  ]);

  return sendPaginated(res, "Bookings retrieved successfully.", bookings, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE BOOKING ────────────────────────────────────────────────────────
const getBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
  })
    .populate(
      "tenant",
      "firstName lastName avatar phone email tenantProfile isKYCVerified",
    )
    .populate(
      "property",
      "title location coverImage pricing propertyType details amenities",
    )
    .populate(
      "landlord",
      "firstName lastName avatar phone email landlordProfile",
    );

  if (!booking) {
    return sendError(res, "Booking not found.", 404);
  }

  return sendSuccess(res, "Booking retrieved successfully.", { booking });
});

// ── CANCEL BOOKING (TENANT) ───────────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;
  const tenantId = req.user._id;

  const booking = await Booking.findOne({
    _id: id,
    tenant: tenantId,
    status: { $in: ["pending", "approved"] },
  })
    .populate("property", "title")
    .populate("landlord", "firstName lastName email");

  if (!booking) {
    return sendError(res, "Booking not found or cannot be cancelled.", 404);
  }

  await booking.cancel(cancellationReason, tenantId);

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: booking.landlord._id,
    senderId: tenantId,
    type: "booking_cancelled",
    data: {
      propertyTitle: booking.property.title,
      tenantName: `${req.user.firstName} ${req.user.lastName}`,
    },
    channels: { inApp: true },
    resourceType: "Booking",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "booking_cancelled", {
    resourceType: "Booking",
    resourceId: id,
    description: `Booking cancelled by tenant`,
  });

  return sendSuccess(res, "Booking cancelled successfully.");
});

// ── GET LANDLORD BOOKINGS ─────────────────────────────────────────────────────
const getLandlordBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const landlordId = req.user._id;

  const query = { landlord: landlordId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate(
        "tenant",
        "firstName lastName avatar phone email tenantProfile isKYCVerified",
      )
      .populate("property", "title location coverImage pricing")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(query),
  ]);

  return sendPaginated(res, "Bookings retrieved successfully.", bookings, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── APPROVE BOOKING (LANDLORD) ────────────────────────────────────────────────
const approveBooking = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { confirmedDate, confirmedTime, landlordResponse } = req.body;
  const landlordId = req.user._id;

  const booking = await Booking.findOne({
    _id: id,
    landlord: landlordId,
    status: "pending",
  })
    .populate("tenant", "firstName lastName email phone")
    .populate("property", "title location");

  if (!booking) {
    return sendError(res, "Booking not found or already processed.", 404);
  }

  await booking.approve(
    new Date(confirmedDate),
    confirmedTime,
    landlordResponse,
    landlordId,
  );

  // Notify tenant
  await notificationService.sendNotification({
    recipientId: booking.tenant._id,
    senderId: landlordId,
    type: "booking_approved",
    data: {
      propertyTitle: booking.property.title,
      confirmedDate: new Date(confirmedDate).toLocaleDateString("en-ET"),
      confirmedTime,
    },
    channels: { inApp: true },
    resourceType: "Booking",
    resourceId: id,
  });

  // Send approval email to tenant
  await emailService.sendBookingApprovalEmail(
    booking.tenant.email,
    booking.tenant.firstName,
    {
      propertyTitle: booking.property.title,
      location: `${booking.property.location?.address}, ${booking.property.location?.subCity}`,
      confirmedDate: new Date(confirmedDate).toLocaleDateString("en-ET"),
      confirmedTime,
      landlordName: `${req.user.firstName} ${req.user.lastName}`,
      landlordPhone: req.user.phone,
      landlordResponse,
    },
  );

  await AuditLog.logFromRequest(req, "booking_approved", {
    resourceType: "Booking",
    resourceId: id,
  });

  return sendSuccess(
    res,
    "Booking approved successfully. The tenant has been notified.",
    {
      booking,
    },
  );
});

// ── DECLINE BOOKING (LANDLORD) ────────────────────────────────────────────────
const declineBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const landlordId = req.user._id;

  const booking = await Booking.findOne({
    _id: id,
    landlord: landlordId,
    status: "pending",
  })
    .populate("tenant", "firstName lastName email")
    .populate("property", "title");

  if (!booking) {
    return sendError(res, "Booking not found or already processed.", 404);
  }

  await booking.decline(reason, landlordId);

  await notificationService.sendNotification({
    recipientId: booking.tenant._id,
    senderId: landlordId,
    type: "booking_declined",
    data: {
      propertyTitle: booking.property.title,
      reason: reason || "",
    },
    channels: { inApp: true },
    resourceType: "Booking",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "booking_declined", {
    resourceType: "Booking",
    resourceId: id,
  });

  return sendSuccess(res, "Booking declined. The tenant has been notified.");
});

// ── COMPLETE BOOKING (LANDLORD) ───────────────────────────────────────────────
const completeBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { outcome = "not_decided" } = req.body;
  const landlordId = req.user._id;

  const booking = await Booking.findOne({
    _id: id,
    landlord: landlordId,
    status: "approved",
  });

  if (!booking) {
    return sendError(res, "Booking not found or not in approved status.", 404);
  }

  await booking.complete(outcome, landlordId);

  await AuditLog.logFromRequest(req, "booking_completed", {
    resourceType: "Booking",
    resourceId: id,
  });

  return sendSuccess(res, "Booking marked as completed.", { booking });
});

// ── GET UPCOMING VISITS (LANDLORD) ───────────────────────────────────────────
const getUpcomingVisits = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;
  const visits = await Booking.getUpcomingVisits(landlordId);
  return sendSuccess(res, "Upcoming visits retrieved.", { visits });
});

// ── GET BOOKING STATS (LANDLORD) ──────────────────────────────────────────────
const getBookingStats = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;

  const stats = await Booking.aggregate([
    { $match: { landlord: landlordId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0,
    completed: 0,
    cancelled: 0,
  };

  stats.forEach((s) => {
    result.total += s.count;
    if (result[s._id] !== undefined) result[s._id] = s.count;
  });

  return sendSuccess(res, "Booking statistics retrieved.", { stats: result });
});

module.exports = {
  createBooking,
  getTenantBookings,
  getBooking,
  cancelBooking,
  getLandlordBookings,
  approveBooking,
  declineBooking,
  completeBooking,
  getUpcomingVisits,
  getBookingStats,
};
