const multer = require("multer");
const path = require("path");
const logger = require("../utils/logger");
const { AppError } = require("./errorHandler");

const memoryStorage = multer.memoryStorage();

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

const FILE_SIZE_LIMITS = {
  propertyImage: 5 * 1024 * 1024,
  avatar: 2 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  blogImage: 3 * 1024 * 1024,
};

const createFileFilter = (allowedTypes, context) => (req, file, callback) => {
  const isAllowed = Object.keys(allowedTypes).includes(file.mimetype);
  if (!isAllowed) {
    return callback(
      new AppError(
        `Invalid file type '${file.mimetype}'. Allowed: ${Object.values(allowedTypes).join(", ")}`,
        400,
      ),
      false,
    );
  }
  callback(null, true);
};

const handleMulterError = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (!err) return next();
    if (err.name === "MulterError") {
      const msgs = {
        LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
        LIMIT_FILE_COUNT: "Too many files. Maximum is 10.",
        LIMIT_UNEXPECTED_FILE: `Unexpected file field '${err.field}'.`,
      };
      return next(
        new AppError(msgs[err.code] || `Upload error: ${err.message}`, 400),
      );
    }
    if (err.isOperational) return next(err);
    return next(new AppError(`File upload failed: ${err.message}`, 500));
  });
};

const uploadPropertyImages = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.propertyImage, files: 10 },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "property images"),
  }).array("images", 10),
);

const uploadPropertyCoverImage = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.propertyImage, files: 1 },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "cover image"),
  }).single("image"),
);

const uploadAvatar = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.avatar, files: 1 },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "avatar"),
  }).single("avatar"),
);

const uploadKYCDocuments = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.document, files: 5 },
    fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES, "KYC documents"),
  }).fields([
    { name: "nationalId", maxCount: 1 },
    { name: "proofOfOwnership", maxCount: 1 },
    { name: "utilityBill", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
);

const uploadBlogImage = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.blogImage, files: 1 },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "blog image"),
  }).single("coverImage"),
);

const uploadPropertyForm = handleMulterError(
  multer({
    storage: memoryStorage,
    limits: { fileSize: FILE_SIZE_LIMITS.propertyImage, files: 10 },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, "property form"),
  }).fields([
    { name: "images", maxCount: 10 },
    { name: "coverImage", maxCount: 1 },
  ]),
);

const requireFile = (fieldName) => (req, res, next) => {
  if (!req.file)
    return next(
      new AppError(
        `Please upload a file. The '${fieldName}' field is required.`,
        400,
      ),
    );
  next();
};

const requireFiles = (fieldName) => (req, res, next) => {
  if (!req.files || req.files.length === 0)
    return next(
      new AppError(
        `Please upload at least one file. The '${fieldName}' field is required.`,
        400,
      ),
    );
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
  FILE_SIZE_LIMITS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
};
