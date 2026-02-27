import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { leaveService } from '../services/leaveService';
import { employeeService } from '../services/employeeService';
import { Button, Input, LoadingSpinner, Badge, Card, Modal, StatsCard, EmptyState, Avatar } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', leaveType: '', employee: '' });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
  });
  const [balances, setBalances] = useState(null);
  const { isAdminOrHR, user, isEmployee } = useAuth();

  useEffect(() => {
    fetchLeaves();
    if (isAdminOrHR()) {
      fetchEmployees();
    }
  }, [filters.status, filters.leaveType]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;
      if (filters.employee) params.employee = filters.employee;

      // Employees use my-leaves endpoint, admin/HR use all leaves
      const response = isEmployee()
        ? await leaveService.getMyLeaves(params)
        : await leaveService.getAll(params);
      setLeaves(response.data.leaves);
    } catch (error) {
      toast.error('Failed to fetch leaves');
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

  const fetchBalances = async (employeeId) => {
    try {
      const response = await leaveService.getBalance(employeeId);
      setBalances(response.data.balances);
    } catch (error) {
      console.error('Failed to fetch balances');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      if (isEmployee()) {
        // Employee applies for their own leave
        const { leaveType, startDate, endDate, reason, halfDay } = formData;
        await leaveService.applyMyLeave({ leaveType, startDate, endDate, reason, halfDay });
      } else {
        // Admin/HR applies for any employee
        await leaveService.apply(formData);
      }
      toast.success('Leave application submitted');
      setShowApplyModal(false);
      resetForm();
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm('Are you sure you want to approve this leave?')) return;
    try {
      await leaveService.approve(leaveId);
      toast.success('Leave approved');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await leaveService.reject(selectedLeave._id, rejectionReason);
      toast.success('Leave rejected');
      setShowRejectModal(false);
      setSelectedLeave(null);
      setRejectionReason('');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave?')) return;
    try {
      await leaveService.cancel(leaveId);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to cancel leave');
    }
  };

  const resetForm = () => {
    setFormData({
      employee: '',
      leaveType: 'casual',
      startDate: '',
      endDate: '',
      reason: '',
      halfDay: false,
    });
    setBalances(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getLeaveTypeBadge = (type) => {
    const variants = {
      casual: 'info',
      sick: 'purple',
      earned: 'warning',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
  };

  if (loading && leaves.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leave requests and balances</p>
        </div>
        <Button onClick={() => { resetForm(); setShowApplyModal(true); }}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Apply Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <StatsCard
          title="Approved"
          value={stats.approved}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="emerald"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
        />
        <StatsCard
          title="Total Days"
          value={stats.totalDays}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white dark:bg-gray-900"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type</label>
            <select
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white dark:bg-gray-900"
            >
              <option value="">All Types</option>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>
          {isAdminOrHR() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:border-gray-300 transition-all bg-white dark:bg-gray-900"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Leaves Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Days</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12">
                    <EmptyState
                      title="No leave requests"
                      description="Apply for leave to get started"
                      icon={
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${leave.employee?.firstName} ${leave.employee?.lastName}`}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{leave.employee?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getLeaveTypeBadge(leave.leaveType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-gray-100">{new Date(leave.startDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">to {new Date(leave.endDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {leave.days} {leave.halfDay && <span className="text-gray-500">(Half)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {leave.status === 'pending' && isAdminOrHR() && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(leave._id)}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowRejectModal(true);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {leave.status === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(leave._id)}>
                            Cancel
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

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApplyLeave} className="space-y-5">
          {isAdminOrHR() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
              <select
                value={formData.employee}
                onChange={(e) => {
                  setFormData({ ...formData, employee: e.target.value });
                  fetchBalances(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:border-gray-300 transition-all bg-white dark:bg-gray-900"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type</label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white dark:bg-gray-900"
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>
          {balances && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Available balance: <span className="font-semibold">{balances[formData.leaveType]?.available || 0}</span> days
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="halfDay"
              checked={formData.halfDay}
              onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Half Day</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all resize-none"
              rows={3}
              required
              placeholder="Enter reason for leave..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply Leave</Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedLeave(null);
          setRejectionReason('');
        }}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all resize-none"
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedLeave(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Reject Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Leaves;