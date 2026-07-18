// nestfind/nestfind/server/src/controllers/contractController.js

const { validationResult } = require("express-validator");
const Contract = require("../models/Contract");
const Rental = require("../models/Rental");
const Property = require("../models/Property");
const AuditLog = require("../models/AuditLog");
const notificationService = require("../services/notificationService");
const leaseAiService = require("../services/ai/leaseAiService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── CREATE CONTRACT (LANDLORD) ────────────────────────────────────────────────
const createContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { tenantId, propertyId, terms, contractBody, rentalId, bookingId } =
    req.body;
  const landlordId = req.user._id;

  const property = await Property.findOne({
    _id: propertyId,
    landlord: landlordId,
  });
  if (!property) return sendError(res, "Property not found.", 404);

  const contract = await Contract.create({
    tenant: tenantId,
    landlord: landlordId,
    property: propertyId,
    rental: rentalId || null,
    booking: bookingId || null,
    terms,
    contractBody,
    status: "pending_landlord_signature",
  });

  await contract.populate([
    { path: "tenant", select: "firstName lastName email" },
    { path: "property", select: "title location" },
  ]);

  await notificationService.sendNotification({
    recipientId: tenantId,
    senderId: landlordId,
    type: "contract_created",
    data: { propertyTitle: property.title },
    channels: { inApp: true },
    resourceType: "Contract",
    resourceId: contract._id,
  });

  await AuditLog.logFromRequest(req, "contract_created", {
    resourceType: "Contract",
    resourceId: contract._id,
  });

  return sendSuccess(res, "Contract created successfully.", { contract }, 201);
});

// ── GET TENANT CONTRACTS ──────────────────────────────────────────────────────
const getTenantContracts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const contracts = await Contract.getTenantContracts(req.user._id);
  return sendSuccess(res, "Contracts retrieved.", { contracts });
});

// ── GET LANDLORD CONTRACTS ────────────────────────────────────────────────────
const getLandlordContracts = asyncHandler(async (req, res) => {
  const contracts = await Contract.getLandlordContracts(req.user._id);
  return sendSuccess(res, "Contracts retrieved.", { contracts });
});

// ── GET SINGLE CONTRACT ───────────────────────────────────────────────────────
const getContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const contract = await Contract.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
  })
    .populate("tenant", "firstName lastName avatar email phone")
    .populate("landlord", "firstName lastName avatar email phone")
    .populate("property", "title location coverImage pricing")
    .populate("rental");

  if (!contract) return sendError(res, "Contract not found.", 404);

  return sendSuccess(res, "Contract retrieved.", { contract });
});

// ── SIGN AS LANDLORD ──────────────────────────────────────────────────────────
const signAsLandlord = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { signatureData } = req.body;

  const contract = await Contract.findOne({
    _id: id,
    landlord: req.user._id,
    "landlordSignature.isSigned": false,
  })
    .populate("tenant", "firstName lastName email")
    .populate("property", "title");

  if (!contract)
    return sendError(res, "Contract not found or already signed.", 404);

  await contract.signAsLandlord(signatureData, req.ip, req.get("User-Agent"));

  await notificationService.sendNotification({
    recipientId: contract.tenant._id,
    senderId: req.user._id,
    type: "contract_pending_signature",
    data: { propertyTitle: contract.property.title },
    channels: { inApp: true },
    resourceType: "Contract",
    resourceId: id,
  });

  await AuditLog.logFromRequest(req, "contract_signed_landlord", {
    resourceType: "Contract",
    resourceId: id,
  });

  return sendSuccess(
    res,
    "Contract signed successfully. Waiting for tenant signature.",
    { contract },
  );
});

