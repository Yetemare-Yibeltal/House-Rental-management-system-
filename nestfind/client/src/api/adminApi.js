// nestfind/nestfind/client/src/api/adminApi.js

import api from "./axios";

const adminApi = {
  // Dashboard
  getDashboard: () => api.get("/admin/dashboard"),
  getOverview: (params) => api.get("/admin/overview", { params }),

  // Users
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserStats: () => api.get("/admin/users/stats"),

  // KYC
  getKYCSubmissions: (params) => api.get("/admin/kyc", { params }),
  getKYCSubmission: (id) => api.get(`/admin/kyc/${id}`),
  processKYC: (id, data) => api.patch(`/admin/kyc/${id}`, data),

  // Properties
  getProperties: (params) => api.get("/admin/properties", { params }),
  getPendingProperties: (params) =>
    api.get("/admin/properties/pending", { params }),
  getFlaggedProperties: (params) =>
    api.get("/admin/properties/flagged", { params }),
  getProperty: (id) => api.get(`/admin/properties/${id}`),
  approveProperty: (id, data) => api.patch(`/admin/properties/${id}`, data),
  deleteProperty: (id, data) => api.delete(`/admin/properties/${id}`, { data }),
  runFraudCheck: (id) => api.post(`/admin/properties/${id}/fraud-check`),
  getPropertyStats: () => api.get("/admin/properties/stats"),

  // Payments
  getPayments: (params) => api.get("/admin/payments", { params }),
  getPayment: (id) => api.get(`/admin/payments/${id}`),
  processRefund: (id, data) => api.patch(`/admin/payments/${id}/refund`, data),
  resolveDispute: (id, data) =>
    api.patch(`/admin/payments/${id}/resolve-dispute`, data),
  getRevenueStats: (params) => api.get("/admin/payments/stats", { params }),
  getDisputedPayments: (params) =>
    api.get("/admin/payments/disputed", { params }),

  // Reports
  getReports: (params) => api.get("/admin/reports", { params }),
  getReport: (id) => api.get(`/admin/reports/${id}`),
  processReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
  getReportStats: () => api.get("/admin/reports/stats"),

  // Reviews
  getReviews: (params) => api.get("/admin/reviews", { params }),
  getReview: (id) => api.get(`/admin/reviews/${id}`),
  moderateReview: (id, data) => api.patch(`/admin/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getReviewStats: () => api.get("/admin/reviews/stats"),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.patch("/admin/settings", data),
  toggleAIFeature: (featureName, data) =>
    api.patch(`/admin/settings/ai-feature/${featureName}`, data),
  toggleMaintenance: (data) => api.patch("/admin/settings/maintenance", data),
  resetSettings: (data) => api.post("/admin/settings/reset", data),

  // Broadcast
  sendBroadcast: (data) => api.post("/admin/broadcast", data),

  // Audit Logs
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  getSecurityAlerts: (params) => api.get("/admin/security-alerts", { params }),

  // AI
  getAIStats: (params) => api.get("/admin/ai/stats", { params }),

  // Blog
  getAllPosts: (params) => api.get("/blog/admin/all", { params }),
  createPost: (formData) =>
    api.post("/blog", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePost: (id, formData) =>
    api.put(`/blog/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePost: (id) => api.delete(`/blog/${id}`),

  // FAQ
  getAllFAQs: (params) => api.get("/faq/admin/all", { params }),
  createFAQ: (data) => api.post("/faq", data),
  updateFAQ: (id, data) => api.put(`/faq/${id}`, data),
  deleteFAQ: (id) => api.delete(`/faq/${id}`),
};

export default adminApi;
