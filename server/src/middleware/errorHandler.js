const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (errors) this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err) => ({
  statusCode: 400,
  message: `'${err.value}' is not a valid ${err.path}. Please provide a valid ID.`,
});

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const labels = {
    email: "email address",
    phone: "phone number",
    slug: "title",
  };
  const label = labels[field] || field;
  return {
    statusCode: 409,
    message: `This ${label} (${value}) already exists.`,
  };
};

const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
    value: e.value !== undefined ? String(e.value) : undefined,
  }));
  return { statusCode: 422, message: "Validation failed", errors };
};

const buildErrorResponse = (message, errors, err) => {
  const response = { success: false, message };
  if (errors && errors.length > 0) response.errors = errors;
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.originalError = err.message;
  }
  return response;
};

const errorHandler = (err, req, res, next) => {
  logger.error(`[${err.name || "Error"}] ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || "unauthenticated",
  });

  if (err.name === "CastError") {
    const { statusCode, message } = handleCastError(err);
    return res.status(statusCode).json(buildErrorResponse(message, null, err));
  }
  if (err.code === 11000 || err.code === 11001) {
    const { statusCode, message } = handleDuplicateKeyError(err);
    return res.status(statusCode).json(buildErrorResponse(message, null, err));
  }
  if (err.name === "ValidationError" && err.errors) {
    const { statusCode, message, errors } = handleMongooseValidationError(err);
    return res
      .status(statusCode)
      .json(buildErrorResponse(message, errors, err));
  }
  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json(
        buildErrorResponse(
          "Invalid authentication token. Please log in again.",
          null,
          err,
        ),
      );
  }
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json(
        buildErrorResponse(
          "Your session has expired. Please log in again.",
          null,
          err,
        ),
      );
  }
  if (err.name === "MulterError") {
    const msgs = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
      LIMIT_FILE_COUNT: "Too many files. Maximum is 10.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    };
    return res
      .status(400)
      .json(buildErrorResponse(msgs[err.code] || err.message, null, err));
  }
  if (err.status === 429 || err.statusCode === 429) {
    return res
      .status(429)
      .json(
        buildErrorResponse(
          "Too many requests. Please wait and try again.",
          null,
          err,
        ),
      );
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res
      .status(400)
      .json(buildErrorResponse("Invalid JSON in request body.", null, err));
  }
  if (err.isOperational || err.statusCode) {
    return res
      .status(err.statusCode || 400)
      .json(buildErrorResponse(err.message, err.errors || null, err));
  }

  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message || "Internal server error";

  return res.status(500).json(buildErrorResponse(message, null, err));
};

const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Cannot ${req.method} ${req.originalUrl} — route not found`,
    404,
  );
  next(err);
};

module.exports = { errorHandler, notFoundHandler, AppError };
