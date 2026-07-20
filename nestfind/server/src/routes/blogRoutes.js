// nestfind/nestfind/server/src/routes/blogRoutes.js

const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { protect, authorize } = require("../middleware/auth");
const { uploadBlogImage } = require("../middleware/upload");
const { validateCreateBlogPost } = require("../validators/adminValidators");

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.get("/", blogController.getPosts);
router.get("/featured", blogController.getFeaturedPosts);
router.get("/:slug", blogController.getPost);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  blogController.getAllPosts,
);
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadBlogImage,
  validateCreateBlogPost,
  blogController.createPost,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadBlogImage,
  blogController.updatePost,
);
router.delete("/:id", protect, authorize("admin"), blogController.deletePost);

module.exports = router;
