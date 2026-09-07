// nestfind/nestfind/client/src/api/tenantApi.js

import api from "./axios";

const tenantApi = {
  // Bookings
  getBookings: (params) => api.get("/tenant/bookings/tenant", { params }),
  getBooking: (id) => api.get(`/tenant/bookings/${id}`),
  createBooking: (data) => api.post("/tenant/bookings", data),
  cancelBooking: (id, data) => api.patch(`/tenant/bookings/${id}/cancel`, data),

  // Rentals
  getActiveRental: () => api.get("/tenant/rentals/tenant/active"),
  getRentalHistory: (params) =>
    api.get("/tenant/rentals/tenant/history", { params }),
  getRental: (id) => api.get(`/tenant/rentals/${id}`),
  terminateRental: (id, data) =>
    api.patch(`/tenant/rentals/${id}/terminate`, data),

  // Contracts
  getContracts: () => api.get("/tenant/contracts/tenant"),
  getContract: (id) => api.get(`/tenant/contracts/${id}`),
  signContract: (id, data) =>
    api.patch(`/tenant/contracts/${id}/sign/tenant`, data),
  explainContract: (id, params) =>
    api.get(`/tenant/contracts/${id}/explain`, { params }),
  getExpiringContracts: () => api.get("/tenant/contracts/tenant/expiring"),

  // Payments
  getPayments: (params) => api.get("/tenant/payments/tenant", { params }),
  getPayment: (id) => api.get(`/tenant/payments/${id}`),
  createPayment: (data) => api.post("/tenant/payments", data),
  raiseDispute: (id, data) => api.post(`/tenant/payments/${id}/dispute`, data),
  getPaymentReceipt: (id) => api.get(`/tenant/payments/${id}/receipt`),

  // Maintenance
  getMaintenanceRequests: (params) =>
    api.get("/tenant/maintenance/tenant", { params }),
  getMaintenanceRequest: (id) => api.get(`/tenant/maintenance/${id}`),
  createMaintenanceRequest: (formData) =>
    api.post("/tenant/maintenance", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  confirmCompletion: (id, data) =>
    api.patch(`/tenant/maintenance/${id}/confirm`, data),
  diagnoseMaintenance: (data) => api.post("/tenant/maintenance/diagnose", data),

  // Saved Properties
  getSavedProperties: (params) =>
    api.get("/tenant/saved-properties", { params }),
  toggleSaveProperty: (data) =>
    api.post("/tenant/saved-properties/toggle", data),
  removeSavedProperty: (id) => api.delete(`/tenant/saved-properties/${id}`),
  getCollections: () => api.get("/tenant/saved-properties/collections"),
  checkIfSaved: (propertyId) =>
    api.get(`/tenant/saved-properties/check/${propertyId}`),
  getPriceDropAlerts: () => api.get("/tenant/saved-properties/price-drops"),

  // Saved Searches
  getSavedSearches: () => api.get("/tenant/saved-searches"),
  saveSearch: (data) => api.post("/tenant/saved-searches", data),
  runSavedSearch: (id, params) =>
    api.get(`/tenant/saved-searches/${id}/run`, { params }),
  updateSavedSearch: (id, data) =>
    api.patch(`/tenant/saved-searches/${id}`, data),
  deleteSavedSearch: (id) => api.delete(`/tenant/saved-searches/${id}`),
  naturalLanguageSearch: (params) =>
    api.get("/tenant/saved-searches/search", { params }),
};

export default tenantApi;
