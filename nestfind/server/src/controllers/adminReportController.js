// nestfind/nestfind/server/src/controllers/adminReportController.js

const { validationResult } = require("express-validator");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET ALL REPORTS ───────────────────────────────────────────────────────────
const getReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    reportType,
    priority,
    resourceType,
  } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (status) query.status = status;
  if (reportType) query.reportType = reportType;
  if (priority) query.priority = priority;
  if (resourceType) query.resourceType = resourceType;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate("reportedBy", "firstName lastName email avatar")
      .populate("assignedTo", "firstName lastName")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Report.countDocuments(query),
  ]);

  return sendPaginated(res, "Reports retrieved.", reports, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET SINGLE REPORT ─────────────────────────────────────────────────────────
const getReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await Report.findById(id)
    .populate("reportedBy", "firstName lastName email phone avatar")
    .populate("assignedTo", "firstName lastName")
    .populate("resolution.resolvedBy", "firstName lastName");

  if (!report) return sendError(res, "Report not found.", 404);

  return sendSuccess(res, "Report retrieved.", { report });
});

// ── PROCESS REPORT ────────────────────────────────────────────────────────────
const processReport = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { action, resolutionAction, notes } = req.body;

  const report = await Report.findById(id);
  if (!report) return sendError(res, "Report not found.", 404);

  switch (action) {
    case "assign":
      await report.assign(req.user._id);
      break;
    case "resolve":
      await report.resolve(
        resolutionAction || "no_action",
        notes,
        req.user._id,
      );
      break;
    case "dismiss":
      await report.dismiss(notes, req.user._id);
      break;
    case "escalate":
      await report.escalate(notes, req.user._id);
      break;
    default:
      return sendError(res, "Invalid action.", 400);
  }

  await AuditLog.logFromRequest(req, "report_resolved", {
    resourceType: "Report",
    resourceId: id,
    description: `Report ${action}: ${notes || "No notes"}`,
  });

  return sendSuccess(res, `Report ${action}d successfully.`, { report });
});

// ── GET REPORT STATS ──────────────────────────────────────────────────────────
const getReportStats = asyncHandler(async (req, res) => {
  const stats = await Report.getPlatformStats();
  return sendSuccess(res, "Report statistics retrieved.", { stats });
});

// ── GET PENDING REPORTS ───────────────────────────────────────────────────────
const getPendingReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const reports = await Report.getPendingReports(Number(page), Number(limit));
  const total = await Report.countDocuments({
    status: { $in: ["pending", "under_review"] },
  });

  return sendPaginated(res, "Pending reports retrieved.", reports, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

module.exports = {
  getReports,
  getReport,
  processReport,
  getReportStats,
  getPendingReports,
};
