/**
 * NestFind API Response Helpers
 *
 * Every API response follows this shape:
 *
 * Success:
 * {
 *   success: true,
 *   message: "Human readable message",
 *   data: { ... } or [ ... ],
 *   pagination: { page, limit, total, pages } // only on list endpoints
 * }
 *
 * Error:
 * {
 *   success: false,
 *   message: "Human readable error message",
 *   errors: [ { field, message } ] // only on validation errors
 *   stack: "..." // only in development
 * }
 */

// ── SUCCESS RESPONSES ────────────────────────────────────────────────────────

/**
 * 200 OK — General success
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * 200 OK — Success with pagination (for list endpoints)
 */
const sendPaginated = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage:
        pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1,
    },
  });
};

/**
 * 201 Created — Resource successfully created
 */
const sendCreated = (res, message, data = null) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(201).json(response);
};

/**
 * 204 No Content — Success with no body (e.g. DELETE)
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

// ── ERROR RESPONSES ──────────────────────────────────────────────────────────

/**
 * 400 Bad Request — Invalid input from client
 */
const sendBadRequest = (res, message = "Bad request", errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(400).json(response);
};

/**
 * 401 Unauthorized — Not authenticated
 */
const sendUnauthorized = (res, message = "Authentication required") => {
  return res.status(401).json({
    success: false,
    message,
  });
};

/**
 * 403 Forbidden — Authenticated but not allowed
 */
const sendForbidden = (
  res,
  message = "You do not have permission to perform this action",
) => {
  return res.status(403).json({
    success: false,
    message,
  });
};

/**
 * 404 Not Found — Resource does not exist
 */
const sendNotFound = (res, message = "Resource not found") => {
  return res.status(404).json({
    success: false,
    message,
  });
};

/**
 * 409 Conflict — Resource already exists
 */
const sendConflict = (res, message = "Resource already exists") => {
  return res.status(409).json({
    success: false,
    message,
  });
};

/**
 * 422 Unprocessable Entity — Validation errors
 */
const sendValidationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: Array.isArray(errors)
      ? errors
      : Object.entries(errors).map(([field, message]) => ({ field, message })),
  });
};

/**
 * 429 Too Many Requests — Rate limit exceeded
 */
const sendTooManyRequests = (
  res,
  message = "Too many requests. Please try again later.",
) => {
  return res.status(429).json({
    success: false,
    message,
  });
};

/**
 * 500 Internal Server Error — Unexpected server error
 */
const sendServerError = (
  res,
  message = "An unexpected error occurred",
  error = null,
) => {
  const response = {
    success: false,
    message,
  };
  // Only expose stack trace in development
  if (process.env.NODE_ENV === "development" && error) {
    response.stack = error.stack;
    response.details = error.message;
  }
  return res.status(500).json(response);
};

// ── PAGINATION HELPER ────────────────────────────────────────────────────────

/**
 * Extract and validate pagination params from query string
 * Usage: const { page, limit, skip } = getPagination(req.query)
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build sort object from query string
 * Usage: const sort = getSort(req.query, { default: 'createdAt', allowed: ['price', 'createdAt'] })
 */
const getSort = (query, options = {}) => {
  const {
    defaultField = "createdAt",
    defaultOrder = "desc",
    allowed = [],
  } = options;

  const sortField = allowed.includes(query.sortBy)
    ? query.sortBy
    : defaultField;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { [sortField]: sortOrder };
};

/**
 * Format express-validator errors into our standard shape
 * Usage: const errors = formatValidationErrors(validationResult(req))
 */
const formatValidationErrors = (validationResult) => {
  return validationResult.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value,
  }));
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendTooManyRequests,
  sendServerError,
  getPagination,
  getSort,
  formatValidationErrors,
};
