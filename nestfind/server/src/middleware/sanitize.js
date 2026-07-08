const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const logger = require("../utils/logger");

// ── NOSQL INJECTION PREVENTION ────────────────────────────────────────────────
/**
 * express-mongo-sanitize strips out any keys that start with '$' or contain '.'
 * from req.body, req.query, and req.params.
 *
 * Example attack this prevents:
 * POST /api/auth/login
 * { "email": { "$gt": "" }, "password": { "$gt": "" } }
 * Without sanitization this would match ANY user in the database.
 *
 * replaceWith: '_' replaces the dangerous characters with underscore
 * instead of just removing them, which provides better logging visibility.
 */
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    logger.warn(`NoSQL injection attempt blocked`, {
      key,
      ip: req.ip || req.connection?.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || "unauthenticated",
      userAgent: req.get("User-Agent"),
    });
  },
});

// ── CUSTOM XSS SANITIZER ──────────────────────────────────────────────────────
/**
 * Recursively walks through req.body, req.query, and req.params
 * and escapes HTML entities in all string values.
 * This prevents stored XSS attacks where malicious scripts are saved
 * to the database and then rendered in the browser.
 *
 * Characters escaped:
 *   & → &amp;
 *   < → &lt;
 *   > → &gt;
 *   " → &quot;
 *   ' → &#x27;
 *   / → &#x2F;
 *   ` → &#x60;
 *   = → &#x3D;
 */
const escapeHtml = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#x60;")
    .replace(/=/g, "&#x3D;");
};

/**
 * Fields that should NOT be XSS-sanitized because they intentionally
 * contain HTML content — e.g. blog post body from the rich text editor.
 * These fields go through a separate HTML sanitization step in their
 * respective controllers.
 */
const HTML_ALLOWED_FIELDS = [
  "content", // Blog post body (rich text)
  "body", // Alternative field name for rich text content
  "description", // Property description (may contain formatting)
  "message", // Broadcast message (may contain basic HTML)
];

/**
 * Recursively sanitize an object's string values.
 * Skips fields listed in HTML_ALLOWED_FIELDS.
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevent infinite recursion on deeply nested objects
  if (depth > 10) return obj;
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (HTML_ALLOWED_FIELDS.includes(key)) {
        // Skip XSS sanitization for HTML-allowed fields
        // These will be sanitized by DOMPurify or similar in their controllers
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  // Numbers, booleans, etc. — return as-is
  return obj;
};

/**
 * Express middleware that applies XSS sanitization to
 * req.body, req.query, and req.params.
 */
const xssSanitizeMiddleware = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error(`XSS sanitization error: ${error.message}`, {
      ip: req.ip,
      url: req.originalUrl,
    });
    next(error);
  }
};

// ── HTTP PARAMETER POLLUTION PREVENTION ───────────────────────────────────────
/**
 * HPP prevents HTTP Parameter Pollution attacks where an attacker
 * sends duplicate query parameters to confuse the application.
 *
 * Example attack:
 * GET /api/properties?sort=price&sort=__proto__
 * Without HPP, express would give req.query.sort = ['price', '__proto__']
 * which could cause unexpected behavior.
 *
 * HPP takes the last value of duplicate params by default.
 *
 * whitelist: Parameters that ARE allowed to be arrays (pagination, filters).
 * For example: GET /api/properties?amenities=pool&amenities=gym is valid.
 */
const hppMiddleware = hpp({
  whitelist: [
    "amenities", // Property amenities filter (can be multiple)
    "propertyType", // Property type filter (can be multiple)
    "city", // City filter (can be multiple)
    "subCity", // Sub-city filter (can be multiple)
    "bedrooms", // Bedrooms filter (can be multiple values)
    "bathrooms", // Bathrooms filter
    "sort", // Sorting (allowed as array for multi-sort)
    "fields", // Field selection
    "status", // Status filter (can be multiple)
    "role", // Role filter (can be multiple)
    "category", // Blog category filter
  ],
});

