const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

// ── EXTRACT TOKEN FROM REQUEST ────────────────────────────────────────────────
/**
 * Extracts JWT token from multiple possible locations:
 * 1. Authorization header: "Bearer <token>"
 * 2. Cookie: "accessToken" (if cookie-based auth is used)
 * 3. Query parameter: "token" (for download links and email verification links)
 *
 * Priority: Authorization header > Cookie > Query param
 */
const extractToken = (req) => {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 2. Check cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // 3. Check query parameter (for email verification links etc.)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
};

// ── PROTECT MIDDLEWARE ────────────────────────────────────────────────────────
/**
 * Verifies JWT token and attaches user to req.user.
 * Blocks request with 401 if:
 *   - No token provided
 *   - Token is invalid or expired
 *   - User no longer exists in database
 *   - User account is suspended or deactivated
 *
 * Usage:
 *   router.get('/protected-route', protect, controller)
 */
const protect = asyncHandler(async (req, res, next) => {
  // Extract token from request
  const token = extractToken(req);

  if (!token) {
    return next(
      new AppError(
        "Authentication required. Please log in to access this resource.",
        401,
      ),
    );
  }

  // Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your session has expired. Please log in again.", 401),
      );
    }
    if (err.name === "JsonWebTokenError") {
      return next(
        new AppError("Invalid authentication token. Please log in again.", 401),
      );
    }
    return next(
      new AppError("Authentication failed. Please log in again.", 401),
    );
  }

  // Check that the user still exists in the database
  // (handles case where user was deleted after token was issued)
  const user = await User.findById(decoded.id)
    .select("+password") // Include password for password change check
    .lean(false); // We need the full document, not a plain object

  if (!user) {
    return next(
      new AppError(
        "The account associated with this token no longer exists.",
        401,
      ),
    );
  }

  // Check if account is suspended
  if (user.status === "suspended") {
    return next(
      new AppError(
        "Your account has been suspended. Please contact support at support@nestfind.et for assistance.",
        403,
      ),
    );
  }

  // Check if account is deactivated
  if (user.status === "deactivated") {
    return next(
      new AppError(
        "Your account has been deactivated. Please contact support to reactivate your account.",
        403,
      ),
    );
  }

  // Check if user changed password after the token was issued
  // This invalidates all tokens issued before the password change
  if (user.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10,
    );
    if (decoded.iat < passwordChangedTimestamp) {
      return next(
        new AppError(
          "Your password was recently changed. Please log in again with your new password.",
          401,
        ),
      );
    }
  }

  // Attach user to request object for use in controllers
  req.user = user;
  req.userId = user._id.toString();

  // Log authenticated request in development
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Authenticated request`, {
      userId: user._id,
      role: user.role,
      method: req.method,
      url: req.originalUrl,
    });
  }

  next();
});

// ── AUTHORIZE MIDDLEWARE ──────────────────────────────────────────────────────
/**
 * Checks that the authenticated user has one of the required roles.
 * Must be used AFTER protect middleware.
 * Returns 403 Forbidden if the user's role is not in the allowed list.
 *
 * Usage:
 *   // Only admins can access
 *   router.get('/admin/users', protect, authorize('admin'), controller)
 *
 *   // Both landlords and admins can access
 *   router.post('/properties', protect, authorize('landlord', 'admin'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required. Please use the protect middleware before authorize.",
          401,
        ),
      );
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized role access attempt`, {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${roles.join(", ")}. Your current role is: ${req.user.role}.`,
          403,
        ),
      );
    }

    next();
  };
};

// ── OPTIONAL AUTH MIDDLEWARE ──────────────────────────────────────────────────
/**
 * Tries to authenticate the user but does not block unauthenticated requests.
 * If a valid token is present, attaches user to req.user.
 * If no token or invalid token, req.user remains undefined and request continues.
 *
 * Used for public routes that show different content to logged-in users.
 * Example: Property listings show "Save" button only to logged-in tenants.
 *
 * Usage:
 *   router.get('/properties', optionalAuth, controller)
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(); // No token — continue as unauthenticated
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && user.status === "active") {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {
    // Invalid token — continue as unauthenticated (do not throw)
  }

  next();
});

// ── REQUIRE KYC MIDDLEWARE ────────────────────────────────────────────────────
/**
 * Checks that the authenticated user has completed KYC verification.
 * Must be used AFTER protect middleware.
 * Used for sensitive actions like creating property listings or signing contracts.
 *
 * Usage:
 *   router.post('/properties', protect, authorize('landlord'), requireKYC, controller)
 */
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  if (!req.user.isKYCVerified) {
    return next(
      new AppError(
        "Identity verification (KYC) is required before you can perform this action. Please complete your KYC verification in your profile settings.",
        403,
      ),
    );
  }

  next();
};

// ── VERIFY OWNERSHIP MIDDLEWARE ───────────────────────────────────────────────
/**
 * Factory function that creates middleware to check resource ownership.
 * Fetches the resource by ID and checks that req.user._id matches
 * the specified owner field on the resource.
 *
 * Admins bypass ownership checks (they can access any resource).
 *
 * Usage:
 *   const Property = require('../models/Property');
 *   router.delete(
 *     '/properties/:id',
 *     protect,
 *     authorize('landlord', 'admin'),
 *     verifyOwnership(Property, 'landlord'),
 *     controller
 *   )
 */
const verifyOwnership = (Model, ownerField = "user") => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params.id;

    if (!resourceId) {
      return next(new AppError("Resource ID is required.", 400));
    }

    // Admins bypass ownership checks
    if (req.user.role === "admin") {
      return next();
    }

    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(
        new AppError(
          `Resource not found. The item you are trying to access does not exist.`,
          404,
        ),
      );
    }

    // Get the owner ID from the resource
    const ownerId = resource[ownerField];

    if (!ownerId) {
      return next(
        new AppError(
          `Cannot verify ownership — owner field '${ownerField}' not found on this resource.`,
          500,
        ),
      );
    }

    // Compare owner ID with authenticated user ID
    const ownerIdStr = ownerId.toString();
    const userIdStr = req.user._id.toString();

    if (ownerIdStr !== userIdStr) {
      logger.warn(`Ownership verification failed`, {
        userId: req.user._id,
        userRole: req.user.role,
        resourceId,
        resourceOwner: ownerIdStr,
        model: Model.modelName,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });

      return next(
        new AppError(
          "Access denied. You do not have permission to perform this action on a resource you do not own.",
          403,
        ),
      );
    }

    // Attach resource to request so controller doesn't need to fetch it again
    req.resource = resource;
    next();
  });
};

// ── REQUIRE EMAIL VERIFIED ────────────────────────────────────────────────────
/**
 * Checks that the authenticated user has verified their email address.
 * Must be used AFTER protect middleware.
 * Blocks access to sensitive features until email is confirmed.
 *
 * Usage:
 *   router.post('/bookings', protect, requireEmailVerified, controller)
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  if (!req.user.isEmailVerified) {
    return next(
      new AppError(
        "Please verify your email address before performing this action. Check your inbox for a verification email from NestFind.",
        403,
      ),
    );
  }

  next();
};

// ── REQUIRE ACTIVE SUBSCRIPTION ───────────────────────────────────────────────
/**
 * Checks that a landlord has an active subscription/plan
 * before they can create new property listings beyond the free tier.
 * Must be used AFTER protect and authorize('landlord') middleware.
 */
const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  // Admins always bypass
  if (req.user.role === "admin") return next();

  // Check subscription status
  if (
    req.user.subscriptionStatus === "expired" ||
    req.user.subscriptionStatus === "cancelled"
  ) {
    return next(
      new AppError(
        "Your subscription has expired. Please renew your NestFind subscription to continue listing properties.",
        403,
      ),
    );
  }

  next();
});

// ── RATE LIMIT BY USER ────────────────────────────────────────────────────────
/**
 * Creates a per-user rate limiter that tracks requests by user ID
 * instead of IP address. Used for actions that should be limited per account
 * regardless of IP (e.g. sending messages, submitting payments).
 *
 * This is a simple in-memory implementation.
 * In production with multiple server instances, use Redis-backed rate limiting.
 */
const userRequestCounts = new Map();

const rateLimit = (maxRequests, windowMs, actionName) => {
  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or initialize request history for this user + action
    const key = `${userId}_${actionName}`;

    if (!userRequestCounts.has(key)) {
      userRequestCounts.set(key, []);
    }

    // Filter out requests outside the current window
    const requests = userRequestCounts
      .get(key)
      .filter((timestamp) => timestamp > windowStart);

    if (requests.length >= maxRequests) {
      logger.warn(`Per-user rate limit exceeded`, {
        userId,
        actionName,
        requestCount: requests.length,
        maxRequests,
        windowMs,
      });

      return res.status(429).json({
        success: false,
        message: `You have exceeded the limit for '${actionName}'. Please try again in ${Math.ceil(windowMs / 60000)} minute(s).`,
        retryAfter: Math.ceil(windowMs / 60000),
      });
    }

    // Add current request timestamp
    requests.push(now);
    userRequestCounts.set(key, requests);

    // Clean up old entries periodically (every 100 requests)
    if (userRequestCounts.size > 1000) {
      for (const [k, timestamps] of userRequestCounts.entries()) {
        const valid = timestamps.filter((t) => t > windowStart);
        if (valid.length === 0) {
          userRequestCounts.delete(k);
        } else {
          userRequestCounts.set(k, valid);
        }
      }
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireKYC,
  verifyOwnership,
  requireEmailVerified,
  requireActiveSubscription,
  rateLimit,
  extractToken,
};
