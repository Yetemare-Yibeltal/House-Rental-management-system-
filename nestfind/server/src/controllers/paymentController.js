// nestfind/nestfind/server/src/controllers/paymentController.js

const { validationResult } = require("express-validator");
const Payment = require("../models/Payment");
const Rental = require("../models/Rental");
const Property = require("../models/Property");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");
const logger = require("../utils/logger");

// ── CREATE PAYMENT (TENANT) ───────────────────────────────────────────────────
const createPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    rentalId,
    paymentType,
    amount,
    paymentMethod,
    paymentPeriod,
    externalTransactionId,
    notes,
  } = req.body;

  const tenantId = req.user._id;

  // Verify rental belongs to tenant
  const rental = await Rental.findOne({
    _id: rentalId,
    tenant: tenantId,
    status: "active",
  })
    .populate("property", "title location")
    .populate("landlord", "firstName lastName email phone");

  if (!rental) {
    return sendError(res, "Active rental not found.", 404);
  }

  // Check if rent already paid for this period
  if (
    paymentType === "monthly_rent" &&
    paymentPeriod?.month &&
    paymentPeriod?.year
  ) {
    const alreadyPaid = await Payment.isRentPaidForPeriod(
      rentalId,
      paymentPeriod.month,
      paymentPeriod.year,
    );
    if (alreadyPaid) {
      return sendError(
        res,
        `Rent for ${paymentPeriod.month}/${paymentPeriod.year} has already been paid.`,
        409,
      );
    }
  }

  // Check if payment is late
  const isLate = rental.isPaymentOverdue();
  let daysLate = 0;
  if (isLate && rental.nextPaymentDue) {
    daysLate = Math.floor(
      (Date.now() - new Date(rental.nextPaymentDue).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  // Create payment
  const payment = await Payment.create({
    payer: tenantId,
    payee: rental.landlord._id,
    property: rental.property._id,
    rental: rentalId,
    paymentType,
    amount,
    paymentMethod,
    paymentPeriod: paymentPeriod || {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      periodLabel: new Date().toLocaleString("en-ET", {
        month: "long",
        year: "numeric",
      }),
    },
    dueDate: rental.nextPaymentDue,
    isLate,
    daysLate,
    notes,
    externalTransactionId,
    status: "completed", // In real system would be 'pending' until payment gateway confirms
    paidAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Update rental payment records
  if (paymentType === "monthly_rent") {
    await Rental.recordPayment(rentalId, amount);
  }

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: rental.landlord._id,
    senderId: tenantId,
    type: "payment_received",
    data: {
      amount,
      propertyTitle: rental.property.title,
    },
    channels: { inApp: true },
    resourceType: "Payment",
    resourceId: payment._id,
  });

  // Send receipt email to tenant
  await emailService.sendPaymentReceiptEmail(
    req.user.email,
    req.user.firstName,
    {
      receiptNumber: payment.receiptNumber,
      amount,
      paymentType: paymentType.replace(/_/g, " "),
      paymentMethod: paymentMethod.replace(/_/g, " "),
      propertyTitle: rental.property.title,
      periodLabel: payment.paymentPeriod?.periodLabel,
      transactionId: payment.transactionId,
    },
  );

  await AuditLog.logFromRequest(req, "payment_completed", {
    resourceType: "Payment",
    resourceId: payment._id,
    description: `Payment of ETB ${amount} for ${paymentType}`,
  });

  logger.info(
    `Payment completed: tenant=${tenantId}, amount=${amount}, type=${paymentType}`,
  );

  return sendSuccess(res, "Payment processed successfully.", { payment }, 201);
});

// ── GET TENANT PAYMENTS ───────────────────────────────────────────────────────
const getTenantPayments = asyncHandler(async (req, res) => {
  const { status, paymentType, page = 1, limit = 10 } = req.query;
  const tenantId = req.user._id;

  const filters = {};
  if (status) filters.status = status;
  if (paymentType) filters.paymentType = paymentType;

  const skip = (Number(page) - 1) * Number(limit);

  const query = { payer: tenantId, ...filters };

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("property", "title location coverImage")
      .populate("payee", "firstName lastName")
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

// ── GET LANDLORD PAYMENTS ─────────────────────────────────────────────────────
const getLandlordPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const landlordId = req.user._id;

  const query = { payee: landlordId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("payer", "firstName lastName avatar")
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

// ── GET SINGLE PAYMENT ────────────────────────────────────────────────────────
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findOne({
    _id: id,
    $or: [{ payer: userId }, { payee: userId }],
  })
    .populate("payer", "firstName lastName avatar email")
    .populate("payee", "firstName lastName avatar email")
    .populate("property", "title location")
    .populate("rental")
    .populate("contract");

  if (!payment) return sendError(res, "Payment not found.", 404);

  return sendSuccess(res, "Payment retrieved.", { payment });
});

// ── RAISE DISPUTE (TENANT) ────────────────────────────────────────────────────
const raiseDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) return sendError(res, "Dispute reason is required.", 400);

  const payment = await Payment.findOne({
    _id: id,
    payer: req.user._id,
    status: "completed",
  });

  if (!payment) return sendError(res, "Payment not found.", 404);

  if (payment.isDisputed)
    return sendError(res, "This payment already has an open dispute.", 409);

  await payment.raiseDispute(reason);

  await AuditLog.logFromRequest(req, "payment_disputed", {
    resourceType: "Payment",
    resourceId: id,
    description: `Payment dispute raised: ${reason}`,
  });

  return sendSuccess(
    res,
    "Dispute submitted. Our team will investigate within 48 hours.",
    {
      payment,
    },
  );
});

