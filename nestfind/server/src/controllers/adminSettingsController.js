// nestfind/nestfind/server/src/controllers/adminSettingsController.js

const { validationResult } = require("express-validator");
const SystemSettings = require("../models/SystemSettings");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");

// ── GET SYSTEM SETTINGS ───────────────────────────────────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  return sendSuccess(res, "System settings retrieved.", { settings });
});

// ── UPDATE SETTINGS SECTION ───────────────────────────────────────────────────
const updateSettings = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { section, data } = req.body;

  const settings = await SystemSettings.updateSection(
    section,
    data,
    req.user._id,
  );

  await AuditLog.logFromRequest(req, "admin_settings_updated", {
    description: `Settings updated: section=${section}`,
    changes: { after: data },
  });

  return sendSuccess(res, "Settings updated successfully.", { settings });
});

// ── CHECK FEATURE FLAG ────────────────────────────────────────────────────────
const checkFeature = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const isEnabled = await SystemSettings.isFeatureEnabled(feature);
  return sendSuccess(res, "Feature status retrieved.", { feature, isEnabled });
});

// ── CHECK AI FEATURE ──────────────────────────────────────────────────────────
const checkAIFeature = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const isEnabled = await SystemSettings.isAIFeatureEnabled(feature);
  return sendSuccess(res, "AI feature status retrieved.", {
    feature,
    isEnabled,
  });
});

// ── GET MAINTENANCE STATUS ────────────────────────────────────────────────────
const getMaintenanceStatus = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  return sendSuccess(res, "Maintenance status retrieved.", {
    maintenance: settings.maintenance,
  });
});

// ── TOGGLE AI FEATURE ─────────────────────────────────────────────────────────
const toggleAIFeature = asyncHandler(async (req, res) => {
  const { featureName } = req.params;
  const { enabled } = req.body;

  if (enabled === undefined)
    return sendError(res, "enabled field is required.", 400);

  const settings = await SystemSettings.updateSection(
    "ai",
    { [`features.${featureName}`]: enabled },
    req.user._id,
  );

  await AuditLog.logFromRequest(req, "admin_settings_updated", {
    description: `AI feature ${featureName} ${enabled ? "enabled" : "disabled"}`,
  });

  return sendSuccess(
    res,
    `AI feature ${featureName} ${enabled ? "enabled" : "disabled"}.`,
    {
      feature: featureName,
      enabled,
    },
  );
});

// ── RESET SETTINGS TO DEFAULT ─────────────────────────────────────────────────
const resetToDefaults = asyncHandler(async (req, res) => {
  const { section } = req.body;

  if (!section) return sendError(res, "Section is required.", 400);

  const defaults = {
    ai: {
      aiEnabled: true,
      features: {
        chatAssistant: true,
        propertyRecommendations: true,
        smartSearch: true,
        rentPriceAdvisor: true,
        leaseExplainer: true,
        maintenanceDiagnosis: true,
        fraudDetection: true,
        propertyDescriptionGenerator: true,
        sentimentAnalysis: true,
        voiceInput: true,
        voiceOutput: true,
      },
      model: "claude-sonnet-4-6",
      maxTokensPerRequest: 2000,
    },
    payments: {
      platformCommissionRate: 0.05,
      minimumRentAmount: 1000,
      maximumRentAmount: 1000000,
      currency: "ETB",
      lateFeeEnabled: true,
      defaultLateFeeRate: 0.05,
      defaultGracePeriodDays: 5,
    },
  };

  if (!defaults[section]) {
    return sendError(
      res,
      `No default configuration found for section: ${section}`,
      400,
    );
  }

  const settings = await SystemSettings.updateSection(
    section,
    defaults[section],
    req.user._id,
  );

  await AuditLog.logFromRequest(req, "admin_settings_updated", {
    description: `Settings reset to defaults: section=${section}`,
  });

  return sendSuccess(res, `${section} settings reset to defaults.`, {
    settings,
  });
});

module.exports = {
  getSettings,
  updateSettings,
  checkFeature,
  checkAIFeature,
  getMaintenanceStatus,
  toggleAIFeature,
  resetToDefaults,
};
