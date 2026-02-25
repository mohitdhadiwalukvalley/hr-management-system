import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import { Button, Input, LoadingSpinner } from '../common';
import { useAuth } from '../../context/AuthContext';

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
  const { isAdminOrHR, user } = useAuth();

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

      const response = await leaveService.getAll(params);
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
      await leaveService.apply(formData);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'casual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-purple-100 text-purple-800';
      case 'earned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <Button onClick={() => { resetForm(); setShowApplyModal(true); }}>
          Apply Leave
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>
          {isAdminOrHR() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      </div>

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {leaves.filter(l => l.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {leaves.filter(l => l.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {leaves.filter(l => l.status === 'rejected').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Days</p>
          <p className="text-2xl font-bold text-blue-600">
            {leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0)}
          </p>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{leave.employee?.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                      {leave.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <p>{new Date(leave.startDate).toLocaleDateString()}</p>
                      <p>to {new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {leave.days} {leave.halfDay ? '(Half)' : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {leave.status === 'pending' && isAdminOrHR() && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(leave._id)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
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
                      <Button size="sm" variant="secondary" onClick={() => handleCancel(leave._id)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaves.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leave requests found.
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              {isAdminOrHR() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    value={formData.employee}
                    onChange={(e) => {
                      setFormData({ ...formData, employee: e.target.value });
                      fetchBalances(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="earned">Earned</option>
                </select>
              </div>
              {balances && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Available: <strong>{balances[formData.leaveType]?.available || 0}</strong> days
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={formData.halfDay}
                  onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="halfDay" className="ml-2 text-sm text-gray-700">
                  Half Day
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Apply</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Reject Leave Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedLeave(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleReject}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;