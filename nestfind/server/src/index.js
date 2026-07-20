const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// ── IMPORT CONFIGS ────────────────────────────────────────────────────────────
const connectDB = require('./config/db');
const { verifyCloudinaryConfig } = require('./config/cloudinary');
const { verifyEmailConfig } = require('./config/email');
const { initializeSocket } = require('./config/socket');

// ── IMPORT MIDDLEWARE ─────────────────────────────────────────────────────────
const { corsMiddleware, helmetMiddleware, handlePreflight } = require('./middleware/cors');
const { globalLimiter } = require('./middleware/rateLimiter');
const {
  mongoSanitizeMiddleware,
  xssSanitizeMiddleware,
  hppMiddleware,
  validateRequestSize,
  detectSuspiciousActivity,
  validateContentType,
  trimBodyStrings,
} = require('./middleware/sanitize');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ── IMPORT UTILS ──────────────────────────────────────────────────────────────
const logger = require('./utils/logger');

// ── PLACEHOLDER ROUTES (replaced one by one as each route file is built) ──────
// ── IMPORT ROUTES ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const savedPropertyRoutes = require('./routes/savedPropertyRoutes');
const savedSearchRoutes = require('./routes/savedSearchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const contractRoutes = require('./routes/contractRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const landlordRoutes = require('./routes/landlordRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const blogRoutes = require('./routes/blogRoutes');
const faqRoutes = require('./routes/faqRoutes');
const aiRoutes = require('./routes/ai/aiRoutes');

// ── CREATE EXPRESS APP ────────────────────────────────────────────────────────
const app = express();

// ── CREATE HTTP SERVER ────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ── INITIALIZE SOCKET.IO ──────────────────────────────────────────────────────
initializeSocket(httpServer);

// ── TRUST PROXY ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.options('*', handlePreflight);

// ── COMPRESSION ───────────────────────────────────────────────────────────────
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// ── REQUEST LOGGING ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(
    morgan('combined', {
      stream: logger.stream,
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// ── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// ── SANITIZATION MIDDLEWARE ───────────────────────────────────────────────────
app.use(validateRequestSize);
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizeMiddleware);
app.use(hppMiddleware);
app.use(detectSuspiciousActivity);
app.use(validateContentType);
app.use(trimBodyStrings);

// ── GLOBAL RATE LIMITER ───────────────────────────────────────────────────────
app.use('/api', globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/tenant/saved-properties", savedPropertyRoutes);
app.use("/api/tenant/saved-searches", savedSearchRoutes);
app.use("/api/tenant/bookings", bookingRoutes);
app.use("/api/tenant/rentals", rentalRoutes);
app.use("/api/tenant/contracts", contractRoutes);
app.use("/api/tenant/payments", paymentRoutes);
app.use("/api/tenant/maintenance", maintenanceRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NestFind API is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// ── API INFO ──────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NestFind API',
    version: '1.0.0',
    description: "Ethiopia's premier house rental management system API",
  });
});

// ── MOUNT ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/tenant/saved-properties', savedPropertyRoutes);
app.use('/api/tenant/saved-searches', savedSearchRoutes);
app.use('/api/tenant/bookings', bookingRoutes);
app.use('/api/tenant/rentals', rentalRoutes);
app.use('/api/tenant/contracts', contractRoutes);
app.use('/api/tenant/payments', paymentRoutes);
app.use('/api/tenant/maintenance', maintenanceRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/ai", aiRoutes);
const aiRoutes = express_router();
// ── PRODUCTION STATIC FILES ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath, { maxAge: '1y', etag: true }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── 404 HANDLER ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await connectDB();
    await verifyCloudinaryConfig();
    await verifyEmailConfig();

    httpServer.listen(PORT, HOST, () => {
      logger.info('═══════════════════════════════════════════');
      logger.info('  🏠  NestFind API Server Started');
      logger.info('═══════════════════════════════════════════');
      logger.info(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Port        : ${PORT}`);
      logger.info(`  API URL     : http://${HOST}:${PORT}/api`);
      logger.info(`  Health      : http://${HOST}:${PORT}/api/health`);
      logger.info('═══════════════════════════════════════════');
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully...`);
      httpServer.close(async () => {
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (err) {
          logger.error(`Error closing MongoDB: ${err.message}`);
        }
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
      });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = { app, httpServer };
