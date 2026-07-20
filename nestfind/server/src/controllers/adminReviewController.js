// nestfind/nestfind/server/src/controllers/adminReviewController.js

const Review = require("../models/Review");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET ALL REVIEWS (ADMIN) ───────────────────────────────────────────────────
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isApproved, isFlagged, reviewType } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (isApproved !== undefined) query.isApproved = isApproved === "true";
  if (isFlagged !== undefined) query.isFlagged = isFlagged === "true";
  if (reviewType) query.reviewType = reviewType;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate("reviewer", "firstName lastName avatar email")
      .populate("reviewee", "firstName lastName")
      .populate("property", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(query),
  ]);

  return sendPaginated(res, "Reviews retrieved.", reviews, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE REVIEW ─────────────────────────────────────────────────────────
const getReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate("reviewer", "firstName lastName avatar email")
    .populate("reviewee", "firstName lastName avatar")
    .populate("property", "title location")
    .populate("rental");

  if (!review) return sendError(res, "Review not found.", 404);

  return sendSuccess(res, "Review retrieved.", { review });
});

// ── MODERATE REVIEW ───────────────────────────────────────────────────────────
const moderateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  const review = await Review.findById(id);
  if (!review) return sendError(res, "Review not found.", 404);

  switch (action) {
    case "approve":
      await review.approve(req.user._id);
      break;
    case "reject":
      await review.reject(reason, req.user._id);
      break;
    case "flag":
      await review.flag(reason);
      break;
    default:
      return sendError(res, "Invalid action. Use: approve, reject, flag", 400);
  }

  await AuditLog.logFromRequest(
    req,
    action === "approve" ? "review_approved" : "review_rejected",
    {
      resourceType: "Review",
      resourceId: id,
      description: `Review ${action}d by admin. Reason: ${reason || "N/A"}`,
    },
  );

  return sendSuccess(res, `Review ${action}d successfully.`, { review });
});

// ── DELETE REVIEW ─────────────────────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByIdAndDelete(id);
  if (!review) return sendError(res, "Review not found.", 404);

  await AuditLog.logFromRequest(req, "review_deleted", {
    resourceType: "Review",
    resourceId: id,
    description: "Review deleted by admin",
  });

  return sendSuccess(res, "Review deleted.");
});

// ── GET REVIEW STATS ──────────────────────────────────────────────────────────
const getReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.getPlatformStats();
  return sendSuccess(res, "Review statistics retrieved.", { stats });
});

module.exports = {
  getReviews,
  getReview,
  moderateReview,
  deleteReview,
  getReviewStats,
};
