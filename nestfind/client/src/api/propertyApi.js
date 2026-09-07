// nestfind/nestfind/client/src/api/propertyApi.js

import api from "./axios";

const propertyApi = {
  getProperties: (params) => api.get("/properties", { params }),
  getFeatured: (limit = 8) =>
    api.get("/properties/featured", { params: { limit } }),
  getProperty: (id) => api.get(`/properties/${id}`),
  getPropertyImages: (id) => api.get(`/properties/${id}/images`),
  getPropertyReviews: (id, params) =>
    api.get(`/properties/${id}/reviews`, { params }),
  createProperty: (data) => api.post("/properties", data),
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/properties/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/properties/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (propertyId, imageId) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
  setCoverImage: (propertyId, imageId) =>
    api.patch(`/properties/${propertyId}/images/${imageId}/cover`),
  reorderImages: (id, imageOrders) =>
    api.put(`/properties/${id}/images/reorder`, { imageOrders }),
  createReview: (id, data) => api.post(`/properties/${id}/reviews`, data),
  reportProperty: (id, data) => api.post(`/properties/${id}/report`, data),
};

export default propertyApi;
