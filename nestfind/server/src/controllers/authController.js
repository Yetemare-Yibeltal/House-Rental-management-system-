// nestfind/nestfind/server/src/controllers/authController.js

const { validationResult } = require("express-validator");
const User = require("../models/User");
const KYCVerification = require("../models/KYCVerification");
const AuditLog = require("../models/AuditLog");
const jwtService = require("../services/jwtService");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");
const cloudinaryService = require("../services/cloudinaryService");
const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");
const logger = require("../utils/logger");

// ── REGISTER ──────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    firstName,
    lastName,
    email,
    password,
    role = "tenant",
    phone,
    referralCode,
  } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email }).setOptions({
    includeDeleted: true,
  });
  if (existingUser) {
    return sendError(
      res,
      "An account with this email address already exists. Please login or use a different email.",
      409,
    );
  }

  // Validate referral code if provided
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) {
      referredBy = referrer._id;
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { referralCount: 1 },
      });
    }
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    referredBy,
    status: "pending",
    isEmailVerified: false,
  });

  // Send email verification OTP
  await otpService.sendOTP({
    userId: user._id,
    purpose: "email_verification",
    email: user.email,
    firstName: user.firstName,
    deliveryMethod: "email",
  });

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.firstName, user.role);

  // Create welcome notification
  await notificationService.sendNotification({
    recipientId: user._id,
    type: "welcome",
    data: { firstName: user.firstName },
    channels: { inApp: true },
  });

  // Log registration
  await AuditLog.logFromRequest(req, "user_registered", {
    resourceType: "User",
    resourceId: user._id,
    description: `New ${role} registered: ${email}`,
  });

  logger.info(`New user registered: ${email}, role: ${role}`);

  return sendSuccess(
    res,
    "Account created successfully. Please check your email for a verification code.",
    {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    },
    201,
  );
});

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { otp, purpose } = req.body;
  const userId = req.user._id;

  const result = await otpService.verifyOTP(
    userId,
    purpose || "email_verification",
    otp,
  );

  if (!result.success) {
    return sendError(res, result.error, 400, {
      remainingAttempts: result.remainingAttempts,
    });
  }

  // Update user status
  await User.findByIdAndUpdate(userId, {
    isEmailVerified: true,
    status: "active",
  });

  await AuditLog.logFromRequest(req, "email_verified", {
    resourceType: "User",
    resourceId: userId,
  });

  return sendSuccess(
    res,
    "Email verified successfully. Your account is now active.",
  );
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { email, password, rememberMe = false } = req.body;

  // Find user with password
  const user = await User.findByEmail(email);

  if (!user) {
    await AuditLog.logFromRequest(req, "user_login_failed", {
      description: `Login failed: email not found (${email})`,
      severity: "warning",
      status: "failure",
    });
    return sendError(
      res,
      "Invalid email or password. Please check your credentials and try again.",
      401,
    );
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    const lockExpiry = new Date(user.lockUntil);
    return sendError(
      res,
      `Your account is temporarily locked due to too many failed login attempts. Please try again after ${lockExpiry.toLocaleTimeString()}.`,
      423,
    );
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementFailedLogins();
    await AuditLog.logFromRequest(req, "user_login_failed", {
      resourceType: "User",
      resourceId: user._id,
      description: `Invalid password attempt for ${email}`,
      severity: "warning",
      status: "failure",
    });
    const attemptsLeft = Math.max(0, 5 - user.failedLoginAttempts);
    return sendError(
      res,
      `Invalid email or password.${attemptsLeft <= 2 ? ` ${attemptsLeft} attempt(s) remaining before account lock.` : ""}`,
      401,
    );
  }

  // Check account status
  if (user.status === "suspended") {
    return sendError(
      res,
      "Your account has been suspended. Please contact support@nestfind.et for assistance.",
      403,
    );
  }
  if (user.status === "deactivated") {
    return sendError(
      res,
      "Your account has been deactivated. Please contact support to reactivate.",
      403,
    );
  }

  // Reset failed logins and update login info
  await user.resetFailedLogins();
  await User.findByIdAndUpdate(user._id, {
    lastLoginIP: req.ip,
    lastActiveAt: new Date(),
  });

  // Generate token pair
  const deviceInfo = jwtService.extractDeviceInfo(req);
  const tokens = await jwtService.generateTokenPair(user, deviceInfo, req.ip);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });

  await AuditLog.logFromRequest(req, "user_logged_in", {
    resourceType: "User",
    resourceId: user._id,
    description: `User logged in: ${email}`,
  });

  return sendSuccess(res, "Login successful. Welcome back!", {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      isKYCVerified: user.isKYCVerified,
      kycStatus: user.kycStatus,
      status: user.status,
      aiPreferences: user.aiPreferences,
    },
    tokens: {
      accessToken: tokens.accessToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
    },
  });
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return sendError(
      res,
      "Refresh token is required. Please login again.",
      401,
    );
  }

  const { valid, user, tokenRecord, error } =
    await jwtService.verifyRefreshToken(token);

  if (!valid) {
    res.clearCookie("refreshToken");
    return sendError(
      res,
      error || "Invalid or expired session. Please login again.",
      401,
    );
  }

  // Mark token as used
  await tokenRecord.markAsUsed();

  // Rotate tokens
  const deviceInfo = jwtService.extractDeviceInfo(req);
  const tokens = await jwtService.rotateRefreshToken(
    token,
    user,
    deviceInfo,
    req.ip,
  );

  // Set new refresh token cookie
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, "Token refreshed successfully.", {
    accessToken: tokens.accessToken,
    accessTokenExpiresIn: tokens.accessTokenExpiresIn,
  });
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    await jwtService.revokeToken(token, "logout");
  }

  res.clearCookie("refreshToken");

  await AuditLog.logFromRequest(req, "user_logged_out", {
    resourceType: "User",
    resourceId: req.user?._id,
  });

  return sendSuccess(res, "Logged out successfully.");
});

