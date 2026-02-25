import api from './api';

export const employeeService = {
  async getAll(params = {}) {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/employees', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/employees/${id}/status`, { status });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/employees/stats');
    return response.data;
  },
};