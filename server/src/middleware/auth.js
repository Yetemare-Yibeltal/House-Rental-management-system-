const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer "))
    return authHeader.split(" ")[1];
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
  if (req.query && req.query.token) return req.query.token;
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token)
    return next(new AppError("Authentication required. Please log in.", 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(
        new AppError("Your session has expired. Please log in again.", 401),
      );
    return next(
      new AppError("Invalid authentication token. Please log in again.", 401),
    );
  }

  const user = await User.findById(decoded.id);
  if (!user)
    return next(
      new AppError(
        "The account associated with this token no longer exists.",
        401,
      ),
    );
  if (user.status === "suspended")
    return next(
      new AppError(
        "Your account has been suspended. Contact support@nestfind.et",
        403,
      ),
    );
  if (user.status === "deactivated")
    return next(
      new AppError("Your account has been deactivated. Contact support.", 403),
    );

  if (user.passwordChangedAt) {
    const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedAt)
      return next(
        new AppError(
          "Password was recently changed. Please log in again.",
          401,
        ),
      );
  }

  req.user = user;
  req.userId = user._id.toString();
  next();
});

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required.", 401));
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt`, {
        userId: req.user._id,
        role: req.user.role,
        required: roles,
        url: req.originalUrl,
      });
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(", ")}. Your role: ${req.user.role}.`,
          403,
        ),
      );
    }
    next();
  };

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.status === "active") {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {}
  next();
});

const requireKYC = (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required.", 401));
  if (!req.user.isKYCVerified)
    return next(
      new AppError(
        "Identity verification (KYC) is required before performing this action.",
        403,
      ),
    );
  next();
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required.", 401));
  if (!req.user.isEmailVerified)
    return next(
      new AppError(
        "Please verify your email address before performing this action.",
        403,
      ),
    );
  next();
};

const verifyOwnership = (Model, ownerField = "user") =>
  asyncHandler(async (req, res, next) => {
    if (!req.params.id)
      return next(new AppError("Resource ID is required.", 400));
    if (req.user.role === "admin") return next();
    const resource = await Model.findById(req.params.id);
    if (!resource) return next(new AppError("Resource not found.", 404));
    const ownerId = resource[ownerField];
    if (!ownerId)
      return next(
        new AppError(`Owner field '${ownerField}' not found on resource.`, 500),
      );
    if (ownerId.toString() !== req.user._id.toString()) {
      logger.warn(`Ownership check failed`, {
        userId: req.user._id,
        resourceId: req.params.id,
      });
      return next(
        new AppError("Access denied. You do not own this resource.", 403),
      );
    }
    req.resource = resource;
    next();
  });

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireKYC,
  requireEmailVerified,
  verifyOwnership,
  extractToken,
};
