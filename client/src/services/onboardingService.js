import api from './api';

export const onboardingService = {
  async getAll(params = {}) {
    const response = await api.get('/onboarding', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/onboarding/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/onboarding', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/onboarding/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/onboarding/${id}`);
    return response.data;
  },

  async addChecklistItem(id, data) {
    const response = await api.post(`/onboarding/${id}/checklist`, data);
    return response.data;
  },

  async updateChecklistItem(onboardingId, itemId, data) {
    const response = await api.patch(`/onboarding/${onboardingId}/checklist/${itemId}`, data);
    return response.data;
  },

  async addDocument(id, data) {
    const response = await api.post(`/onboarding/${id}/documents`, data);
    return response.data;
  },

  async updateDocument(onboardingId, documentId, data) {
    const response = await api.patch(`/onboarding/${onboardingId}/documents/${documentId}`, data);
    return response.data;
  },
};