// ── GET PAYMENT RECEIPT ───────────────────────────────────────────────────────
const getPaymentReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findOne({
    _id: id,
    $or: [{ payer: userId }, { payee: userId }],
    status: "completed",
  })
    .populate("payer", "firstName lastName email")
    .populate("payee", "firstName lastName")
    .populate("property", "title location");

  if (!payment) return sendError(res, "Payment receipt not found.", 404);

  return sendSuccess(res, "Payment receipt retrieved.", { payment });
});

// ── GET MONTHLY SUMMARY (LANDLORD) ────────────────────────────────────────────
const getMonthlySummary = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const landlordId = req.user._id;

  const monthlyData = await Payment.aggregate([
    {
      $match: {
        payee: landlordId,
        status: "completed",
        "paymentPeriod.year": Number(year),
      },
    },
    {
      $group: {
        _id: "$paymentPeriod.month",
        totalAmount: { $sum: "$netAmount" },
        totalCommission: { $sum: "$platformCommission" },
        totalGross: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing months
  const summary = Array.from({ length: 12 }, (_, i) => {
    const found = monthlyData.find((d) => d._id === i + 1);
    return {
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleString("en-ET", {
        month: "long",
      }),
      totalAmount: found?.totalAmount || 0,
      totalCommission: found?.totalCommission || 0,
      totalGross: found?.totalGross || 0,
      count: found?.count || 0,
    };
  });

  const annualTotal = summary.reduce((sum, m) => sum + m.totalAmount, 0);

  return sendSuccess(res, "Monthly payment summary retrieved.", {
    summary,
    year: Number(year),
    annualTotal,
  });
});

// ── GET OVERDUE PAYMENTS (ADMIN/LANDLORD) ─────────────────────────────────────
const getOverduePayments = asyncHandler(async (req, res) => {
  const landlordId = req.user._id;

  const overdueRentals = await Rental.find({
    landlord: landlordId,
    status: "active",
  })
    .populate("tenant", "firstName lastName phone email")
    .populate("property", "title location");

  const overdue = overdueRentals.filter((r) => r.isPaymentOverdue());

  return sendSuccess(res, "Overdue payments retrieved.", {
    overdue,
    count: overdue.length,
  });
});

module.exports = {
  createPayment,
  getTenantPayments,
  getLandlordPayments,
  getPayment,
  raiseDispute,
  getPaymentReceipt,
  getMonthlySummary,
  getOverduePayments,
};
