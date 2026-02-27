import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { payrollService } from '../services/payrollService';
import { employeeService } from '../services/employeeService';
import { Button, LoadingSpinner, Badge, Card, Modal, EmptyState, Avatar, StatsCard } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Payroll = () => {
  const [payrollList, setPayrollList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const { isAdminOrHR, isAdmin } = useAuth();

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, [filters.month, filters.year, filters.status]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params = {
        month: filters.month,
        year: filters.year,
      };
      if (filters.status) params.status = filters.status;
      const response = await payrollService.getAll(params);
      setPayrollList(response.data.payroll);
    } catch (error) {
      toast.error('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 100, status: 'active' });
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollService.generate(formData.employeeId, formData.month, formData.year);
      toast.success('Payroll generated successfully');
      setShowGenerateModal(false);
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBulk = async () => {
    if (!window.confirm(`Generate payroll for all active employees for ${months.find(m => m.value === filters.month)?.label} ${filters.year}?`)) return;

    setSubmitting(true);
    try {
      const response = await payrollService.generateBulk(filters.month, filters.year);
      toast.success(`Generated ${response.data.processed} payroll records`);
      fetchPayroll();
    } catch (error) {
      toast.error('Failed to generate bulk payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status, paymentData = {}) => {
    try {
      await payrollService.updateStatus(id, { status, ...paymentData });
      toast.success('Status updated');
      fetchPayroll();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleViewPayslip = async (payroll) => {
    try {
      const response = await payrollService.getPayslip(payroll._id);
      setPayslipData(response.data.payslip);
      setSelectedPayroll(payroll);
      setShowPayslipModal(true);
    } catch (error) {
      toast.error('Failed to fetch payslip');
    }
  };

  const handleDelete = async (payroll) => {
    if (!window.confirm(`Are you sure you want to delete this payroll record? This action cannot be undone.`)) {
      return;
    }
    try {
      await payrollService.delete(payroll._id);
      toast.success('Payroll record deleted');
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payroll');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      pending: 'warning',
      processed: 'info',
      paid: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const stats = {
    total: payrollList.length,
    totalAmount: payrollList.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    paid: payrollList.filter(p => p.status === 'paid').length,
    pending: payrollList.filter(p => p.status === 'pending' || p.status === 'draft').length,
  };

  if (loading && payrollList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee salaries and payments</p>
        </div>
        {isAdminOrHR() && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateBulk} loading={submitting}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate All
            </Button>
            <Button onClick={() => setShowGenerateModal(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generate Payroll
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Records"
          value={stats.total}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatsCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          color="emerald"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          title="Paid"
          value={stats.paid}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          color="amber"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gross</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrollList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <EmptyState
                      title="No payroll records"
                      description="Generate payroll for employees"
                      icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                  </td>
                </tr>
              ) : (
                payrollList.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${payroll.employee?.firstName} ${payroll.employee?.lastName}`}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {payroll.employee?.firstName} {payroll.employee?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{payroll.employee?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {months.find(m => m.value === payroll.month)?.label} {payroll.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-900">{formatCurrency(payroll.grossSalary)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-red-600">
                        -{formatCurrency(
                          (payroll.deductions?.tax || 0) +
                          (payroll.deductions?.pf || 0) +
                          (payroll.deductions?.insurance || 0) +
                          (payroll.deductions?.leaveDeduction || 0) +
                          (payroll.deductions?.other || 0)
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(payroll.netSalary)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleViewPayslip(payroll)}>
                          View
                        </Button>
                        {isAdminOrHR() && payroll.status === 'pending' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(payroll._id, 'processed')}>
                            Process
                          </Button>
                        )}
                        {isAdminOrHR() && payroll.status === 'processed' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(payroll._id, 'paid')}>
                            Mark Paid
                          </Button>
                        )}
                        {isAdmin() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(payroll)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Payroll"
      >
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Generate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payslip Modal */}
      <Modal
        isOpen={showPayslipModal}
        onClose={() => { setShowPayslipModal(false); setPayslipData(null); }}
        title="Payslip"
        size="lg"
      >
        {payslipData && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 px-6 py-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">PAYSLIP</h3>
                  <p className="text-blue-100">{payslipData.period.month}/{payslipData.period.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Status</p>
                  <p className="font-medium capitalize">{payslipData.status}</p>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-medium text-gray-900">{payslipData.employee.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employee ID</p>
                <p className="font-medium text-gray-900">{payslipData.employee.employeeId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{payslipData.employee.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Designation</p>
                <p className="font-medium text-gray-900">{payslipData.employee.designation || '-'}</p>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-6">
              {/* Earnings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Basic</span>
                    <span className="font-medium">{formatCurrency(payslipData.earnings?.basic)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-medium">{formatCurrency(payslipData.earnings?.allowances)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overtime</span>
                    <span className="font-medium">{formatCurrency(payslipData.earnings?.overtime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bonus</span>
                    <span className="font-medium">{formatCurrency(payslipData.earnings?.bonus)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Gross Salary</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(payslipData.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payslipData.deductions?.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">PF</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payslipData.deductions?.pf)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Insurance</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payslipData.deductions?.insurance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Leave Deduction</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payslipData.deductions?.leaveDeduction)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Net Salary</span>
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(payslipData.netSalary)}</span>
              </div>
            </div>

            {/* Working Days */}
            <div className="flex gap-6 text-sm text-gray-600">
              <span>Working Days: <strong>{payslipData.workingDays}</strong></span>
              <span>Paid Days: <strong>{payslipData.paidDays}</strong></span>
              <span>Unpaid Days: <strong>{payslipData.unpaidDays}</strong></span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payroll;