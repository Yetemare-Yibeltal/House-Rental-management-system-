const logger = require("../utils/logger");

// ── CUSTOM APP ERROR CLASS ────────────────────────────────────────────────────
/**
 * AppError — use this to throw any known/expected error from controllers,
 * services, or middleware. The global errorHandler below recognizes it
 * and sends the right HTTP response automatically.
 *
 * Usage examples:
 *   throw new AppError('Property not found', 404);
 *   throw new AppError('Email already registered', 409);
 *   throw new AppError('Validation failed', 422, [{ field: 'email', message: 'Invalid email' }]);
 */
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // distinguishes known errors from bugs
    if (errors) {
      this.errors = errors;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── MONGOOSE CAST ERROR ───────────────────────────────────────────────────────
/**
 * Triggered when an invalid MongoDB ObjectId is passed as a route param.
 * Example: GET /api/properties/not-a-valid-id
 */
const handleCastError = (err) => {
  const message = `'${err.value}' is not a valid ${err.path}. Please provide a valid ID.`;
  return { statusCode: 400, message, errors: null };
};

// ── MONGOOSE DUPLICATE KEY ERROR ──────────────────────────────────────────────
/**
 * Triggered when inserting a document that violates a unique index.
 * Example: Registering with an email that already exists.
 * err.keyValue = { email: 'test@test.com' }
 */
const handleDuplicateKeyError = (err) => {
  const duplicatedField = Object.keys(err.keyValue)[0];
  const duplicatedValue = err.keyValue[duplicatedField];

  const fieldLabels = {
    email: "email address",
    phone: "phone number",
    slug: "property title",
    nationalId: "national ID number",
    title: "title",
  };

  const label = fieldLabels[duplicatedField] || duplicatedField;
  const message = `This ${label} (${duplicatedValue}) is already registered. Please use a different one.`;

  return { statusCode: 409, message, errors: null };
};

// ── MONGOOSE VALIDATION ERROR ─────────────────────────────────────────────────
/**
 * Triggered when a Mongoose document fails schema-level validation.
 * Example: Required field missing, enum value not allowed, min/max violated.
 * Formats into our standard errors array shape.
 */
const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors).map((validationError) => ({
    field: validationError.path,
    message: validationError.message,
    value:
      validationError.value !== undefined
        ? String(validationError.value)
        : undefined,
  }));

  const message = `Validation failed on ${errors.length} field${errors.length > 1 ? "s" : ""}`;
  return { statusCode: 422, message, errors };
};

// ── JWT ERRORS ────────────────────────────────────────────────────────────────
/**
 * JsonWebTokenError — token is malformed or signature is invalid
 */
const handleJWTError = () => ({
  statusCode: 401,
  message: "Invalid authentication token. Please log in again.",
  errors: null,
});

/**
 * TokenExpiredError — token was valid but has passed its expiry time
 */
const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: "Your session has expired. Please log in again.",
  errors: null,
});

/**
 * NotBeforeError — token not yet valid (iat in the future)
 */
const handleJWTNotBeforeError = () => ({
  statusCode: 401,
  message: "Authentication token is not yet valid. Please try again.",
  errors: null,
});

// ── MULTER FILE UPLOAD ERRORS ─────────────────────────────────────────────────
/**
 * Triggered by Multer when file upload constraints are violated.
 */
const handleMulterError = (err) => {
  const multerMessages = {
    LIMIT_FILE_SIZE:
      "File is too large. Maximum allowed file size is 5MB per file.",
    LIMIT_FILE_COUNT:
      "Too many files uploaded at once. Maximum is 10 files per request.",
    LIMIT_UNEXPECTED_FILE:
      "An unexpected file field was received in the upload.",
    LIMIT_PART_COUNT: "Too many form parts in the multipart request.",
    LIMIT_FIELD_KEY: "Form field name is too long.",
    LIMIT_FIELD_VALUE: "Form field value is too long.",
    LIMIT_FIELD_COUNT: "Too many form fields in the request.",
  };

  const message =
    multerMessages[err.code] || `File upload error: ${err.message}`;
  return { statusCode: 400, message, errors: null };
};

// ── EXPRESS RATE LIMIT ERROR ──────────────────────────────────────────────────
/**
 * Triggered when express-rate-limit rejects a request.
 */
