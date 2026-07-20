// nestfind/nestfind/server/src/controllers/adminUserController.js

const { validationResult } = require("express-validator");
const User = require("../models/User");
const KYCVerification = require("../models/KYCVerification");
const AuditLog = require("../models/AuditLog");
const jwtService = require("../services/jwtService");
const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");
const searchService = require("../services/searchService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET ALL USERS ─────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, kycStatus, search } = req.query;

  const result = await searchService.searchUsers(
    { role, status, kycStatus, search },
    { page: Number(page), limit: Number(limit) },
  );

  if (!result.success) return sendError(res, "Failed to retrieve users.", 500);

  return sendPaginated(res, "Users retrieved.", result.users, {
    total: result.total,
    page: Number(page),
    limit: Number(limit),
    totalPages: result.totalPages,
  });
});

// ── GET SINGLE USER ───────────────────────────────────────────────────────────
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select("-password -passwordResetToken -emailVerificationToken")
    .setOptions({ includeDeleted: true });

  if (!user) return sendError(res, "User not found.", 404);

  const kyc = await KYCVerification.getUserKYC(id);

  return sendSuccess(res, "User retrieved.", { user, kyc });
});

// ── UPDATE USER STATUS ────────────────────────────────────────────────────────
const updateUserStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { status, reason } = req.body;

  if (id === req.user._id.toString()) {
    return sendError(res, "You cannot change your own account status.", 400);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  ).select("-password");

  if (!user) return sendError(res, "User not found.", 404);

  // Revoke all tokens if suspending
  if (status === "suspended" || status === "deactivated") {
    await jwtService.revokeAllUserTokens(id, "account_suspended");
  }

  // Send notification to user
  await notificationService.sendNotification({
    recipientId: id,
    type: status === "active" ? "account_reactivated" : "account_suspended",
    data: { reason: reason || "" },
    channels: { inApp: true, email: true, email: user.email },
  });

  await AuditLog.logFromRequest(
    req,
    status === "suspended" ? "user_suspended" : "user_reactivated",
    {
      resourceType: "User",
      resourceId: id,
      description: `User ${status} by admin. Reason: ${reason || "Not provided"}`,
    },
  );

  return sendSuccess(res, `User ${status} successfully.`, { user });
});

// ── UPDATE USER ROLE ──────────────────────────────────────────────────────────
const updateUserRole = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { role } = req.body;

  if (id === req.user._id.toString()) {
    return sendError(res, "You cannot change your own role.", 400);
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select(
    "-password",
  );

  if (!user) return sendError(res, "User not found.", 404);

  // Revoke tokens so user gets new token with updated role
  await jwtService.revokeAllUserTokens(id, "role_change");

  await AuditLog.logFromRequest(req, "user_role_changed", {
    resourceType: "User",
    resourceId: id,
    description: `User role changed to ${role}`,
  });

  return sendSuccess(res, `User role updated to ${role}.`, { user });
});

// ── DELETE USER ───────────────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    return sendError(res, "You cannot delete your own account.", 400);
  }

  const user = await User.findById(id);
  if (!user) return sendError(res, "User not found.", 404);

  await User.softDelete(id);
  await jwtService.revokeAllUserTokens(id, "account_suspended");

  await AuditLog.logFromRequest(req, "user_deleted", {
    resourceType: "User",
    resourceId: id,
    description: `User deleted by admin: ${user.email}`,
  });

  return sendSuccess(res, "User deleted successfully.");
});

// ── GET KYC SUBMISSIONS ───────────────────────────────────────────────────────
const getKYCSubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const submissions = await KYCVerification.getPendingReviews(
    Number(page),
    Number(limit),
  );
  const total = await KYCVerification.countDocuments({
    status: { $in: ["submitted", "under_review"] },
  });

  return sendPaginated(res, "KYC submissions retrieved.", submissions, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET KYC SUBMISSION DETAIL ─────────────────────────────────────────────────
const getKYCSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kyc = await KYCVerification.findById(id)
    .populate("user", "firstName lastName email phone role createdAt")
    .populate("reviewedBy", "firstName lastName")
    .populate("approvedBy", "firstName lastName");

  if (!kyc) return sendError(res, "KYC submission not found.", 404);

  return sendSuccess(res, "KYC submission retrieved.", { kyc });
});

// ── PROCESS KYC DECISION ──────────────────────────────────────────────────────
const processKYCDecision = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { action, notes, reasons } = req.body;

  const kyc = await KYCVerification.findById(id).populate(
    "user",
    "firstName lastName email",
  );

  if (!kyc) return sendError(res, "KYC submission not found.", 404);

  if (action === "approve") {
    await kyc.approve(req.user._id, notes);
    await emailService.sendKYCStatusEmail(
      kyc.user.email,
      kyc.user.firstName,
      "approved",
    );
    await notificationService.sendNotification({
      recipientId: kyc.user._id,
      type: "kyc_approved",
      data: {},
      channels: { inApp: true },
    });
  } else if (action === "reject") {
    await kyc.reject(req.user._id, reasons || [], notes);
    await emailService.sendKYCStatusEmail(
      kyc.user.email,
      kyc.user.firstName,
      "rejected",
      reasons?.map((r) => r.reason).join(", "),
    );
    await notificationService.sendNotification({
      recipientId: kyc.user._id,
      type: "kyc_rejected",
      data: { reason: reasons?.map((r) => r.reason).join(", ") },
      channels: { inApp: true },
    });
  } else if (action === "request_resubmission") {
    await kyc.requestResubmission(req.user._id, reasons || [], notes);
    await emailService.sendKYCStatusEmail(
      kyc.user.email,
      kyc.user.firstName,
      "resubmission_required",
      notes,
    );
  } else {
    return sendError(res, "Invalid KYC action.", 400);
  }

  await AuditLog.logFromRequest(
    req,
    `user_kyc_${action === "approve" ? "approved" : "rejected"}`,
    {
      resourceType: "User",
      resourceId: kyc.user._id,
      description: `KYC ${action} for user ${kyc.user.email}`,
    },
  );

  return sendSuccess(res, `KYC ${action} processed successfully.`, { kyc });
});

// ── GET USER STATS ────────────────────────────────────────────────────────────
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.getPlatformStats();
  const kycStats = await KYCVerification.getPlatformStats();

  return sendSuccess(res, "User statistics retrieved.", {
    users: stats,
    kyc: kycStats,
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getKYCSubmissions,
  getKYCSubmission,
  processKYCDecision,
  getUserStats,
};
