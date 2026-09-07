// nestfind/nestfind/client/src/api/landlordApi.js

import api from "./axios";

const landlordApi = {
  // Dashboard
  getDashboard: () => api.get("/landlord/dashboard"),

  // Analytics
  getAnalytics: (params) => api.get("/landlord/analytics", { params }),
  getPropertyAnalytics: (propertyId) =>
    api.get(`/landlord/analytics/property/${propertyId}`),

  // Profile
  updateProfile: (data) => api.patch("/landlord/profile", data),
  getLandlordProfile: (id) => api.get(`/landlord/profile/${id}`),

  // Bookings
  getBookings: (params) => api.get("/tenant/bookings/landlord", { params }),
  getUpcomingVisits: () => api.get("/tenant/bookings/landlord/upcoming"),
  getBookingStats: () => api.get("/tenant/bookings/landlord/stats"),
  approveBooking: (id, data) =>
    api.patch(`/tenant/bookings/${id}/approve`, data),
  declineBooking: (id, data) =>
    api.patch(`/tenant/bookings/${id}/decline`, data),
  completeBooking: (id, data) =>
    api.patch(`/tenant/bookings/${id}/complete`, data),

  // Rentals
  getRentals: (params) => api.get("/tenant/rentals/landlord", { params }),
  createRental: (data) => api.post("/tenant/rentals", data),
  getRental: (id) => api.get(`/tenant/rentals/${id}`),
  updateRental: (id, data) => api.patch(`/tenant/rentals/${id}`, data),
  terminateRental: (id, data) =>
    api.patch(`/tenant/rentals/${id}/terminate`, data),
  recordMoveIn: (id, data) => api.patch(`/tenant/rentals/${id}/move-in`, data),

  // Contracts
  getContracts: () => api.get("/tenant/contracts/landlord"),
  createContract: (data) => api.post("/tenant/contracts", data),
  signContract: (id, data) =>
    api.patch(`/tenant/contracts/${id}/sign/landlord`, data),
  terminateContract: (id, data) =>
    api.patch(`/tenant/contracts/${id}/terminate`, data),

  // Payments
  getPayments: (params) => api.get("/tenant/payments/landlord", { params }),
  getMonthlySummary: (params) =>
    api.get("/tenant/payments/landlord/summary", { params }),
  getOverduePayments: () => api.get("/tenant/payments/landlord/overdue"),

  // Maintenance
  getMaintenanceRequests: (params) =>
    api.get("/tenant/maintenance/landlord", { params }),
  getMaintenanceRequest: (id) => api.get(`/tenant/maintenance/${id}`),
  acknowledgeRequest: (id, data) =>
    api.patch(`/tenant/maintenance/${id}/acknowledge`, data),
  markInProgress: (id, data) =>
    api.patch(`/tenant/maintenance/${id}/progress`, data),
  completeRequest: (id, formData) =>
    api.patch(`/tenant/maintenance/${id}/complete`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  rejectRequest: (id, data) =>
    api.patch(`/tenant/maintenance/${id}/reject`, data),
  analyzePatterns: (propertyId) =>
    api.get(`/tenant/maintenance/property/${propertyId}/patterns`),

  // Tenants
  getTenants: () => api.get("/landlord/tenants"),
  getTenantDetails: (tenantId) => api.get(`/landlord/tenants/${tenantId}`),
  reviewTenant: (tenantId, data) =>
    api.post(`/landlord/tenants/${tenantId}/review`, data),

  // AI Features
  getRentAdvice: (data) => api.post("/landlord/ai/rent-advice", data),
  getQuickEstimate: (params) =>
    api.get("/landlord/ai/rent-estimate", { params }),
  generateDescription: (data) =>
    api.post("/landlord/ai/generate-description", data),
  improveDescription: (data) =>
    api.post("/landlord/ai/improve-description", data),
  analyzePortfolioPricing: () => api.get("/landlord/ai/portfolio-pricing"),
};

export default landlordApi;
