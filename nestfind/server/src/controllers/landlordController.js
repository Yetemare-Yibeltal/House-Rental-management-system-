// nestfind/nestfind/server/src/controllers/landlordController.js

const { validationResult } = require("express-validator");
const User = require("../models/User");
const Property = require("../models/Property");
const Rental = require("../models/Rental");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const searchService = require("../services/searchService");
const rentAdvisorService = require("../services/ai/rentAdvisorService");
const propertyDescriptionService = require("../services/ai/propertyDescriptionService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");

// ── GET LANDLORD DASHBOARD STATS ──────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;

  const [
    propertyStats,
    activeRentals,
    pendingBookings,
    recentPayments,
    totalRevenue,
  ] = await Promise.all([
    searchService.getLandlordPropertyStats(landlordId),
    Rental.countDocuments({ landlord: landlordId, status: "active" }),
    Booking.countDocuments({ landlord: landlordId, status: "pending" }),
    Payment.find({ payee: landlordId, status: "completed" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("payer", "firstName lastName avatar")
      .populate("property", "title"),
    Payment.aggregate([
      { $match: { payee: landlordId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
  ]);

  const totalRevenueAmount = totalRevenue[0]?.total || 0;

  return sendSuccess(res, "Dashboard stats retrieved.", {
    properties: propertyStats.stats,
    activeRentals,
    pendingBookings,
    recentPayments,
    totalRevenue: totalRevenueAmount,
    profile: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      avatar: req.user.avatarUrl,
      isKYCVerified: req.user.isKYCVerified,
      landlordProfile: req.user.landlordProfile,
      subscriptionPlan: req.user.subscriptionPlan,
      maxListings: req.user.maxListings,
    },
  });
});

// ── GET LANDLORD PROFILE ──────────────────────────────────────────────────────
const getLandlordProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const landlord = await User.findById(id).select(
    "firstName lastName avatar bio landlordProfile isKYCVerified createdAt",
  );

  if (!landlord || landlord.role !== "landlord") {
    return sendError(res, "Landlord not found.", 404);
  }

  const [properties, reviews] = await Promise.all([
    Property.find({ landlord: id, status: "active", isDeleted: false })
      .select("title location coverImage pricing details stats propertyType")
      .limit(6),
    Review.getLandlordReviews(id, 1, 5),
  ]);

  return sendSuccess(res, "Landlord profile retrieved.", {
    landlord,
    properties,
    reviews,
  });
});

// ── UPDATE LANDLORD PROFILE ───────────────────────────────────────────────────
const updateLandlordProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const allowedFields = [
    "landlordProfile.businessName",
    "landlordProfile.bankAccountName",
    "landlordProfile.bankAccountNumber",
    "landlordProfile.bankName",
    "landlordProfile.telebirrNumber",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    const key = field.split(".")[1];
    if (
      req.body[key] !== undefined ||
      req.body.landlordProfile?.[key] !== undefined
    ) {
      updates[field] = req.body[key] || req.body.landlordProfile?.[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true },
  ).select("landlordProfile");

  return sendSuccess(res, "Landlord profile updated.", {
    landlordProfile: user.landlordProfile,
  });
});

