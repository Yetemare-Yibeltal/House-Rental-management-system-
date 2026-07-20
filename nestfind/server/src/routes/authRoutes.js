// nestfind/nestfind/server/src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, optionalAuth } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");
const {
  validateRegister,
  validateLogin,
  validateOTP,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateResendOTP,
  validateRefreshToken,
  validateNotificationPreferences,
  validateAIPreferences,
} = require("../validators/authValidators");

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.post(
  "/register",
  authLimiter,
  validateRegister,
  authController.register,
);
router.post("/login", authLimiter, validateLogin, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateResetPassword,
  authController.resetPassword,
);

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────────
router.use(protect);

// Auth actions
router.post("/logout", authController.logout);
router.post("/logout-all", authController.logoutAll);
router.post(
  "/verify-email",
  otpLimiter,
  validateOTP,
  authController.verifyEmail,
);
router.post("/send-otp", otpLimiter, authController.sendOTP);
router.post("/verify-otp", otpLimiter, validateOTP, authController.verifyOTP);
router.post(
  "/resend-otp",
  otpLimiter,
  validateResendOTP,
  authController.sendOTP,
);

// Profile
router.get("/me", authController.getMe);
router.patch("/profile", validateUpdateProfile, authController.updateProfile);
router.post("/upload-avatar", uploadAvatar, authController.uploadAvatar);
router.patch(
  "/change-password",
  validateChangePassword,
  authController.changePassword,
);

// Preferences
router.patch(
  "/notification-preferences",
  validateNotificationPreferences,
  authController.updateNotificationPreferences,
);
router.patch(
  "/ai-preferences",
  validateAIPreferences,
  authController.updateAIPreferences,
);

// KYC
router.post("/kyc", authController.submitKYC);
router.get("/kyc/status", authController.getKYCStatus);

// Sessions
router.get("/sessions", authController.getActiveSessions);

// Account
router.delete("/account", otpLimiter, authController.deleteAccount);

module.exports = router;
