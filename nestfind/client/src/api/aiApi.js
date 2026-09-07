// nestfind/nestfind/client/src/api/aiApi.js

import api from "./axios";

const aiApi = {
  // Chat
  startConversation: (data) => api.post("/ai/chat/start", data),
  sendMessage: (data) => api.post("/ai/chat/message", data),
  endConversation: (conversationId) =>
    api.patch(`/ai/chat/${conversationId}/end`),
  getHistory: () => api.get("/ai/chat/history"),
  addFeedback: (conversationId, messageId, data) =>
    api.post(`/ai/chat/${conversationId}/message/${messageId}/feedback`, data),
  getSuggestions: (params) => api.get("/ai/chat/suggestions", { params }),

  // Recommendations
  getRecommendations: (params) => api.get("/ai/recommendations", { params }),
  recordInteraction: (data) =>
    api.post("/ai/recommendations/interaction", data),

  // Smart Search
  smartSearch: (params) => api.get("/ai/search", { params }),
  getSearchSuggestions: (params) =>
    api.get("/ai/search/suggestions", { params }),

  // Rent Advisor
  getRentAdvice: (data) => api.post("/ai/rent-advisor", data),

  // Lease Explainer
  explainLease: (contractId, params) =>
    api.get(`/ai/lease/${contractId}/explain`, { params }),
  analyzeClause: (data) => api.post("/ai/lease/analyze-clause", data),

  // Maintenance
  diagnoseMaintenance: (data) => api.post("/ai/maintenance/diagnose", data),

  // Property Description
  generateDescription: (data) => api.post("/ai/description/generate", data),
  improveDescription: (data) => api.post("/ai/description/improve", data),
  translateDescription: (data) => api.post("/ai/description/translate", data),

  // Admin
  getAIStats: (params) => api.get("/ai/stats", { params }),
  checkFraud: (propertyId) => api.post(`/ai/fraud-check/${propertyId}`),
};

export default aiApi;
