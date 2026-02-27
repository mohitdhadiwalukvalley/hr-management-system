import api from './api';

export const expenseService = {
  async getAll(params = {}) {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  async getMyExpenses(params = {}) {
    const response = await api.get('/expenses/my-expenses', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  async approve(id) {
    const response = await api.patch(`/expenses/${id}/approve`);
    return response.data;
  },

  async reject(id, rejectionReason) {
    const response = await api.patch(`/expenses/${id}/reject`, { rejectionReason });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async uploadReceipt(id, formData) {
    const response = await api.post(`/expenses/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};