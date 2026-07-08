const multer = require("multer");
const path = require("path");
const logger = require("../utils/logger");
const { AppError } = require("./errorHandler");

// ── STORAGE ───────────────────────────────────────────────────────────────────
/**
 * Use memory storage — files are stored as Buffer objects in req.file.buffer
 * and passed directly to Cloudinary without touching the disk.
 * This is the correct approach for cloud-based file storage.
 */
const memoryStorage = multer.memoryStorage();

// ── ALLOWED MIME TYPES ────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const ALLOWED_DOCUMENT_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const ALLOWED_AVATAR_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// ── FILE SIZE LIMITS ──────────────────────────────────────────────────────────
const FILE_SIZE_LIMITS = {
  propertyImage: 5 * 1024 * 1024, // 5MB per property image
  avatar: 2 * 1024 * 1024, // 2MB for avatar
  document: 10 * 1024 * 1024, // 10MB for KYC documents (PDFs can be large)
  blogImage: 3 * 1024 * 1024, // 3MB for blog post images
};

// ── FILE COUNT LIMITS ─────────────────────────────────────────────────────────
const FILE_COUNT_LIMITS = {
  propertyImages: 10, // Max 10 images per property upload request
  kycDocuments: 5, // Max 5 KYC documents per submission
  blogImages: 1, // 1 image per blog post
};

// ── FILE FILTER FACTORY ───────────────────────────────────────────────────────
/**
 * Creates a Multer fileFilter function that checks the mimetype
 * of each incoming file against an allowed types map.
 * Rejects invalid types with a clear error message.
 */
const createFileFilter = (allowedTypes, uploadContext) => {
  return (req, file, callback) => {
    const isAllowed = Object.keys(allowedTypes).includes(file.mimetype);

    if (!isAllowed) {
      const allowedExtensions = Object.values(allowedTypes).join(", ");
      logger.warn(`Rejected file upload: invalid type`, {
        filename: file.originalname,
        mimetype: file.mimetype,
        uploadContext,
        userId: req.user?.id,
        ip: req.ip,
      });

      return callback(
        new AppError(
          `Invalid file type '${file.mimetype}'. Allowed formats for ${uploadContext}: ${allowedExtensions}`,
          400,
        ),
        false,
      );
    }

    // Additional check: file extension must match mimetype (prevents extension spoofing)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const expectedExtension = allowedTypes[file.mimetype];

    // Some files have .jpg vs .jpeg difference — normalize
    const normalizedFileExt =
      fileExtension === ".jpeg" ? ".jpg" : fileExtension;

    if (normalizedFileExt && normalizedFileExt !== expectedExtension) {
      logger.warn(`Rejected file upload: extension mismatch`, {
        filename: file.originalname,
        fileExtension,
        mimetype: file.mimetype,
        expectedExtension,
        uploadContext,
        userId: req.user?.id,
      });

      return callback(
        new AppError(
          `File extension does not match file type. Please upload a valid ${expectedExtension} file.`,
          400,
        ),
        false,
      );
    }

    logger.info(`File accepted for upload`, {
      filename: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
      uploadContext,
      userId: req.user?.id,
    });

    callback(null, true);
  };
};

// ── MULTER ERROR HANDLER ──────────────────────────────────────────────────────
/**
 * Wraps multer middleware to catch MulterError and convert to AppError.
 * Call this instead of using multer middleware directly in routes.
 */
const handleMulterError = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();

      // Multer-specific errors
      if (err.name === "MulterError") {
        const multerMessages = {
          LIMIT_FILE_SIZE: `File too large. Maximum allowed size is ${
            err.field === "avatar"
              ? "2MB"
              : err.field === "document"
                ? "10MB"
                : "5MB"
          }.`,
          LIMIT_FILE_COUNT: `Too many files. Please upload fewer files at once.`,
          LIMIT_UNEXPECTED_FILE: `Unexpected file field '${err.field}'. Please use the correct upload field.`,
          LIMIT_PART_COUNT: `Too many parts in the form submission.`,
          LIMIT_FIELD_KEY: `Field name is too long.`,
          LIMIT_FIELD_VALUE: `Field value is too long.`,
          LIMIT_FIELD_COUNT: `Too many fields in the request.`,
        };

        return next(
          new AppError(
            multerMessages[err.code] || `Upload error: ${err.message}`,
            400,
          ),
        );
      }

      // Our own AppError from fileFilter
      if (err.isOperational) {
        return next(err);
      }

      // Unknown upload error
      return next(new AppError(`File upload failed: ${err.message}`, 500));
    });
  };
};

