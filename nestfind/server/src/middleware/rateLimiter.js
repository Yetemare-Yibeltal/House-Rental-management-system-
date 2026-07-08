const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// ── RATE LIMIT RESPONSE HANDLER ───────────────────────────────────────────────
/**
 * Custom handler called when a client exceeds the rate limit.
 * Sends our standard API error response shape instead of the
 * default express-rate-limit plain text response.
 */
const rateLimitHandler = (req, res, next, options) => {
  logger.warn(`Rate limit exceeded`, {
    ip: req.ip || req.connection?.remoteAddress,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || "unauthenticated",
    userAgent: req.get("User-Agent"),
    limit: options.max,
    windowMs: options.windowMs,
  });

  return res.status(429).json({
    success: false,
    message:
      "Too many requests from this IP address. Please wait before trying again.",
    retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
  });
};

// ── SKIP FUNCTION ─────────────────────────────────────────────────────────────
/**
 * Skip rate limiting for trusted internal requests.
 * In development, we also skip to avoid interrupting development workflow.
 */
const skipInDevelopment = (req) => {
  return process.env.NODE_ENV === "development";
};

// ── 1. GLOBAL API LIMITER ─────────────────────────────────────────────────────
/**
 * Applied to ALL /api/* routes as a baseline protection.
 * 200 requests per 15 minutes per IP.
 * This is lenient — specific route limiters below are stricter.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: rateLimitHandler,
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    // Use forwarded IP if behind a proxy (e.g. Nginx, Railway, Render)
    return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  },
  message:
    "Too many requests from this IP address. Please wait before trying again.",
});

// ── 2. AUTH LIMITER (strictest) ───────────────────────────────────────────────
/**
 * Applied to /api/auth/login and /api/auth/register.
 * Prevents brute force login attacks and mass registration.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded — possible brute force attack`, {
      ip: req.ip || req.connection?.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      body: {
        email: req.body?.email, // Log email for security audit (no password)
      },
    });

    return res.status(429).json({
      success: false,
      message:
        "Too many login attempts from this IP address. Please wait 15 minutes before trying again.",
      retryAfter: 15, // minutes
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  },
});

// ── 3. OTP LIMITER ────────────────────────────────────────────────────────────
/**
 * Applied to /api/auth/send-otp and /api/auth/verify-otp.
 * Prevents OTP spam and brute force OTP guessing.
 * 5 requests per 10 minutes per IP.
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`OTP rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      url: req.originalUrl,
      email: req.body?.email,
    });

    return res.status(429).json({
      success: false,
      message:
        "Too many OTP requests. Please wait 10 minutes before requesting another code.",
      retryAfter: 10,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    // Key by email + IP to prevent one IP from blocking another user's OTP
    const email = req.body?.email || "";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    return `${ip}_${email}`;
  },
});

// ── 4. PASSWORD RESET LIMITER ─────────────────────────────────────────────────
/**
 * Applied to /api/auth/forgot-password and /api/auth/reset-password.
 * Prevents password reset spam.
 * 3 requests per 30 minutes per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Password reset rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      email: req.body?.email,
    });

    return res.status(429).json({
      success: false,
      message:
        "Too many password reset requests. Please wait 30 minutes before trying again.",
      retryAfter: 30,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    const email = req.body?.email || "";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    return `${ip}_${email}`;
  },
});

// ── 5. FILE UPLOAD LIMITER ────────────────────────────────────────────────────
/**
 * Applied to all upload endpoints (property images, avatars, KYC docs).
 * Prevents upload spam and storage abuse.
 * 30 uploads per hour per IP.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Upload rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
      url: req.originalUrl,
    });

    return res.status(429).json({
      success: false,
      message:
        "Upload limit reached. You can upload a maximum of 30 files per hour. Please try again later.",
      retryAfter: 60,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    // Key by userId if authenticated, otherwise by IP
    if (req.user?.id) return `upload_user_${req.user.id}`;
    return `upload_ip_${req.headers["x-forwarded-for"]?.split(",")[0] || req.ip}`;
  },
});

// ── 6. SEARCH LIMITER ─────────────────────────────────────────────────────────
/**
 * Applied to /api/properties/search.
 * Search queries are expensive — prevent scraping and search spam.
 * 60 requests per minute per IP.
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Search rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      query: req.query,
    });

    return res.status(429).json({
      success: false,
      message:
        "Too many search requests. Please slow down and try again in a moment.",
      retryAfter: 1,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  },
});

// ── 7. PAYMENT LIMITER ────────────────────────────────────────────────────────
/**
 * Applied to /api/tenant/payments/initiate.
 * Payment endpoints need extra protection from duplicate submissions.
 * 10 payment initiations per 10 minutes per user.
 */
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Payment rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
    });

    return res.status(429).json({
      success: false,
      message:
        "Too many payment attempts. Please wait 10 minutes before trying again.",
      retryAfter: 10,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    // Always key payments by userId, not IP, for accuracy
    if (req.user?.id) return `payment_${req.user.id}`;
    return `payment_ip_${req.headers["x-forwarded-for"]?.split(",")[0] || req.ip}`;
  },
});

// ── 8. ADMIN ACTION LIMITER ───────────────────────────────────────────────────
/**
 * Applied to sensitive admin actions (suspend user, delete property, broadcast).
 * Prevents admin accounts from being used to spam destructive actions
 * even if compromised.
 * 50 admin actions per 5 minutes.
 */
const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Admin action rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
      url: req.originalUrl,
      method: req.method,
    });

    return res.status(429).json({
      success: false,
      message:
        "Admin action rate limit reached. Please wait 5 minutes before performing more actions.",
      retryAfter: 5,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    if (req.user?.id) return `admin_${req.user.id}`;
    return `admin_ip_${req.headers["x-forwarded-for"]?.split(",")[0] || req.ip}`;
  },
});

// ── 9. MESSAGE LIMITER ────────────────────────────────────────────────────────
/**
 * Applied to /api/messages (POST — send message).
 * Prevents message spam between users.
 * 30 messages per minute per user.
 */
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Message rate limit exceeded`, {
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
    });

    return res.status(429).json({
      success: false,
      message: "You are sending messages too quickly. Please slow down.",
      retryAfter: 1,
    });
  },
  skip: skipInDevelopment,
  keyGenerator: (req) => {
    if (req.user?.id) return `message_${req.user.id}`;
    return `message_ip_${req.headers["x-forwarded-for"]?.split(",")[0] || req.ip}`;
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  uploadLimiter,
  searchLimiter,
  paymentLimiter,
  adminActionLimiter,
  messageLimiter,
};
