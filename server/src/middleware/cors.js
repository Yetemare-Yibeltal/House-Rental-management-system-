const cors = require("cors");
const helmet = require("helmet");
const logger = require("../utils/logger");

const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ];
  if (process.env.CLIENT_URL) origins.push(process.env.CLIENT_URL);
  return [...new Set(origins)];
};

const corsOptions = {
  origin: (requestOrigin, callback) => {
    const allowed = getAllowedOrigins();
    if (!requestOrigin) return callback(null, true);
    if (allowed.includes(requestOrigin)) return callback(null, true);
    logger.warn("CORS blocked: " + requestOrigin);
    callback(new Error("CORS policy: not allowed"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Access-Token",
    "X-Refresh-Token",
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);
const helmetMiddleware = helmet();
const handlePreflight = cors(corsOptions);

module.exports = {
  corsMiddleware,
  helmetMiddleware,
  handlePreflight,
  corsOptions,
  getAllowedOrigins,
};
