import api from './api';

export const payrollService = {
  async getAll(params = {}) {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
  },

  async generate(employeeId, month, year) {
    const response = await api.post('/payroll/generate', { employeeId, month, year });
    return response.data;
  },

  async generateBulk(month, year) {
    const response = await api.post('/payroll/generate-bulk', { month, year });
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/payroll/${id}`, data);
    return response.data;
  },

  async updateStatus(id, data) {
    const response = await api.patch(`/payroll/${id}/status`, data);
    return response.data;
  },

  async getPayslip(id) {
    const response = await api.get(`/payroll/${id}/payslip`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/payroll/${id}`);
    return response.data;
  },
};