// nestfind/nestfind/client/src/api/messageApi.js

import api from "./axios";

const messageApi = {
  getConversations: () => api.get("/messages"),
  startConversation: (data) => api.post("/messages/start", data),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    api.post(`/messages/${conversationId}/messages`, data),
  searchMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}/search`, { params }),
  archiveConversation: (id) => api.patch(`/messages/${id}/archive`),
  deleteConversation: (id) => api.delete(`/messages/${id}`),
  getUnreadCount: () => api.get("/messages/unread"),
};

export default messageApi;