// ── GET AI RENT ADVICE ────────────────────────────────────────────────────────
const getRentAdvice = asyncHandler(async (req, res) => {
  const {
    propertyType,
    subCity,
    city,
    address,
    bedrooms,
    bathrooms,
    area,
    furnished,
    amenities,
    yearBuilt,
    floorNumber,
    description,
    currentRent,
  } = req.body;

  if (!propertyType || !subCity) {
    return sendError(
      res,
      "Property type and sub-city are required for rent advice.",
      400,
    );
  }

  const result = await rentAdvisorService.getRentAdvice(
    {
      propertyType,
      subCity,
      city,
      address,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      furnished,
      amenities: amenities || {},
      yearBuilt,
      floorNumber,
      description,
      currentRent: currentRent ? Number(currentRent) : null,
    },
    req.user._id,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Rent advice generated.", result);
});

// ── GET QUICK RENT ESTIMATE ───────────────────────────────────────────────────
const getQuickRentEstimate = asyncHandler(async (req, res) => {
  const { subCity, propertyType, bedrooms, furnished } = req.query;

  const result = await rentAdvisorService.getQuickEstimate({
    subCity,
    propertyType,
    bedrooms: bedrooms ? Number(bedrooms) : null,
    furnished,
  });

  if (!result.success)
    return sendError(res, result.error || "No data available.", 400);

  return sendSuccess(res, "Rent estimate retrieved.", result);
});

// ── GENERATE PROPERTY DESCRIPTION ────────────────────────────────────────────
const generateDescription = asyncHandler(async (req, res) => {
  const { propertyDetails, tone, length, language } = req.body;

  if (!propertyDetails) {
    return sendError(res, "Property details are required.", 400);
  }

  const result = await propertyDescriptionService.generatePropertyDescription(
    propertyDetails,
    req.user._id,
    { tone, length, language },
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Property description generated.", result);
});

// ── IMPROVE PROPERTY DESCRIPTION ─────────────────────────────────────────────
const improveDescription = asyncHandler(async (req, res) => {
  const { existingDescription, propertyDetails } = req.body;

  if (!existingDescription)
    return sendError(res, "Existing description is required.", 400);

  const result = await propertyDescriptionService.improveDescription(
    existingDescription,
    propertyDetails || {},
    req.user._id,
  );

  if (!result.success) return sendError(res, result.error, 400);

  return sendSuccess(res, "Description improved.", result);
});

// ── GET LANDLORD TENANTS ──────────────────────────────────────────────────────
const getMyTenants = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;

  const rentals = await Rental.find({
    landlord: landlordId,
    status: "active",
  })
    .populate(
      "tenant",
      "firstName lastName avatar phone email tenantProfile isKYCVerified createdAt",
    )
    .populate("property", "title location coverImage");

  const tenants = rentals.map((r) => ({
    rental: {
      id: r._id,
      monthlyRent: r.monthlyRent,
      startDate: r.startDate,
      endDate: r.endDate,
      nextPaymentDue: r.nextPaymentDue,
      status: r.status,
    },
    property: r.property,
    tenant: r.tenant,
  }));

  return sendSuccess(res, "Tenants retrieved.", {
    tenants,
    total: tenants.length,
  });
});

// ── GET TENANT DETAILS (LANDLORD) ─────────────────────────────────────────────
const getTenantDetails = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const landlordId = req.user._id;

  // Verify this tenant has/had a rental with this landlord
  const rental = await Rental.findOne({
    landlord: landlordId,
    tenant: tenantId,
  });

  if (!rental) return sendError(res, "Tenant not found in your records.", 404);

  const tenant = await User.findById(tenantId).select(
    "firstName lastName avatar phone email tenantProfile isKYCVerified createdAt",
  );

  const payments = await Payment.find({
    rental: rental._id,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .limit(12);

  const reviews = await Review.find({
    reviewee: tenantId,
    reviewType: "landlord_reviews_tenant",
    reviewer: landlordId,
  });

  return sendSuccess(res, "Tenant details retrieved.", {
    tenant,
    rental,
    payments,
    reviews,
  });
});

// ── REVIEW TENANT ─────────────────────────────────────────────────────────────
const reviewTenant = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { tenantId } = req.params;
  const { rating, comment } = req.body;
  const landlordId = req.user._id;

  // Verify relationship
  const rental = await Rental.findOne({
    landlord: landlordId,
    tenant: tenantId,
    status: { $in: ["expired", "terminated_early", "active"] },
  });

  if (!rental)
    return sendError(
      res,
      "You can only review tenants from your rentals.",
      403,
    );

  const alreadyReviewed = await Review.hasReviewed(
    landlordId,
    "landlord_reviews_tenant",
    tenantId,
  );

  if (alreadyReviewed)
    return sendError(res, "You have already reviewed this tenant.", 409);

  const review = await Review.create({
    reviewer: landlordId,
    reviewee: tenantId,
    rental: rental._id,
    reviewType: "landlord_reviews_tenant",
    rating,
    comment,
    isVerified: true,
    isApproved: true,
    approvedAt: new Date(),
  });

  return sendSuccess(res, "Tenant review submitted.", { review }, 201);
});

// ── PORTFOLIO PRICING ANALYSIS ────────────────────────────────────────────────
const analyzePortfolioPricing = asyncHandler(async (req, res) => {
  const result = await rentAdvisorService.analyzePortfolioPricing(req.user._id);
  if (!result.success) return sendError(res, result.error, 400);
  return sendSuccess(res, "Portfolio pricing analyzed.", result);
});

// ── GET UPCOMING VISITS ───────────────────────────────────────────────────────
const getUpcomingVisits = asyncHandler(async (req, res) => {
  const visits = await Booking.getUpcomingVisits(req.user._id);
  return sendSuccess(res, "Upcoming visits retrieved.", { visits });
});

module.exports = {
  getDashboardStats,
  getLandlordProfile,
  updateLandlordProfile,
  getRentAdvice,
  getQuickRentEstimate,
  generateDescription,
  improveDescription,
  getMyTenants,
  getTenantDetails,
  reviewTenant,
  analyzePortfolioPricing,
  getUpcomingVisits,
};
