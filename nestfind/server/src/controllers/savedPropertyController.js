// nestfind/nestfind/server/src/controllers/savedPropertyController.js

const { validationResult } = require("express-validator");
const SavedProperty = require("../models/SavedProperty");
const Property = require("../models/Property");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET SAVED PROPERTIES (TENANT) ─────────────────────────────────────────────
const getSavedProperties = asyncHandler(async (req, res) => {
  const { collection, page = 1, limit = 12 } = req.query;
  const tenantId = req.user._id;

  const result = await SavedProperty.getTenantSaved(
    tenantId,
    collection || null,
    Number(page),
    Number(limit),
  );

  const total = await SavedProperty.countTenantSaved(tenantId);

  return sendPaginated(res, "Saved properties retrieved.", result, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// ── SAVE / UNSAVE PROPERTY (TENANT) ──────────────────────────────────────────
const toggleSaveProperty = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { propertyId, collection, note, notifyOnPriceDrop } = req.body;
  const tenantId = req.user._id;

  const property = await Property.findById(propertyId);
  if (!property) return sendError(res, "Property not found.", 404);

  const result = await SavedProperty.toggleSave(
    tenantId,
    propertyId,
    property.pricing?.monthlyRent,
  );

  // Update property save stats
  await Property.findByIdAndUpdate(propertyId, {
    $inc: { "stats.totalSaves": result.saved ? 1 : -1 },
  });

  return sendSuccess(res, result.message, { saved: result.saved });
});

// ── UPDATE SAVED PROPERTY (TENANT) ────────────────────────────────────────────
const updateSavedProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note, collection, notifyOnPriceDrop, notifyOnAvailability } =
    req.body;
  const tenantId = req.user._id;

  const saved = await SavedProperty.findOne({
    _id: id,
    tenant: tenantId,
  });

  if (!saved) return sendError(res, "Saved property not found.", 404);

  if (note !== undefined) saved.note = note;
  if (collection !== undefined) saved.collection = collection;
  if (notifyOnPriceDrop !== undefined)
    saved.notifyOnPriceDrop = notifyOnPriceDrop;
  if (notifyOnAvailability !== undefined)
    saved.notifyOnAvailability = notifyOnAvailability;

  await saved.save();

  return sendSuccess(res, "Saved property updated.", { saved });
});

// ── REMOVE SAVED PROPERTY (TENANT) ────────────────────────────────────────────
const removeSavedProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user._id;

  const saved = await SavedProperty.findOneAndDelete({
    _id: id,
    tenant: tenantId,
  });

  if (!saved) return sendError(res, "Saved property not found.", 404);

  await Property.findByIdAndUpdate(saved.property, {
    $inc: { "stats.totalSaves": -1 },
  });

  return sendSuccess(res, "Property removed from saved list.");
});

// ── GET COLLECTIONS (TENANT) ──────────────────────────────────────────────────
const getCollections = asyncHandler(async (req, res) => {
  const tenantId = req.user._id;
  const collections = await SavedProperty.getTenantCollections(tenantId);
  return sendSuccess(res, "Collections retrieved.", { collections });
});

// ── CHECK IF SAVED (TENANT) ───────────────────────────────────────────────────
const checkIfSaved = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const tenantId = req.user._id;

  const isSaved = await SavedProperty.isSaved(tenantId, propertyId);
  return sendSuccess(res, "Saved status checked.", { isSaved, propertyId });
});

// ── GET PRICE DROP ALERTS (TENANT) ────────────────────────────────────────────
const getPriceDropAlerts = asyncHandler(async (req, res) => {
  const tenantId = req.user._id;
  const alerts = await SavedProperty.getPriceDropAlerts(tenantId);
  return sendSuccess(res, "Price drop alerts retrieved.", {
    alerts,
    count: alerts.length,
  });
});

module.exports = {
  getSavedProperties,
  toggleSaveProperty,
  updateSavedProperty,
  removeSavedProperty,
  getCollections,
  checkIfSaved,
  getPriceDropAlerts,
};
