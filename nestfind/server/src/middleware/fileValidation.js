const { AppError } = require("./errorHandler");
const logger = require("../utils/logger");

const ALLOWED_IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_DOCUMENT_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const validateImageFile = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const files = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

  for (const file of files) {
    if (!ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
      logger.warn(`Invalid image type rejected: ${file.mimetype}`, {
        userId: req.user?.id,
        filename: file.originalname,
      });
      return next(
        new AppError(
          `Invalid file type: ${file.mimetype}. Allowed image types: JPEG, PNG, WebP.`,
          400,
        ),
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return next(
        new AppError(
          `File too large: ${file.originalname}. Maximum image size is 5MB.`,
          400,
        ),
      );
    }

    // Check for dangerous file signatures (magic bytes)
    // Prevents disguised executables uploaded as images
    if (file.buffer && file.buffer.length >= 4) {
      const header = file.buffer.slice(0, 4).toString("hex");
      const SAFE_SIGNATURES = {
        ffd8ffe0: "JPEG",
        ffd8ffe1: "JPEG",
        ffd8ffe2: "JPEG",
        ffd8ffdb: "JPEG",
        "89504e47": "PNG",
        52494646: "WebP",
      };
      const isValidSignature = Object.keys(SAFE_SIGNATURES).some((sig) =>
        header.startsWith(sig),
      );
      if (!isValidSignature) {
        logger.warn(`Suspicious file signature detected`, {
          userId: req.user?.id,
          header,
          mimetype: file.mimetype,
        });
        return next(
          new AppError(
            "File content does not match its declared type. Upload rejected for security reasons.",
            400,
          ),
        );
      }
    }
  }

  next();
};

const validateDocumentFile = (req, res, next) => {
  if (!req.file && (!req.files || Object.keys(req.files || {}).length === 0)) {
    return next();
  }

  const files = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

  for (const file of files) {
    if (!ALLOWED_DOCUMENT_MIMETYPES.includes(file.mimetype)) {
      return next(
        new AppError(
          `Invalid document type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, PDF.`,
          400,
        ),
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return next(
        new AppError(
          `Document too large: ${file.originalname}. Maximum size is 10MB.`,
          400,
        ),
      );
    }
  }

  next();
};

const validateFileCount = (maxCount) => (req, res, next) => {
  const files = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files || {}).flat();

  if (files.length > maxCount) {
    return next(
      new AppError(
        `Too many files. Maximum allowed is ${maxCount} files per upload.`,
        400,
      ),
    );
  }

  next();
};

const requireFileUpload = (fieldName) => (req, res, next) => {
  const hasFile =
    req.file ||
    (Array.isArray(req.files) && req.files.length > 0) ||
    (req.files && req.files[fieldName] && req.files[fieldName].length > 0);

  if (!hasFile) {
    return next(
      new AppError(
        `File upload required. Please provide a file for the '${fieldName}' field.`,
        400,
      ),
    );
  }

  next();
};

module.exports = {
  validateImageFile,
  validateDocumentFile,
  validateFileCount,
  requireFileUpload,
  ALLOWED_IMAGE_MIMETYPES,
  ALLOWED_DOCUMENT_MIMETYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
};