// ── LOGOUT ALL DEVICES ────────────────────────────────────────────────────────
const logoutAll = asyncHandler(async (req, res) => {
  await jwtService.revokeAllUserTokens(req.user._id, "logout");
  res.clearCookie("refreshToken");
  return sendSuccess(res, "Logged out from all devices successfully.");
});

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return sendSuccess(
      res,
      "If an account exists with this email, you will receive a password reset code shortly.",
    );
  }

  await otpService.sendOTP({
    userId: user._id,
    purpose: "password_reset",
    email: user.email,
    firstName: user.firstName,
    deliveryMethod: "email",
    expiryMinutes: 60,
  });

  await AuditLog.logFromRequest(req, "password_reset_requested", {
    resourceType: "User",
    resourceId: user._id,
  });

  return sendSuccess(
    res,
    "If an account exists with this email, you will receive a password reset code shortly.",
  );
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { email, otp, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(
      res,
      "Invalid request. Please request a new password reset.",
      400,
    );
  }

  const result = await otpService.verifyOTP(user._id, "password_reset", otp);
  if (!result.success) {
    return sendError(res, result.error, 400);
  }

  // Update password
  user.password = password;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all existing tokens
  await jwtService.revokeAllUserTokens(user._id, "password_change");

  await emailService.sendEmail({
    to: user.email,
    subject: "Your NestFind password has been changed",
    html: `<p>Hello ${user.firstName},</p><p>Your password was successfully changed. If you did not make this change, please contact us immediately at support@nestfind.et</p>`,
  });

  await AuditLog.logFromRequest(req, "password_reset_completed", {
    resourceType: "User",
    resourceId: user._id,
  });

  return sendSuccess(
    res,
    "Password reset successfully. Please login with your new password.",
  );
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    return sendError(res, "Current password is incorrect.", 400);
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all other tokens (keep current session)
  const currentToken = req.cookies?.refreshToken;
  await jwtService.revokeAllUserTokens(user._id, "password_change");

  await AuditLog.logFromRequest(req, "password_reset_completed", {
    resourceType: "User",
    resourceId: user._id,
    description: "Password changed by user",
  });

  return sendSuccess(
    res,
    "Password changed successfully. Please login again with your new password.",
  );
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -passwordResetToken -emailVerificationToken -failedLoginAttempts -lockUntil",
  );

  if (!user) {
    return sendError(res, "User not found.", 404);
  }

  return sendSuccess(res, "User profile retrieved successfully.", { user });
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "bio",
    "dateOfBirth",
    "gender",
    "occupation",
    "address",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true },
  ).select("-password -passwordResetToken -emailVerificationToken");

  return sendSuccess(res, "Profile updated successfully.", { user });
});