// ── 1. PROPERTY IMAGES UPLOAD ─────────────────────────────────────────────────
/**
 * Used in: POST /api/properties/:id/images
 * Accepts: Up to 10 images (JPEG, PNG, WebP)
 * Max size: 5MB per image
 * Field name: 'images' (array)
 */
const uploadPropertyImages = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.propertyImage,
      files: FILE_COUNT_LIMITS.propertyImages,
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "property images"),
  }).array("images", FILE_COUNT_LIMITS.propertyImages),
);

/**
 * Single property image upload (for cover image replacement)
 * Field name: 'image' (single)
 */
const uploadPropertyCoverImage = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.propertyImage,
      files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "property cover image"),
  }).single("image"),
);

// ── 2. USER AVATAR UPLOAD ─────────────────────────────────────────────────────
/**
 * Used in: PATCH /api/auth/upload-avatar
 * Accepts: 1 image (JPEG, PNG, WebP)
 * Max size: 2MB
 * Field name: 'avatar' (single)
 */
const uploadAvatar = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.avatar,
      files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_AVATAR_TYPES, "avatar"),
  }).single("avatar"),
);

// ── 3. KYC DOCUMENTS UPLOAD ───────────────────────────────────────────────────
/**
 * Used in: POST /api/auth/kyc or PATCH /api/profile/kyc
 * Accepts: Up to 5 files (JPEG, PNG, WebP, PDF)
 * Max size: 10MB per file (PDFs can be large)
 * Field names: Mixed fields for different document types
 *   - 'nationalId' (single) — national ID card image
 *   - 'proofOfOwnership' (single) — for landlords
 *   - 'utilityBill' (single) — proof of address
 *   - 'selfie' (single) — selfie with ID
 *   - 'documents' (up to 5) — general documents
 */
const uploadKYCDocuments = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.document,
      files: FILE_COUNT_LIMITS.kycDocuments,
    },
    fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES, "KYC documents"),
  }).fields([
    { name: "nationalId", maxCount: 1 },
    { name: "proofOfOwnership", maxCount: 1 },
    { name: "utilityBill", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
);

// ── 4. BLOG IMAGE UPLOAD ──────────────────────────────────────────────────────
/**
 * Used in: POST /api/admin/blog (admin creates blog post with cover image)
 * Accepts: 1 image (JPEG, PNG, WebP)
 * Max size: 3MB
 * Field name: 'coverImage' (single)
 */
const uploadBlogImage = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.blogImage,
      files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "blog image"),
  }).single("coverImage"),
);

// ── 5. MIXED PROPERTY FORM UPLOAD ─────────────────────────────────────────────
/**
 * Used when creating a property with images in a single form submission.
 * Accepts: Up to 10 images + optional video field
 * Used in: POST /api/properties (create property with images in one request)
 */
const uploadPropertyForm = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS.propertyImage,
      files: FILE_COUNT_LIMITS.propertyImages,
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "property form images"),
  }).fields([
    { name: "images", maxCount: 10 },
    { name: "coverImage", maxCount: 1 },
  ]),
);

// ── HELPER: GET FILE SIZE DISPLAY ─────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── HELPER: VALIDATE UPLOADED FILE EXISTS ─────────────────────────────────────
/**
 * Middleware that checks a required single file was actually uploaded.
 * Use after single-file upload middleware when the file is required.
 *
 * Usage:
 *   router.post('/avatar', uploadAvatar, requireFile('avatar'), controller)
 */
const requireFile = (fieldName) => (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError(
        `Please upload a file. The '${fieldName}' field is required.`,
        400,
      ),
    );
  }
  next();
};

/**
 * Middleware that checks at least one file was uploaded for array uploads.
 * Use after array upload middleware when at least one file is required.
 *
 * Usage:
 *   router.post('/images', uploadPropertyImages, requireFiles('images'), controller)
 */
const requireFiles = (fieldName) => (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(
      new AppError(
        `Please upload at least one file. The '${fieldName}' field is required.`,
        400,
      ),
    );
  }
  next();
};

module.exports = {
  uploadPropertyImages,
  uploadPropertyCoverImage,
  uploadAvatar,
  uploadKYCDocuments,
  uploadBlogImage,
  uploadPropertyForm,
  requireFile,
  requireFiles,
  formatFileSize,
  FILE_SIZE_LIMITS,
  FILE_COUNT_LIMITS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
};
