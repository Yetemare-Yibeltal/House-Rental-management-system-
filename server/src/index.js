'use strict';
const path = require('path');

// Load env FIRST before anything else
const dotenv = require('dotenv');
const envResult = dotenv.config({ path: path.join(__dirname, '../.env') });
if (envResult.error) {
  console.error('FATAL: Could not load .env file:', envResult.error.message);
  process.exit(1);
}

console.log('ENV loaded. MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

console.log('Express loaded');

const connectDB = require('./config/db');
const { verifyCloudinaryConfig } = require('./config/cloudinary');
const { verifyEmailConfig } = require('./config/email');
const { initializeSocket } = require('./config/socket');

console.log('Configs loaded');

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

console.log('Middleware loaded');

const logger = require('./utils/logger');

console.log('Logger loaded');

// ── PLACEHOLDER ROUTES ────────────────────────────────────────────────────────
const express_router = express.Router;
const authRoutes = express_router();
const propertyRoutes = express_router();
const savedPropertyRoutes = express_router();
const savedSearchRoutes = express_router();
const bookingRoutes = express_router();
const rentalRoutes = express_router();
const contractRoutes = express_router();
const paymentRoutes = express_router();
const maintenanceRoutes = express_router();
const landlordRoutes = express_router();
const adminRoutes = express_router();
const messageRoutes = express_router();
const notificationRoutes = express_router();
const blogRoutes = express_router();
const faqRoutes = express_router();

// ── CREATE EXPRESS APP ────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

console.log('HTTP server created');

// ── INITIALIZE SOCKET.IO ──────────────────────────────────────────────────────
initializeSocket(httpServer);

console.log('Socket.io initialized');

// ── TRUST PROXY ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.options('*', handlePreflight);

// ── COMPRESSION ───────────────────────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── REQUEST LOGGING ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
}

// ── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// ── SANITIZATION ─────────────────────────────────────────────────────────────
app.use(validateRequestSize);
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizeMiddleware);
app.use(hppMiddleware);
app.use(detectSuspiciousActivity);
app.use(validateContentType);
app.use(trimBodyStrings);

// ── RATE LIMITER ──────────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NestFind API is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
  });
});

// ── API ROOT ──────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NestFind API',
    version: '1.0.0',
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

// ── 404 + ERROR HANDLERS ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected');

    console.log('Verifying Cloudinary...');
    await verifyCloudinaryConfig();

    console.log('Verifying Email...');
    await verifyEmailConfig();

    httpServer.listen(PORT, HOST, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('  🏠  NestFind API Server Started');
      console.log('═══════════════════════════════════════════');
      console.log(`  Environment : ${process.env.NODE_ENV}`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  API URL     : http://localhost:${PORT}/api`);
      console.log(`  Health      : http://localhost:${PORT}/api/health`);
      console.log('═══════════════════════════════════════════');
      logger.info('NestFind server started successfully');
    });

    // ── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down...`);
      httpServer.close(async () => {
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
        } catch (err) {
          console.error('Error closing MongoDB:', err.message);
        }
        process.exit(0);
      });
      setTimeout(() => {
        console.error('Shutdown timed out — forcing exit');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason?.message || reason);
      if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error.message);
      console.error(error.stack);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('FATAL: Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();

module.exports = { app, httpServer };