// ── REQUEST SIZE VALIDATOR ────────────────────────────────────────────────────
/**
 * Validates that request body does not exceed reasonable limits
 * even before Multer processes file uploads.
 * This is a lightweight check — the actual body-parser limit is set in index.js.
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  const MAX_JSON_SIZE = 1 * 1024 * 1024; // 1MB for JSON bodies

  // Only check non-multipart requests (multipart is handled by Multer)
  const isMultipart = req.headers["content-type"]?.includes(
    "multipart/form-data",
  );

  if (!isMultipart && contentLength > MAX_JSON_SIZE) {
    logger.warn(`Request body too large`, {
      contentLength,
      maxAllowed: MAX_JSON_SIZE,
      ip: req.ip,
      url: req.originalUrl,
      userId: req.user?.id,
    });

    return res.status(413).json({
      success: false,
      message: `Request body too large. Maximum JSON body size is 1MB.`,
    });
  }

  next();
};

// ── SUSPICIOUS PATTERN DETECTOR ───────────────────────────────────────────────
/**
 * Detects and logs suspicious patterns in request URLs and bodies
 * that may indicate scanning, probing, or exploitation attempts.
 * Does not block requests — only logs them for security monitoring.
 * Real blocking is handled by the WAF / Nginx in production.
 */
const SUSPICIOUS_PATTERNS = [
  /(\.\.\/)|(\.\.\\)/, // Path traversal
  /(<script|<iframe|javascript:)/i, // Script injection in URL
  /(\bunion\b.*\bselect\b)/i, // SQL injection attempt
  /(\bexec\b|\beval\b|\bsystem\b)/i, // Code execution attempt
  /(\/etc\/passwd|\/etc\/shadow)/i, // Linux file probing
  /(cmd\.exe|powershell)/i, // Windows command injection
  /(\$\{.*\})/, // Template injection
  /(base64_decode|base64_encode)/i, // Encoded payload attempt
];

const detectSuspiciousActivity = (req, res, next) => {
  const urlToCheck = decodeURIComponent(req.originalUrl);
  const bodyStr = req.body ? JSON.stringify(req.body) : "";

  const isSuspicious = SUSPICIOUS_PATTERNS.some(
    (pattern) => pattern.test(urlToCheck) || pattern.test(bodyStr),
  );

  if (isSuspicious) {
    logger.warn(`Suspicious request pattern detected`, {
      ip: req.ip || req.connection?.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id || "unauthenticated",
      referer: req.get("Referer"),
    });
    // We log but do not block here — let the request proceed
    // The actual data validation in controllers will reject invalid input
    // Blocking based on patterns alone causes false positives
  }

  next();
};

// ── CONTENT TYPE VALIDATOR ────────────────────────────────────────────────────
/**
 * Ensures that POST/PUT/PATCH requests with a body have the correct
 * Content-Type header. Rejects requests that claim to be JSON but aren't,
 * or that have no Content-Type when a body is expected.
 */
const validateContentType = (req, res, next) => {
  const methodsWithBody = ["POST", "PUT", "PATCH"];

  if (!methodsWithBody.includes(req.method)) {
    return next();
  }

  const contentType = req.headers["content-type"] || "";
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);

  // If there's no body content, skip content type check
  if (contentLength === 0 && !req.headers["transfer-encoding"]) {
    return next();
  }

  // Allow multipart (file uploads), JSON, and URL-encoded forms
  const allowedTypes = [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
  ];

  const isAllowed = allowedTypes.some((type) => contentType.includes(type));

  if (!isAllowed && contentLength > 0) {
    logger.warn(`Invalid Content-Type in request`, {
      contentType,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    return res.status(415).json({
      success: false,
      message: `Unsupported Content-Type '${contentType}'. Please use application/json or multipart/form-data.`,
    });
  }

  next();
};

// ── TRIM STRING MIDDLEWARE ────────────────────────────────────────────────────
/**
 * Trims leading/trailing whitespace from all string values in req.body.
 * Prevents issues like "  john@email.com  " being stored in the database.
 * Applied after body parsing, before validation.
 */
const trimBodyStrings = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    const trimObject = (obj) => {
      if (typeof obj === "string") return obj.trim();
      if (Array.isArray(obj)) return obj.map(trimObject);
      if (obj !== null && typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key, trimObject(value)]),
        );
      }
      return obj;
    };
    req.body = trimObject(req.body);
  }
  next();
};

module.exports = {
  mongoSanitizeMiddleware,
  xssSanitizeMiddleware,
  hppMiddleware,
  validateRequestSize,
  detectSuspiciousActivity,
  validateContentType,
  trimBodyStrings,
};
