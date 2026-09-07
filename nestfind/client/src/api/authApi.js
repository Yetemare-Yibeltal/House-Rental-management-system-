// nestfind/nestfind/client/src/api/authApi.js

import api from "./axios";

const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout-all"),
  refreshToken: () => api.post("/auth/refresh-token"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/profile", data),
  uploadAvatar: (formData) =>
    api.post("/auth/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data) => api.patch("/auth/change-password", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  sendOTP: (data) => api.post("/auth/send-otp", data),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendOTP: (data) => api.post("/auth/resend-otp", data),
  updateNotificationPreferences: (data) =>
    api.patch("/auth/notification-preferences", data),
  updateAIPreferences: (data) => api.patch("/auth/ai-preferences", data),
  submitKYC: (formData) =>
    api.post("/auth/kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getKYCStatus: () => api.get("/auth/kyc/status"),
  getActiveSessions: () => api.get("/auth/sessions"),
  deleteAccount: (data) => api.delete("/auth/account", { data }),
};

export default authApi;
