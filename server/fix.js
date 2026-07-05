const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const logger = require("../utils/logger");

const mongoSanitizeMiddleware = mongoSanitize({ replaceWith: "_" });

const xssSanitizeMiddleware = (req, res, next) => {
  try {
    const escape = (s) =>
      typeof s !== "string"
        ? s
        : s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const clean = (o, d) => {
      if (d > 10 || o === null || o === undefined) return o;
      if (typeof o === "string") return escape(o);
      if (Array.isArray(o)) return o.map((i) => clean(i, d + 1));
      if (typeof o === "object") {
        const skip = ["content", "body", "description", "message"];
        const r = {};
        for (const [k, v] of Object.entries(o)) {
          r[k] = skip.includes(k) ? v : clean(v, d + 1);
        }
        return r;
      }
      return o;
    };
    if (req.body && typeof req.body === "object") req.body = clean(req.body, 0);
    if (req.query && typeof req.query === "object")
      req.query = clean(req.query, 0);
    if (req.params && typeof req.params === "object")
      req.params = clean(req.params, 0);
    next();
  } catch (e) {
    next(e);
  }
};

const hppMiddleware = hpp({
  whitelist: [
    "amenities",
    "propertyType",
    "city",
    "subCity",
    "bedrooms",
    "bathrooms",
    "sort",
    "fields",
    "status",
    "role",
    "category",
  ],
});

const validateRequestSize = (req, res, next) => {
  const cl = parseInt(req.headers["content-length"] || "0", 10);
  const isMulti = (req.headers["content-type"] || "").includes(
    "multipart/form-data",
  );
  if (!isMulti && cl > 1048576) {
    return res
      .status(413)
      .json({ success: false, message: "Request body too large." });
  }
  next();
};

const detectSuspiciousActivity = (req, res, next) => {
  try {
    const url = decodeURIComponent(req.originalUrl);
    const patterns = [/\.\.\//, /<script/i, /\/etc\/passwd/i];
    if (patterns.some((p) => p.test(url))) {
      logger.warn("Suspicious request: " + url);
    }
  } catch (e) {}
  next();
};

const validateContentType = (req, res, next) => {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();
  const ct = req.headers["content-type"] || "";
  const cl = parseInt(req.headers["content-length"] || "0", 10);
  if (cl === 0) return next();
  const ok = [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
  ].some((t) => ct.includes(t));
  if (!ok && cl > 0) {
    return res
      .status(415)
      .json({ success: false, message: "Unsupported Content-Type: " + ct });
  }
  next();
};

const trimBodyStrings = (req, res, next) => {
  const trim = (o) => {
    if (typeof o === "string") return o.trim();
    if (Array.isArray(o)) return o.map(trim);
    if (o !== null && typeof o === "object") {
      return Object.fromEntries(
        Object.entries(o).map(([k, v]) => [k, trim(v)]),
      );
    }
    return o;
  };
  if (req.body && typeof req.body === "object") req.body = trim(req.body);
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
