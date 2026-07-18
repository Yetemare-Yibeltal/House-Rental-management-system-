// nestfind/nestfind/server/src/controllers/faqController.js

const { validationResult } = require("express-validator");
const FAQ = require("../models/FAQ");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");

// ── GET FAQS (PUBLIC) ─────────────────────────────────────────────────────────
const getFAQs = asyncHandler(async (req, res) => {
  const { category, role = "all" } = req.query;
  const faqs = await FAQ.getByCategory(category || null, role);
  return sendSuccess(res, "FAQs retrieved.", { faqs });
});

// ── GET FAQ CATEGORIES (PUBLIC) ───────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const categories = await FAQ.getCategoriesWithCounts();
  return sendSuccess(res, "FAQ categories retrieved.", { categories });
});

// ── GET FEATURED FAQS (PUBLIC) ────────────────────────────────────────────────
const getFeaturedFAQs = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  const faqs = await FAQ.getFeatured(Number(limit));
  return sendSuccess(res, "Featured FAQs retrieved.", { faqs });
});

// ── SEARCH FAQS (PUBLIC) ──────────────────────────────────────────────────────
const searchFAQs = asyncHandler(async (req, res) => {
  const { q, role = "all" } = req.query;
  if (!q || q.length < 2) return sendError(res, "Search query too short.", 400);

  const faqs = await FAQ.search(q, role);
  return sendSuccess(res, "FAQ search results.", { faqs });
});

// ── GET SINGLE FAQ (PUBLIC) ───────────────────────────────────────────────────
const getFAQ = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const faq = await FAQ.findOne({ slug, isPublished: true, isDeleted: false });
  if (!faq) return sendError(res, "FAQ not found.", 404);

  await FAQ.incrementViews(faq._id);

  return sendSuccess(res, "FAQ retrieved.", { faq });
});

// ── VOTE HELPFUL (PUBLIC) ─────────────────────────────────────────────────────
const voteHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isHelpful } = req.body;

  if (isHelpful === undefined)
    return sendError(res, "isHelpful is required.", 400);

  const faq = await FAQ.voteHelpful(id, isHelpful);
  return sendSuccess(res, "Vote recorded.", {
    helpfulVotes: faq.stats.helpfulVotes,
    notHelpfulVotes: faq.stats.notHelpfulVotes,
  });
});

// ── CREATE FAQ (ADMIN) ────────────────────────────────────────────────────────
const createFAQ = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    question,
    answer,
    category,
    targetRole,
    displayOrder,
    isFeatured,
    isPublished,
    tags,
  } = req.body;

  const faq = await FAQ.create({
    question,
    answer,
    category,
    targetRole: targetRole || "all",
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    isPublished: isPublished !== false,
    tags: tags || [],
    createdBy: req.user._id,
  });

  return sendSuccess(res, "FAQ created.", { faq }, 201);
});

// ── UPDATE FAQ (ADMIN) ────────────────────────────────────────────────────────
const updateFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faq = await FAQ.findOne({ _id: id, isDeleted: false });
  if (!faq) return sendError(res, "FAQ not found.", 404);

  const allowedUpdates = [
    "question",
    "answer",
    "category",
    "targetRole",
    "displayOrder",
    "isFeatured",
    "isPublished",
    "tags",
  ];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) faq[field] = req.body[field];
  });

  faq.updatedBy = req.user._id;
  await faq.save();

  return sendSuccess(res, "FAQ updated.", { faq });
});

// ── DELETE FAQ (ADMIN) ────────────────────────────────────────────────────────
const deleteFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await FAQ.softDelete(id);
  return sendSuccess(res, "FAQ deleted.");
});

// ── GET ALL FAQS (ADMIN) ──────────────────────────────────────────────────────
const getAllFAQs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [faqs, total] = await Promise.all([
    FAQ.find({ isDeleted: false })
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    FAQ.countDocuments({ isDeleted: false }),
  ]);

  return sendSuccess(res, "All FAQs retrieved.", {
    faqs,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

module.exports = {
  getFAQs,
  getCategories,
  getFeaturedFAQs,
  searchFAQs,
  getFAQ,
  voteHelpful,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllFAQs,
};
