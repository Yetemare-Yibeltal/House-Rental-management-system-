// nestfind/nestfind/server/src/controllers/rentalController.js

const { validationResult } = require("express-validator");
const Rental = require("../models/Rental");
const Property = require("../models/Property");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── CREATE RENTAL (LANDLORD) ──────────────────────────────────────────────────
const createRental = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    tenantId,
    propertyId,
    startDate,
    endDate,
    monthlyRent,
    securityDeposit,
    paymentDueDay,
    contractId,
    bookingId,
  } = req.body;
  const landlordId = req.user._id;

  const property = await Property.findOne({
    _id: propertyId,
    landlord: landlordId,
  });
  if (!property)
    return sendError(res, "Property not found or you do not own it.", 404);

  if (property.isOccupied)
    return sendError(res, "This property is already occupied.", 400);

  const tenant = await User.findById(tenantId);
  if (!tenant || tenant.role !== "tenant")
    return sendError(res, "Tenant not found.", 404);

  const rental = await Rental.create({
    tenant: tenantId,
    landlord: landlordId,
    property: propertyId,
    contract: contractId || null,
    booking: bookingId || null,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    monthlyRent,
    securityDeposit: securityDeposit || 0,
    paymentDueDay: paymentDueDay || 1,
    status: "active",
  });

  // Mark property as occupied
  await Property.findByIdAndUpdate(propertyId, {
    isOccupied: true,
    currentTenant: tenantId,
    currentRental: rental._id,
    status: "rented",
  });

  // Update tenant profile
  await User.findByIdAndUpdate(tenantId, {
    "tenantProfile.currentRentalId": rental._id,
  });

  // Update landlord stats
  await User.findByIdAndUpdate(landlordId, {
    $inc: {
      "landlordProfile.totalTenants": 1,
    },
  });

  await notificationService.sendNotification({
    recipientId: tenantId,
    senderId: landlordId,
    type: "rental_started",
    data: {
      propertyTitle: property.title,
      startDate: new Date(startDate).toLocaleDateString("en-ET"),
      monthlyRent,
    },
    channels: { inApp: true },
    resourceType: "Rental",
    resourceId: rental._id,
  });

  await AuditLog.logFromRequest(req, "rental_created", {
    resourceType: "Rental",
    resourceId: rental._id,
  });

  return sendSuccess(res, "Rental created successfully.", { rental }, 201);
});

// ── GET TENANT ACTIVE RENTAL ──────────────────────────────────────────────────
const getTenantActiveRental = asyncHandler(async (req, res) => {
  const rental = await Rental.getActiveTenantRental(req.user._id);

  if (!rental) {
    return sendSuccess(res, "No active rental found.", { rental: null });
  }

  return sendSuccess(res, "Active rental retrieved.", { rental });
});

// ── GET TENANT RENTAL HISTORY ─────────────────────────────────────────────────
const getTenantRentalHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [rentals, total] = await Promise.all([
    Rental.find({ tenant: req.user._id })
      .populate("property", "title location coverImage pricing")
      .populate("landlord", "firstName lastName avatar phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Rental.countDocuments({ tenant: req.user._id }),
  ]);

  return sendPaginated(res, "Rental history retrieved.", rentals, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET LANDLORD RENTALS ──────────────────────────────────────────────────────
const getLandlordRentals = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const landlordId = req.user._id;

  const query = { landlord: landlordId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [rentals, total] = await Promise.all([
    Rental.find(query)
      .populate("tenant", "firstName lastName avatar phone email tenantProfile")
      .populate("property", "title location coverImage pricing")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Rental.countDocuments(query),
  ]);

  return sendPaginated(res, "Rentals retrieved.", rentals, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE RENTAL ─────────────────────────────────────────────────────────
const getRental = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const rental = await Rental.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
  })
    .populate("tenant", "firstName lastName avatar phone email tenantProfile")
    .populate(
      "landlord",
      "firstName lastName avatar phone email landlordProfile",
    )
    .populate("property", "title location coverImage pricing amenities details")
    .populate("contract");

  if (!rental) return sendError(res, "Rental not found.", 404);

  return sendSuccess(res, "Rental retrieved.", { rental });
});

// ── UPDATE RENTAL (LANDLORD) ──────────────────────────────────────────────────
const updateRental = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;

  const rental = await Rental.findOne({
    _id: id,
    landlord: req.user._id,
  });

  if (!rental) return sendError(res, "Rental not found.", 404);

  const allowedUpdates = [
    "monthlyRent",
    "landlordNotes",
    "paymentDueDay",
    "gracePeriodDays",
  ];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const updated = await Rental.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true },
  );

  await AuditLog.logFromRequest(req, "rental_updated", {
    resourceType: "Rental",
    resourceId: id,
  });

  return sendSuccess(res, "Rental updated successfully.", { rental: updated });
});

// ── TERMINATE RENTAL (LANDLORD/TENANT) ───────────────────────────────────────
const terminateRental = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, terminationDate } = req.body;
  const userId = req.user._id;
  const role = req.user.role;

  const rental = await Rental.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
    status: "active",
  }).populate("property", "title");

  if (!rental) return sendError(res, "Active rental not found.", 404);

  await rental.terminateEarly(
    reason,
    role,
    terminationDate ? new Date(terminationDate) : new Date(),
  );

  // Mark property as available
  await Property.findByIdAndUpdate(rental.property._id, {
    isOccupied: false,
    currentTenant: null,
    currentRental: null,
    status: "active",
  });

  // Notify the other party
  const notifyId =
    role === "tenant" ? rental.landlord.toString() : rental.tenant.toString();

  await notificationService.sendNotification({
    recipientId: notifyId,
    senderId: userId,
    type: "rental_terminated",
    data: { propertyTitle: rental.property.title },
    channels: { inApp: true },
    resourceType: "Rental",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "rental_terminated", {
    resourceType: "Rental",
    resourceId: id,
  });

  return sendSuccess(res, "Rental terminated successfully.");
});

// ── RECORD MOVE-IN (LANDLORD) ─────────────────────────────────────────────────
const recordMoveIn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { moveInDate, moveInCondition, moveInNotes } = req.body;

  const rental = await Rental.findOne({
    _id: id,
    landlord: req.user._id,
  });

  if (!rental) return sendError(res, "Rental not found.", 404);

  await Rental.findByIdAndUpdate(id, {
    moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
    moveInCondition,
    moveInNotes,
    status: "active",
  });

  return sendSuccess(res, "Move-in recorded successfully.");
});

// ── GET RENTALS EXPIRING SOON ─────────────────────────────────────────────────
const getExpiringSoon = asyncHandler(async (req, res) => {
  const { days = 60 } = req.query;
  const rentals = await Rental.getExpiringSoon(Number(days));
  return sendSuccess(res, "Expiring rentals retrieved.", { rentals });
});

// ── GET RENTAL STATS (LANDLORD) ───────────────────────────────────────────────
const getRentalStats = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;
  const stats = await Rental.getPlatformStats();

  const myStats = await Rental.aggregate([
    { $match: { landlord: landlordId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalRentPaid" },
        avgRent: { $avg: "$monthlyRent" },
      },
    },
  ]);

  return sendSuccess(res, "Rental statistics retrieved.", { stats: myStats });
});

module.exports = {
  createRental,
  getTenantActiveRental,
  getTenantRentalHistory,
  getLandlordRentals,
  getRental,
  updateRental,
  terminateRental,
  recordMoveIn,
  getExpiringSoon,
  getRentalStats,
};
