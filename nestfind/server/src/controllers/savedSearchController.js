// nestfind/nestfind/server/src/controllers/savedSearchController.js

const { validationResult } = require("express-validator");
const SavedSearch = require("../models/SavedSearch");
const smartSearchService = require("../services/ai/smartSearchService");
const asyncHandler = require("../utils/asyncHandler");
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
} = require("../utils/apiResponse");

// ── GET SAVED SEARCHES (TENANT) ───────────────────────────────────────────────
const getSavedSearches = asyncHandler(async (req, res) => {
  const tenantId = req.user._id;
  const searches = await SavedSearch.getTenantSearches(tenantId);
  return sendSuccess(res, "Saved searches retrieved.", { searches });
});

// ── SAVE SEARCH (TENANT) ──────────────────────────────────────────────────────
const saveSearch = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const {
    name,
    filters,
    naturalLanguageQuery,
    alertEnabled = true,
    alertFrequency = "daily",
    alertChannels,
  } = req.body;

  const tenantId = req.user._id;

  // Count existing saved searches
  const count = await SavedSearch.countDocuments({ tenant: tenantId });
  if (count >= 10) {
    return sendError(
      res,
      "Maximum 10 saved searches allowed. Please delete an existing search first.",
      400,
    );
  }

  let aiData = {};
  if (naturalLanguageQuery) {
    const parsed =
      await smartSearchService.parseNaturalLanguageQuery(naturalLanguageQuery);
    aiData = {
      naturalLanguageQuery,
      isAISearch: true,
      aiInterpretation: parsed.interpretation,
      aiConfidenceScore: parsed.confidence,
      extractedEntities: parsed.extractedEntities,
      searchSummary: parsed.interpretation,
    };
  }

  const search = await SavedSearch.create({
    tenant: tenantId,
    name,
    filters: filters || {},
    ai: aiData,
    alertEnabled,
    alertFrequency,
    alertChannels: alertChannels || { email: true, inApp: true, sms: false },
    lastRunAt: new Date(),
  });

  return sendSuccess(res, "Search saved successfully.", { search }, 201);
});

// ── RUN SAVED SEARCH (TENANT) ─────────────────────────────────────────────────
const runSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 12 } = req.query;
  const tenantId = req.user._id;

  const search = await SavedSearch.findOne({ _id: id, tenant: tenantId });
  if (!search) return sendError(res, "Saved search not found.", 404);

  let result;
  if (search.ai?.isAISearch && search.ai?.naturalLanguageQuery) {
    result = await smartSearchService.naturalLanguageSearch({
      query: search.ai.naturalLanguageQuery,
      tenantId,
      page: Number(page),
      limit: Number(limit),
    });
  } else {
    result = await smartSearchService.filterSearch(
      search.filters,
      Number(page),
      Number(limit),
    );
  }

  if (!result.success) return sendError(res, "Search failed.", 500);

  await search.recordRun(result.pagination?.total || 0);

  return sendSuccess(res, "Search results retrieved.", {
    properties: result.properties,
    search,
    pagination: result.pagination,
    interpretation: result.interpretation,
  });
});

// ── UPDATE SAVED SEARCH (TENANT) ──────────────────────────────────────────────
const updateSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user._id;

  const search = await SavedSearch.findOne({ _id: id, tenant: tenantId });
  if (!search) return sendError(res, "Saved search not found.", 404);

  const { name, alertEnabled, alertFrequency, alertChannels } = req.body;

  if (name !== undefined) search.name = name;
  if (alertEnabled !== undefined) search.alertEnabled = alertEnabled;
  if (alertFrequency !== undefined) search.alertFrequency = alertFrequency;
  if (alertChannels !== undefined)
    search.alertChannels = { ...search.alertChannels, ...alertChannels };

  await search.save();

  return sendSuccess(res, "Saved search updated.", { search });
});

// ── DELETE SAVED SEARCH (TENANT) ──────────────────────────────────────────────
const deleteSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user._id;

  const search = await SavedSearch.findOneAndDelete({
    _id: id,
    tenant: tenantId,
  });
  if (!search) return sendError(res, "Saved search not found.", 404);

  return sendSuccess(res, "Saved search deleted.");
});

// ── GET SEARCH SUGGESTIONS (AI) ───────────────────────────────────────────────
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 3)
    return sendSuccess(res, "Suggestions retrieved.", { suggestions: [] });

  const suggestions = await smartSearchService.getSearchSuggestions(q);
  return sendSuccess(res, "Suggestions retrieved.", { suggestions });
});

// ── GET POPULAR SEARCHES ──────────────────────────────────────────────────────
const getPopularSearches = asyncHandler(async (req, res) => {
  const popular = await smartSearchService.getPopularSearches();
  return sendSuccess(res, "Popular searches retrieved.", { popular });
});

// ── NATURAL LANGUAGE SEARCH (AI) ─────────────────────────────────────────────
const naturalLanguageSearch = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12, save = false } = req.query;

  if (!q || q.trim().length < 3) {
    return sendError(res, "Search query must be at least 3 characters.", 400);
  }

  const result = await smartSearchService.naturalLanguageSearch({
    query: q,
    tenantId: req.user?._id || null,
    page: Number(page),
    limit: Number(limit),
    saveSearch: save === "true" && !!req.user,
  });

  if (!result.success) return sendError(res, result.error, 500);

  return sendSuccess(res, "Search results retrieved.", {
    properties: result.properties,
    interpretation: result.interpretation,
    confidence: result.confidence,
    filters: result.filters,
    suggestions: result.suggestions,
    pagination: result.pagination,
  });
});

module.exports = {
  getSavedSearches,
  saveSearch,
  runSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchSuggestions,
  getPopularSearches,
  naturalLanguageSearch,
};
