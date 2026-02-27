import api from './api';

export const reportService = {
  async getDashboard() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  async getAttendance(params) {
    const response = await api.get('/reports/attendance', { params });
    return response.data;
  },

  async getLeaves(params) {
    const response = await api.get('/reports/leaves', { params });
    return response.data;
  },

  async getPayroll(params) {
    const response = await api.get('/reports/payroll', { params });
    return response.data;
  },

  async getEmployees() {
    const response = await api.get('/reports/employees');
    return response.data;
  },

  async getDepartments() {
    const response = await api.get('/reports/departments');
    return response.data;
  },
};