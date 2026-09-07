// nestfind/nestfind/client/src/api/notificationApi.js

import api from "./axios";

const notificationApi = {
  getNotifications: (params) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  archiveNotification: (id) => api.patch(`/notifications/${id}/archive`),
  archiveAllRead: () => api.patch("/notifications/archive-read"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getSettings: () => api.get("/notifications/settings"),
};

export default notificationApi;