// ── SIGN AS TENANT ────────────────────────────────────────────────────────────
const signAsTenant = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { id } = req.params;
  const { signatureData } = req.body;

  const contract = await Contract.findOne({
    _id: id,
    tenant: req.user._id,
    "tenantSignature.isSigned": false,
    status: "pending_tenant_signature",
  })
    .populate("landlord", "firstName lastName email")
    .populate("property", "title");

  if (!contract)
    return sendError(res, "Contract not found or already signed.", 404);

  await contract.signAsTenant(signatureData, req.ip, req.get("User-Agent"));

  // Mark as viewed by tenant
  await Contract.findByIdAndUpdate(id, { viewedByTenantAt: new Date() });

  // Notify landlord
  await notificationService.sendNotification({
    recipientId: contract.landlord._id,
    senderId: req.user._id,
    type: "contract_signed",
    data: {
      signerName: `${req.user.firstName} ${req.user.lastName}`,
      propertyTitle: contract.property.title,
    },
    channels: { inApp: true },
    resourceType: "Contract",
    resourceId: id,
  });

  // If both signed, notify activation
  if (contract.isBothSigned) {
    await notificationService.sendNotification({
      recipientId: contract.tenant._id,
      type: "contract_activated",
      data: {
        propertyTitle: contract.property.title,
        startDate: new Date(contract.terms.startDate).toLocaleDateString(
          "en-ET",
        ),
      },
      channels: { inApp: true },
      resourceType: "Contract",
      resourceId: id,
    });
  }

  await AuditLog.logFromRequest(req, "contract_signed_tenant", {
    resourceType: "Contract",
    resourceId: id,
  });

  return sendSuccess(res, "Contract signed successfully.", { contract });
});

// ── EXPLAIN CONTRACT WITH AI ──────────────────────────────────────────────────
const explainContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { language = "en" } = req.query;
  const userId = req.user._id;

  const result = await leaseAiService.explainContract(id, userId, language);

  if (!result.success) {
    return sendError(res, result.error || "Failed to explain contract.", 400);
  }

  return sendSuccess(res, "Contract explanation generated.", result);
});

// ── ANALYZE CONTRACT CLAUSE ───────────────────────────────────────────────────
const analyzeClause = asyncHandler(async (req, res) => {
  const { clauseText } = req.body;

  if (!clauseText) return sendError(res, "Clause text is required.", 400);

  const result = await leaseAiService.analyzeClause(clauseText, req.user._id);

  if (!result.success) {
    return sendError(res, result.error, 400);
  }

  return sendSuccess(res, "Clause analyzed successfully.", result);
});

// ── TERMINATE CONTRACT ────────────────────────────────────────────────────────
const terminateContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const contract = await Contract.findOne({
    _id: id,
    $or: [{ tenant: userId }, { landlord: userId }],
    status: "active",
  });

  if (!contract) return sendError(res, "Active contract not found.", 404);

  await contract.terminate(reason, userId);

  await AuditLog.logFromRequest(req, "contract_terminated", {
    resourceType: "Contract",
    resourceId: id,
  });

  return sendSuccess(res, "Contract terminated successfully.");
});

// ── VERIFY CONTRACT ───────────────────────────────────────────────────────────
const verifyContract = asyncHandler(async (req, res) => {
  const { contractNumber, verificationHash } = req.body;

  if (!contractNumber || !verificationHash) {
    return sendError(
      res,
      "Contract number and verification hash are required.",
      400,
    );
  }

  const isValid = await Contract.verifyContract(
    contractNumber,
    verificationHash,
  );

  return sendSuccess(
    res,
    isValid ? "Contract is authentic." : "Contract could not be verified.",
    {
      isValid,
      contractNumber,
    },
  );
});

// ── GET CONTRACTS EXPIRING SOON ───────────────────────────────────────────────
const getContractsExpiringSoon = asyncHandler(async (req, res) => {
  const { days = 60 } = req.query;
  const userId = req.user._id;
  const role = req.user.role;

  let contracts;
  if (role === "tenant") {
    contracts = await Contract.find({
      tenant: userId,
      status: "active",
      "terms.endDate": {
        $lte: new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000),
        $gte: new Date(),
      },
    }).populate("property", "title location");
  } else {
    contracts = await Contract.getLandlordContracts(userId);
    contracts = contracts.filter((c) => c.isExpiringSoon);
  }

  return sendSuccess(res, "Expiring contracts retrieved.", { contracts });
});

module.exports = {
  createContract,
  getTenantContracts,
  getLandlordContracts,
  getContract,
  signAsLandlord,
  signAsTenant,
  explainContract,
  analyzeClause,
  terminateContract,
  verifyContract,
  getContractsExpiringSoon,
};
