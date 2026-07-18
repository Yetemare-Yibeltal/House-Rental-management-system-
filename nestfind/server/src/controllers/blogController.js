// nestfind/nestfind/server/src/controllers/blogController.js

const { validationResult } = require("express-validator");
const BlogPost = require("../models/BlogPost");
const cloudinaryService = require("../services/cloudinaryService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET PUBLISHED POSTS (PUBLIC) ──────────────────────────────────────────────
const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  const posts = await BlogPost.getPublished(
    Number(page),
    Number(limit),
    category,
  );
  const total = await BlogPost.countDocuments({
    status: "published",
    publishedAt: { $lte: new Date() },
    isDeleted: false,
  });

  return sendPaginated(res, "Blog posts retrieved.", posts, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE POST (PUBLIC) ──────────────────────────────────────────────────
const getPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await BlogPost.findOne({
    slug,
    status: "published",
    isDeleted: false,
  }).populate("author", "firstName lastName avatar");

  if (!post) return sendError(res, "Blog post not found.", 404);

  await BlogPost.incrementViews(post._id);

  const related = await BlogPost.getRelated(
    post._id,
    post.category,
    post.tags,
    3,
  );

  return sendSuccess(res, "Blog post retrieved.", { post, related });
});

// ── GET FEATURED POSTS (PUBLIC) ───────────────────────────────────────────────
const getFeaturedPosts = asyncHandler(async (req, res) => {
  const { limit = 3 } = req.query;
  const posts = await BlogPost.getFeatured(Number(limit));
  return sendSuccess(res, "Featured posts retrieved.", { posts });
});

// ── CREATE POST (ADMIN) ───────────────────────────────────────────────────────
const createPost = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    title,
    content,
    category,
    excerpt,
    tags,
    status,
    isFeatured,
    seo,
    scheduledFor,
  } = req.body;

  let coverImage = {};
  if (req.file) {
    const result = await cloudinaryService.uploadBlogImage(req.file.buffer);
    if (result.success) {
      coverImage = { public_id: result.public_id, url: result.secureUrl };
    }
  }

  const post = await BlogPost.create({
    author: req.user._id,
    title,
    content,
    category,
    excerpt,
    tags: tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim())
      : [],
    status: status || "draft",
    isFeatured: isFeatured || false,
    coverImage,
    seo,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    publishedAt: status === "published" ? new Date() : null,
  });

  return sendSuccess(res, "Blog post created.", { post }, 201);
});

// ── UPDATE POST (ADMIN) ───────────────────────────────────────────────────────
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await BlogPost.findOne({ _id: id, isDeleted: false });
  if (!post) return sendError(res, "Blog post not found.", 404);

  const allowedUpdates = [
    "title",
    "content",
    "category",
    "excerpt",
    "tags",
    "status",
    "isFeatured",
    "seo",
    "scheduledFor",
  ];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });

  if (req.file) {
    if (post.coverImage?.public_id) {
      await cloudinaryService.deleteImage(post.coverImage.public_id);
    }
    const result = await cloudinaryService.uploadBlogImage(req.file.buffer);
    if (result.success) {
      post.coverImage = { public_id: result.public_id, url: result.secureUrl };
    }
  }

  await post.save();

  return sendSuccess(res, "Blog post updated.", { post });
});

// ── DELETE POST (ADMIN) ───────────────────────────────────────────────────────
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await BlogPost.findOne({ _id: id, isDeleted: false });
  if (!post) return sendError(res, "Blog post not found.", 404);

  await BlogPost.softDelete(id);

  return sendSuccess(res, "Blog post deleted.");
});

// ── GET ALL POSTS (ADMIN) ─────────────────────────────────────────────────────
const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { isDeleted: false };
  if (status) query.status = status;
  if (category) query.category = category;

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .populate("author", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    BlogPost.countDocuments(query),
  ]);

  return sendPaginated(res, "All blog posts retrieved.", posts, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

module.exports = {
  getPosts,
  getPost,
  getFeaturedPosts,
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
};