const handleRateLimitError = () => ({
  statusCode: 429,
  message:
    "Too many requests from this IP address. Please wait a few minutes before trying again.",
  errors: null,
});

// ── SYNTAX ERROR IN REQUEST BODY ──────────────────────────────────────────────
/**
 * Triggered when Express fails to parse an invalid JSON request body.
 * Example: POST body with unclosed bracket { "name": "test"
 */
const handleSyntaxError = () => ({
  statusCode: 400,
  message:
    "Invalid JSON in request body. Please check your request format and try again.",
  errors: null,
});

// ── PAYLOAD TOO LARGE ─────────────────────────────────────────────────────────
/**
 * Triggered when request body exceeds Express body-parser limit.
 */
const handlePayloadTooLarge = () => ({
  statusCode: 413,
  message: "Request payload is too large. Maximum request size is 10MB.",
  errors: null,
});

// ── BUILD ERROR RESPONSE ──────────────────────────────────────────────────────
/**
 * Builds the final JSON response object from processed error data.
 * Adds stack trace only in development for easier debugging.
 */
const buildErrorResponse = (message, errors, err) => {
  const response = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Only expose internals in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.originalError = err.message;
  }

  return response;
};

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
/**
 * Express error handling middleware — must have 4 params (err, req, res, next).
 * Mount this AFTER all routes in server/src/index.js.
 * Every thrown error or next(error) call lands here.
 */
const errorHandler = (err, req, res, next) => {
  // Log every error with full request context
  logger.error(`[${err.name || "Error"}] ${err.message}`, {
    statusCode: err.statusCode || 500,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "unauthenticated",
    userRole: req.user?.role || "none",
    body: process.env.NODE_ENV === "development" ? req.body : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // ── 1. MONGOOSE CAST ERROR ──────────────────────────────────────────────
  if (err.name === "CastError") {
    const { statusCode, message, errors } = handleCastError(err);
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 2. MONGOOSE DUPLICATE KEY ERROR ────────────────────────────────────
  if (err.code === 11000 || err.code === 11001) {
    const { statusCode, message, errors } = handleDuplicateKeyError(err);
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 3. MONGOOSE VALIDATION ERROR ───────────────────────────────────────
  if (err.name === "ValidationError" && err.errors) {
    const { statusCode, message, errors } = handleMongooseValidationError(err);
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 4. JWT ERRORS ───────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    const { statusCode, message, errors } = handleJWTError();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  if (err.name === "TokenExpiredError") {
    const { statusCode, message, errors } = handleJWTExpiredError();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  if (err.name === "NotBeforeError") {
    const { statusCode, message, errors } = handleJWTNotBeforeError();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 5. MULTER ERRORS ────────────────────────────────────────────────────
  if (err.name === "MulterError") {
    const { statusCode, message, errors } = handleMulterError(err);
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 6. RATE LIMIT ERROR ─────────────────────────────────────────────────
  if (err.status === 429 || err.statusCode === 429) {
    const { statusCode, message, errors } = handleRateLimitError();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 7. JSON SYNTAX ERROR ────────────────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const { statusCode, message, errors } = handleSyntaxError();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 8. PAYLOAD TOO LARGE ────────────────────────────────────────────────
  if (err.type === "entity.too.large" || err.status === 413) {
    const { statusCode, message, errors } = handlePayloadTooLarge();
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }

  // ── 9. OUR OWN AppError (operational/known errors) ──────────────────────
  if (err.isOperational || err.statusCode) {
    return res
      .status(err.statusCode || 400)
      .json(buildErrorResponse(err.message, err.errors || null, err));
  }

  // ── 10. UNKNOWN / UNEXPECTED ERRORS ─────────────────────────────────────
  // Something we didn't anticipate — hide details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Our team has been notified. Please try again later."
      : err.message || "Internal server error";

  return res.status(500).json(buildErrorResponse(message, null, err));
};

// ── 404 NOT FOUND HANDLER ─────────────────────────────────────────────────────
/**
 * Mount this BEFORE errorHandler but AFTER all routes.
 * Catches any request that didn't match a defined route.
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Cannot ${req.method} ${req.originalUrl} — this route does not exist on NestFind API`,
    404,
  );
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
};
