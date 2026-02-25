import api from './api';

export const leaveService = {
  async getAll(params = {}) {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  async apply(data) {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/leaves/${id}`, data);
    return response.data;
  },

  async approve(id) {
    const response = await api.patch(`/leaves/${id}/approve`);
    return response.data;
  },

  async reject(id, rejectionReason) {
    const response = await api.patch(`/leaves/${id}/reject`, { rejectionReason });
    return response.data;
  },

  async cancel(id) {
    const response = await api.patch(`/leaves/${id}/cancel`);
    return response.data;
  },

  async getBalance(employeeId) {
    const response = await api.get(`/leaves/balance/${employeeId}`);
    return response.data;
  },

  async getMyLeaves(params = {}) {
    const response = await api.get('/leaves/my-leaves', { params });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  },
};