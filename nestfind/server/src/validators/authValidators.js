// nestfind/nestfind/server/src/validators/authValidators.js

const { body, param, query } = require("express-validator");

// ── REGISTER VALIDATOR ────────────────────────────────────────────────────────
const validateRegister = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, hyphens and apostrophes",
    ),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens and apostrophes",
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email address is too long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage("Password must contain at least one special character"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("role")
    .optional()
    .isIn(["tenant", "landlord"])
    .withMessage("Role must be either tenant or landlord"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(\+251|0)[79]\d{8}$/)
    .withMessage(
      "Please provide a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)",
    ),

  body("referralCode")
    .optional()
    .trim()
    .isLength({ min: 8, max: 12 })
    .withMessage("Invalid referral code"),
];

// ── LOGIN VALIDATOR ───────────────────────────────────────────────────────────
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  body("rememberMe")
    .optional()
    .isBoolean()
    .withMessage("rememberMe must be a boolean"),
];

// ── OTP VALIDATOR ─────────────────────────────────────────────────────────────
const validateOTP = [
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .isNumeric()
    .withMessage("Verification code must contain only numbers"),

  body("purpose")
    .notEmpty()
    .withMessage("OTP purpose is required")
    .isIn([
      "email_verification",
      "phone_verification",
      "password_reset",
      "login_2fa",
      "account_deletion",
      "payment_confirmation",
      "kyc_verification",
    ])
    .withMessage("Invalid OTP purpose"),
];

// ── FORGOT PASSWORD VALIDATOR ─────────────────────────────────────────────────
const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

// ── RESET PASSWORD VALIDATOR ──────────────────────────────────────────────────
const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid reset token"),

  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage("Password must contain at least one special character"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// ── CHANGE PASSWORD VALIDATOR ─────────────────────────────────────────────────
const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage("Password must contain at least one special character")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// ── UPDATE PROFILE VALIDATOR ──────────────────────────────────────────────────
const validateUpdateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("First name contains invalid characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Last name contains invalid characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(\+251|0)[79]\d{8}$/)
    .withMessage("Please provide a valid Ethiopian phone number"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      const dob = new Date(value);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      if (dob > minAge) {
        throw new Error("You must be at least 18 years old");
      }
      return true;
    }),

  body("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer_not_to_say"])
    .withMessage("Invalid gender value"),

  body("occupation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Occupation cannot exceed 100 characters"),

  body("address.street").optional().trim().isLength({ max: 200 }),
  body("address.subCity").optional().trim().isLength({ max: 100 }),
  body("address.city").optional().trim().isLength({ max: 100 }),
  body("address.region").optional().trim().isLength({ max: 100 }),
];

// ── RESEND OTP VALIDATOR ──────────────────────────────────────────────────────
const validateResendOTP = [
  body("purpose")
    .notEmpty()
    .withMessage("Purpose is required")
    .isIn([
      "email_verification",
      "phone_verification",
      "password_reset",
      "login_2fa",
    ])
    .withMessage("Invalid OTP purpose"),
];

// ── REFRESH TOKEN VALIDATOR ───────────────────────────────────────────────────
const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// ── UPDATE NOTIFICATION PREFERENCES ──────────────────────────────────────────
const validateNotificationPreferences = [
  body("emailNotifications").optional().isBoolean(),
  body("smsNotifications").optional().isBoolean(),
  body("pushNotifications").optional().isBoolean(),
  body("paymentReminders").optional().isBoolean(),
  body("bookingUpdates").optional().isBoolean(),
  body("maintenanceUpdates").optional().isBoolean(),
  body("newMessages").optional().isBoolean(),
  body("marketingEmails").optional().isBoolean(),
  body("aiRecommendationEmails").optional().isBoolean(),
];

// ── UPDATE AI PREFERENCES ─────────────────────────────────────────────────────
const validateAIPreferences = [
  body("voiceLanguage")
    .optional()
    .isIn(["en-US", "en-ET", "am-ET"])
    .withMessage("Invalid voice language"),

  body("voiceSpeed")
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage("Voice speed must be between 0.5 and 2.0"),

  body("voiceEnabled").optional().isBoolean(),
  body("aiChatEnabled").optional().isBoolean(),
  body("aiRecommendationsEnabled").optional().isBoolean(),
  body("naturalLanguageSearchEnabled").optional().isBoolean(),

  body("budgetMin")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum budget must be a positive number"),

  body("budgetMax")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum budget must be a positive number")
    .custom((value, { req }) => {
      if (req.body.budgetMin && value < req.body.budgetMin) {
        throw new Error("Maximum budget must be greater than minimum budget");
      }
      return true;
    }),

  body("preferredBedrooms")
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage("Preferred bedrooms must be between 0 and 20"),

  body("preferredCities")
    .optional()
    .isArray()
    .withMessage("Preferred cities must be an array"),

  body("preferredSubCities")
    .optional()
    .isArray()
    .withMessage("Preferred sub-cities must be an array"),

  body("preferredPropertyTypes")
    .optional()
    .isArray()
    .withMessage("Preferred property types must be an array"),

  body("preferredAmenities")
    .optional()
    .isArray()
    .withMessage("Preferred amenities must be an array"),
];

module.exports = {
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
};
