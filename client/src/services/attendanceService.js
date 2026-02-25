import api from './api';

export const attendanceService = {
  async getAll(params = {}) {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  async mark(data) {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  async bulkMark(records) {
    const response = await api.post('/attendance/bulk', { records });
    return response.data;
  },

  async getMonthlyReport(month, year, params = {}) {
    const response = await api.get('/attendance/monthly-report', {
      params: { month, year, ...params },
    });
    return response.data;
  },

  async getEmployeeSummary(employeeId, month, year) {
    const response = await api.get(`/attendance/employee/${employeeId}/summary`, {
      params: { month, year },
    });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },
};