const cors = require("cors");
const helmet = require("helmet");
const logger = require("../utils/logger");

// ── ALLOWED ORIGINS ───────────────────────────────────────────────────────────
/**
 * List of origins that are allowed to make requests to this API.
 * In production this should only include your actual frontend domain.
 * In development it includes localhost on common Vite/React ports.
 */
const getAllowedOrigins = () => {
  const origins = [];

  // Always allow the CLIENT_URL from environment
  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL);
  }

  // In development allow common local ports
  if (process.env.NODE_ENV === "development") {
    origins.push(
      "http://localhost:5173", // Vite default
      "http://localhost:3000", // Create React App
      "http://localhost:4173", // Vite preview
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    );
  }

  // Add any extra allowed origins from environment (comma separated)
  if (process.env.EXTRA_ALLOWED_ORIGINS) {
    const extra = process.env.EXTRA_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    origins.push(...extra);
  }

  return [...new Set(origins)]; // Remove duplicates
};

// ── CORS OPTIONS ──────────────────────────────────────────────────────────────
const corsOptions = {
  /**
   * Dynamic origin check — called for every incoming request.
   * Checks if the request origin is in our allowed list.
   * Allows requests with no origin (mobile apps, Postman, server-to-server).
   */
  origin: (requestOrigin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin header (mobile apps, Postman, curl, etc.)
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${requestOrigin}`, {
        allowedOrigins,
      });
      callback(
        new Error(
          `CORS policy: Origin ${requestOrigin} is not allowed to access this API.`,
        ),
        false,
      );
    }
  },

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed request headers
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Access-Token",
    "X-Refresh-Token",
    "Cache-Control",
    "Pragma",
  ],

  // Headers exposed to the browser in the response
  exposedHeaders: [
    "X-Total-Count", // Used for pagination total
    "X-Page", // Current page
    "X-Limit", // Items per page
    "RateLimit-Limit", // Rate limit max
    "RateLimit-Remaining", // Rate limit remaining
    "RateLimit-Reset", // Rate limit reset time
  ],

  // Allow cookies / Authorization headers in cross-origin requests
  credentials: true,

  // How long browser should cache CORS preflight response (in seconds)
  // 86400 = 24 hours — reduces preflight OPTIONS requests
  maxAge: 86400,

  // Automatically handle OPTIONS preflight requests
  optionsSuccessStatus: 204,
};

// ── HELMET CONFIGURATION ──────────────────────────────────────────────────────
/**
 * Helmet sets security-related HTTP response headers.
 * Each option below is explicitly configured for NestFind's needs.
 */
const helmetOptions = {
  /**
   * Content-Security-Policy — controls what resources the browser can load.
   * Configured to allow our frontend assets, Cloudinary images, and Google Fonts.
   */
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some React builds
        "https://cdn.jsdelivr.net",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles in React
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com", // Cloudinary images
        "https://ui-avatars.com", // Fallback avatars
        "https://maps.googleapis.com", // Map tiles
        "https://*.tile.openstreetmap.org", // OpenStreetMap
      ],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL || "http://localhost:5173",
        "wss:", // WebSocket connections (Socket.io)
        "ws:",
        "https://api.cloudinary.com",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
    // Disable CSP in development for easier debugging
    reportOnly: process.env.NODE_ENV === "development",
  },

  /**
   * X-Frame-Options — prevents clickjacking by disabling iframes.
   * DENY = cannot be embedded in any frame.
   */
  frameguard: {
    action: "deny",
  },

  /**
   * Strict-Transport-Security (HSTS) — forces HTTPS.
   * Only enabled in production (no HTTPS in local development).
   * maxAge: 1 year in seconds.
   * includeSubDomains: applies to all subdomains.
   * preload: allows inclusion in browser HSTS preload list.
   */
  hsts:
    process.env.NODE_ENV === "production"
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

  /**
   * X-Content-Type-Options — prevents MIME type sniffing.
   * Forces browser to use the declared Content-Type.
   */
  noSniff: true,

  /**
   * X-XSS-Protection — legacy XSS filter for older browsers.
   * Modern browsers use CSP instead, but this adds compatibility.
   */
  xssFilter: true,

  /**
   * Referrer-Policy — controls how much referrer info is sent.
   * 'strict-origin-when-cross-origin' is the recommended modern setting.
   */
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  /**
   * X-DNS-Prefetch-Control — controls browser DNS prefetching.
   * Disabled to prevent information leakage about linked resources.
   */
  dnsPrefetchControl: {
    allow: false,
  },

  /**
   * X-Permitted-Cross-Domain-Policies — for Adobe Flash/PDF.
   * 'none' since we don't use Flash or PDF cross-domain embedding.
   */
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },

  /**
   * X-Download-Options — prevents IE from executing downloads in site context.
   * Legacy but still good practice.
   */
  ieNoOpen: true,

  /**
   * X-Powered-By — Helmet removes the 'X-Powered-By: Express' header
   * so attackers can't fingerprint the server technology.
   */
  hidePoweredBy: true,

  /**
   * Cross-Origin-Embedder-Policy — prevents cross-origin resource embedding.
   */
  crossOriginEmbedderPolicy:
    process.env.NODE_ENV === "production" ? { policy: "require-corp" } : false,

  /**
   * Cross-Origin-Opener-Policy — isolates browsing context.
   */
  crossOriginOpenerPolicy:
    process.env.NODE_ENV === "production" ? { policy: "same-origin" } : false,

  /**
   * Cross-Origin-Resource-Policy — controls who can load our resources.
   */
  crossOriginResourcePolicy:
    process.env.NODE_ENV === "production" ? { policy: "same-site" } : false,

  /**
   * Origin-Agent-Cluster — provides origin isolation.
   */
  originAgentCluster: true,
};

// ── EXPORTS ───────────────────────────────────────────────────────────────────
/**
 * corsMiddleware — use as app.use(corsMiddleware) in index.js
 * helmetMiddleware — use as app.use(helmetMiddleware) in index.js
 *
 * Also exports corsOptions for use with Socket.io configuration.
 */
const corsMiddleware = cors(corsOptions);
const helmetMiddleware = helmet(helmetOptions);

/**
 * Handle CORS preflight OPTIONS requests explicitly.
 * Some clients send an OPTIONS request before the actual request
 * to check if CORS allows it. This handles those preflight requests.
 */
const handlePreflight = cors(corsOptions);

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  handlePreflight,
  corsOptions,
  getAllowedOrigins,
};
