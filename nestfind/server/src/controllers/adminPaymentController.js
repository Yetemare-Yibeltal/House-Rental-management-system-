// nestfind/nestfind/server/src/controllers/adminPaymentController.js

const { validationResult } = require("express-validator");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET ALL PAYMENTS (ADMIN) ──────────────────────────────────────────────────
const getPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentType,
    startDate,
    endDate,
  } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (status) query.status = status;
  if (paymentType) query.paymentType = paymentType;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("payer", "firstName lastName email")
      .populate("payee", "firstName lastName email")
      .populate("property", "title location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(query),
  ]);

  return sendPaginated(res, "Payments retrieved.", payments, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── GET PAYMENT DETAILS ───────────────────────────────────────────────────────
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("payer", "firstName lastName email phone")
    .populate("payee", "firstName lastName email phone")
    .populate("property", "title location pricing")
    .populate("rental")
    .populate("contract");

  if (!payment) return sendError(res, "Payment not found.", 404);

  return sendSuccess(res, "Payment retrieved.", { payment });
});

// ── PROCESS REFUND ────────────────────────────────────────────────────────────
const processRefund = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findById(id).populate(
    "payer",
    "firstName lastName email",
  );

  if (!payment) return sendError(res, "Payment not found.", 404);
  if (!["completed", "disputed"].includes(payment.status)) {
    return sendError(
      res,
      "Only completed or disputed payments can be refunded.",
      400,
    );
  }

  const refundAmount = amount || payment.amount;
  if (refundAmount > payment.amount) {
    return sendError(
      res,
      "Refund amount cannot exceed original payment amount.",
      400,
    );
  }

  await payment.processRefund(refundAmount, reason);

  await AuditLog.logFromRequest(req, "payment_refunded", {
    resourceType: "Payment",
    resourceId: id,
    description: `Payment refunded: ETB ${refundAmount}. Reason: ${reason}`,
  });

  return sendSuccess(
    res,
    `Refund of ETB ${refundAmount.toLocaleString()} processed.`,
    { payment },
  );
});

// ── RESOLVE DISPUTE ───────────────────────────────────────────────────────────
const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution, action } = req.body;

  if (!resolution)
    return sendError(res, "Resolution description is required.", 400);

  const payment = await Payment.findById(id);
  if (!payment) return sendError(res, "Payment not found.", 404);
  if (!payment.isDisputed)
    return sendError(res, "This payment has no open dispute.", 400);

  await payment.resolveDispute(resolution);

  await AuditLog.logFromRequest(req, "payment_disputed", {
    resourceType: "Payment",
    resourceId: id,
    description: `Dispute resolved: ${resolution}`,
  });

  return sendSuccess(res, "Dispute resolved successfully.", { payment });
});

// ── GET REVENUE STATS ─────────────────────────────────────────────────────────
const getRevenueStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, year = new Date().getFullYear() } = req.query;

  const [revenue, monthly, disputed, overdue] = await Promise.all([
    Payment.getPlatformRevenue(startDate, endDate),
    Payment.getMonthlyRevenue(Number(year)),
    Payment.countDocuments({ status: "disputed" }),
    Payment.getOverduePayments(),
  ]);

  return sendSuccess(res, "Revenue statistics retrieved.", {
    revenue,
    monthly,
    disputed,
    overdueCount: overdue.length,
    overdue: overdue.slice(0, 5),
  });
});

// ── GET DISPUTED PAYMENTS ─────────────────────────────────────────────────────
const getDisputedPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find({ status: "disputed" })
      .populate("payer", "firstName lastName email phone")
      .populate("payee", "firstName lastName email")
      .populate("property", "title")
      .sort({ disputeRaisedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments({ status: "disputed" }),
  ]);

  return sendPaginated(res, "Disputed payments retrieved.", payments, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

module.exports = {
  getPayments,
  getPayment,
  processRefund,
  resolveDispute,
  getRevenueStats,
  getDisputedPayments,
};