// ── UPLOAD AVATAR ─────────────────────────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Please upload an image file.", 400);
  }

  // Delete old avatar if exists
  const currentUser = await User.findById(req.user._id);
  if (currentUser.avatar?.public_id) {
    await cloudinaryService.deleteImage(currentUser.avatar.public_id);
  }

  // Upload new avatar
  const result = await cloudinaryService.uploadAvatar(
    req.file.buffer,
    req.user._id.toString(),
  );

  if (!result.success) {
    return sendError(res, "Failed to upload avatar. Please try again.", 500);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: {
        public_id: result.public_id,
        url: result.secureUrl,
      },
    },
    { new: true },
  ).select("-password");

  return sendSuccess(res, "Avatar uploaded successfully.", {
    avatar: { url: result.secureUrl, public_id: result.public_id },
    user,
  });
});

// ── SEND OTP ──────────────────────────────────────────────────────────────────
const sendOTP = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { purpose } = req.body;
  const user = req.user;

  const result = await otpService.sendOTP({
    userId: user._id,
    purpose,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    deliveryMethod: "email",
  });

  if (!result.success) {
    return sendError(res, result.error, 400, {
      waitSeconds: result.waitSeconds,
    });
  }

  return sendSuccess(res, result.message, {
    expiresInMinutes: result.expiresInMinutes,
  });
});

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { otp, purpose } = req.body;
  const result = await otpService.verifyOTP(req.user._id, purpose, otp);

  if (!result.success) {
    return sendError(res, result.error, 400, {
      remainingAttempts: result.remainingAttempts,
    });
  }

  // Handle post-verification actions
  if (purpose === "phone_verification") {
    await User.findByIdAndUpdate(req.user._id, { isPhoneVerified: true });
  }

  return sendSuccess(res, "Verification successful.");
});

// ── UPDATE NOTIFICATION PREFERENCES ──────────────────────────────────────────
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const allowedPrefs = [
    "emailNotifications",
    "smsNotifications",
    "pushNotifications",
    "paymentReminders",
    "bookingUpdates",
    "maintenanceUpdates",
    "newMessages",
    "marketingEmails",
    "aiRecommendationEmails",
  ];

  const updates = {};
  allowedPrefs.forEach((pref) => {
    if (req.body[pref] !== undefined) {
      updates[`notificationPreferences.${pref}`] = req.body[pref];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true },
  ).select("notificationPreferences");

  return sendSuccess(res, "Notification preferences updated.", {
    notificationPreferences: user.notificationPreferences,
  });
});

// ── UPDATE AI PREFERENCES ─────────────────────────────────────────────────────
const updateAIPreferences = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const allowedPrefs = [
    "voiceLanguage",
    "voiceSpeed",
    "voiceEnabled",
    "preferredCities",
    "preferredSubCities",
    "preferredPropertyTypes",
    "preferredAmenities",
    "budgetMin",
    "budgetMax",
    "preferredBedrooms",
    "aiChatEnabled",
    "aiRecommendationsEnabled",
    "naturalLanguageSearchEnabled",
  ];

  const updates = {};
  allowedPrefs.forEach((pref) => {
    if (req.body[pref] !== undefined) {
      updates[`aiPreferences.${pref}`] = req.body[pref];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true },
  ).select("aiPreferences");

  return sendSuccess(res, "AI preferences updated.", {
    aiPreferences: user.aiPreferences,
  });
});

