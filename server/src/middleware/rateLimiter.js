const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

const rateLimitHandler = (req, res, next, options) => {
  logger.warn(`Rate limit exceeded`, { ip: req.ip, url: req.originalUrl });
  return res.status(429).json({
    success: false,
    message: "Too many requests. Please wait before trying again.",
    retryAfter: Math.ceil(options.windowMs / 1000 / 60),
  });
};

const skipInDevelopment = () => process.env.NODE_ENV === "development";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipInDevelopment,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please wait 15 minutes.",
      retryAfter: 15,
    });
  },
  skip: skipInDevelopment,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Too many OTP requests. Please wait 10 minutes.",
      retryAfter: 10,
    });
  },
  skip: skipInDevelopment,
});

const passwordResetLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Too many password reset requests. Please wait 30 minutes.",
      retryAfter: 30,
    });
  },
  skip: skipInDevelopment,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Upload limit reached. Maximum 30 files per hour.",
      retryAfter: 60,
    });
  },
  skip: skipInDevelopment,
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Too many search requests. Please slow down.",
      retryAfter: 1,
    });
  },
  skip: skipInDevelopment,
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Too many payment attempts. Please wait 10 minutes.",
      retryAfter: 10,
    });
  },
  skip: skipInDevelopment,
});

const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "Admin action rate limit reached. Please wait 5 minutes.",
      retryAfter: 5,
    });
  },
  skip: skipInDevelopment,
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(429).json({
      success: false,
      message: "You are sending messages too quickly.",
      retryAfter: 1,
    });
  },
  skip: skipInDevelopment,
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
