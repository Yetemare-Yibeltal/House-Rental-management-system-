// nestfind/nestfind/server/src/controllers/analyticsController.js

const Property = require("../models/Property");
const Rental = require("../models/Rental");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// ── LANDLORD ANALYTICS ────────────────────────────────────────────────────────
const getLandlordAnalytics = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;
  const { year = new Date().getFullYear(), period = "monthly" } = req.query;

  const [
    monthlyRevenue,
    propertyPerformance,
    occupancyRate,
    bookingConversion,
    reviewSummary,
  ] = await Promise.all([
    // Monthly revenue for the year
    Payment.aggregate([
      {
        $match: {
          payee: landlordId,
          status: "completed",
          "paymentPeriod.year": Number(year),
        },
      },
      {
        $group: {
          _id: "$paymentPeriod.month",
          revenue: { $sum: "$netAmount" },
          gross: { $sum: "$amount" },
          commission: { $sum: "$platformCommission" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Per-property performance
    Property.aggregate([
      { $match: { landlord: landlordId, isDeleted: false } },
      {
        $project: {
          title: 1,
          status: 1,
          isOccupied: 1,
          monthlyRent: "$pricing.monthlyRent",
          totalViews: "$stats.totalViews",
          totalBookings: "$stats.totalBookings",
          averageRating: "$stats.averageRating",
          totalReviews: "$stats.totalReviews",
          subCity: "$location.subCity",
          propertyType: 1,
        },
      },
    ]),

    // Occupancy rate
    Property.aggregate([
      {
        $match: {
          landlord: landlordId,
          isDeleted: false,
          status: { $in: ["active", "rented"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          occupied: { $sum: { $cond: ["$isOccupied", 1, 0] } },
        },
      },
    ]),

    // Booking to rental conversion
    Booking.aggregate([
      { $match: { landlord: landlordId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // Review summary
    Review.aggregate([
      { $match: { reviewee: landlordId, isApproved: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]),
  ]);

  // Fill monthly revenue gaps
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyRevenue.find((m) => m._id === i + 1);
    return {
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString("en-ET", {
        month: "short",
      }),
      revenue: found?.revenue || 0,
      gross: found?.gross || 0,
      commission: found?.commission || 0,
      count: found?.count || 0,
    };
  });

  const occupancy = occupancyRate[0] || { total: 0, occupied: 0 };
  const occupancyPercentage =
    occupancy.total > 0
      ? Math.round((occupancy.occupied / occupancy.total) * 100)
      : 0;

  const bookingStats = {
    total: 0,
    approved: 0,
    declined: 0,
    completed: 0,
    cancelled: 0,
  };
  bookingConversion.forEach((b) => {
    bookingStats.total += b.count;
    if (bookingStats[b._id] !== undefined) bookingStats[b._id] = b.count;
  });

  const conversionRate =
    bookingStats.total > 0
      ? Math.round((bookingStats.completed / bookingStats.total) * 100)
      : 0;

  return sendSuccess(res, "Analytics retrieved.", {
    revenue: {
      monthly: revenueByMonth,
      annual: revenueByMonth.reduce((sum, m) => sum + m.revenue, 0),
      year: Number(year),
    },
    properties: propertyPerformance,
    occupancy: {
      total: occupancy.total,
      occupied: occupancy.occupied,
      vacant: occupancy.total - occupancy.occupied,
      percentage: occupancyPercentage,
    },
    bookings: {
      ...bookingStats,
      conversionRate,
    },
    reviews: reviewSummary[0] || {
      avgRating: 0,
      total: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    },
  });
});

// ── PROPERTY ANALYTICS (LANDLORD) ────────────────────────────────────────────
const getPropertyAnalytics = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const landlordId = req.user._id;

  const property = await Property.findOne({
    _id: propertyId,
    landlord: landlordId,
  });

  if (!property) return sendError(res, "Property not found.", 404);

  const [rentals, payments, reviews, bookings] = await Promise.all([
    Rental.find({ property: propertyId }).sort({ createdAt: -1 }),
    Payment.find({ property: propertyId, status: "completed" }).sort({
      createdAt: -1,
    }),
    Review.find({ property: propertyId, isApproved: true }),
    Booking.find({ property: propertyId }).sort({ createdAt: -1 }).limit(20),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.netAmount, 0);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return sendSuccess(res, "Property analytics retrieved.", {
    property: {
      id: property._id,
      title: property.title,
      status: property.status,
      isOccupied: property.isOccupied,
      stats: property.stats,
    },
    totalRevenue,
    totalRentals: rentals.length,
    totalPayments: payments.length,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    recentBookings: bookings.slice(0, 5),
    occupancyHistory: rentals.map((r) => ({
      period: `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`,
      monthlyRent: r.monthlyRent,
      status: r.status,
    })),
  });
});

module.exports = {
  getLandlordAnalytics,
  getPropertyAnalytics,
};