// ── SUBMIT KYC ────────────────────────────────────────────────────────────────
const submitKYC = asyncHandler(async (req, res) => {
  const { personalInfo, primaryDocumentType } = req.body;

  if (!personalInfo || !primaryDocumentType) {
    return sendError(
      res,
      "Personal information and document type are required.",
      400,
    );
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return sendError(res, "Please upload at least one identity document.", 400);
  }

  // Check for existing KYC
  let kyc = await KYCVerification.findOne({ user: req.user._id });

  if (kyc && kyc.status === "approved") {
    return sendError(res, "Your identity is already verified.", 400);
  }

  // Upload documents to Cloudinary
  const documents = {};
  const fileFields = [
    "nationalId",
    "selfie",
    "proofOfAddress",
    "proofOfOwnership",
  ];

  for (const field of fileFields) {
    if (req.files[field] && req.files[field][0]) {
      const uploadResult = await cloudinaryService.uploadKYCDocument(
        req.files[field][0].buffer,
        req.user._id.toString(),
        field,
      );
      if (uploadResult.success) {
        documents[field] = {
          public_id: uploadResult.public_id,
          url: uploadResult.secureUrl,
        };
      }
    }
  }

  const kycData = {
    user: req.user._id,
    personalInfo,
    primaryDocumentType,
    documents,
    consentGiven: true,
    consentGivenAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  };

  if (kyc) {
    Object.assign(kyc, kycData);
  } else {
    kyc = new KYCVerification(kycData);
  }

  await kyc.submit(req.ip, req.get("User-Agent"));

  await User.findByIdAndUpdate(req.user._id, {
    kycStatus: "pending",
    kycSubmittedAt: new Date(),
  });

  await notificationService.sendNotification({
    recipientId: req.user._id,
    type: "kyc_submitted",
    data: {},
    channels: { inApp: true },
  });

  await AuditLog.logFromRequest(req, "user_kyc_submitted", {
    resourceType: "User",
    resourceId: req.user._id,
  });

  return sendSuccess(
    res,
    "KYC documents submitted successfully. Our team will review within 24-48 hours.",
    {
      kycId: kyc._id,
      status: kyc.status,
    },
    201,
  );
});

// ── GET KYC STATUS ────────────────────────────────────────────────────────────
const getKYCStatus = asyncHandler(async (req, res) => {
  const kyc = await KYCVerification.getUserKYC(req.user._id);

  return sendSuccess(res, "KYC status retrieved.", {
    kyc: kyc
      ? {
          id: kyc._id,
          status: kyc.status,
          submittedAt: kyc.submittedAt,
          reviewedAt: kyc.reviewedAt,
          approvedAt: kyc.approvedAt,
          rejectionReasons: kyc.rejectionReasons,
          reviewNotes: kyc.reviewNotes,
        }
      : null,
    isKYCVerified: req.user.isKYCVerified,
    kycStatus: req.user.kycStatus,
  });
});

// ── GET ACTIVE SESSIONS ───────────────────────────────────────────────────────
const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await jwtService.getActiveSessions(req.user._id);
  return sendSuccess(res, "Active sessions retrieved.", { sessions });
});

// ── DELETE ACCOUNT ────────────────────────────────────────────────────────────
const deleteAccount = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return sendError(
      res,
      "Verification code is required to delete your account.",
      400,
    );
  }

  const result = await otpService.verifyOTP(
    req.user._id,
    "account_deletion",
    otp,
  );
  if (!result.success) {
    return sendError(res, result.error, 400);
  }

  await User.softDelete(req.user._id);
  await jwtService.revokeAllUserTokens(req.user._id, "account_suspended");
  res.clearCookie("refreshToken");

  await AuditLog.logFromRequest(req, "user_deleted", {
    resourceType: "User",
    resourceId: req.user._id,
    description: "Account deleted by user",
  });

  return sendSuccess(
    res,
    "Your account has been deleted. We are sorry to see you go.",
  );
});

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  uploadAvatar,
  sendOTP,
  verifyOTP,
  updateNotificationPreferences,
  updateAIPreferences,
  submitKYC,
  getKYCStatus,
  getActiveSessions,
  deleteAccount,
};
