import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { onboardingService } from '../services/onboardingService';
import { employeeService } from '../services/employeeService';
import { Button, LoadingSpinner, Badge, Card, Modal, EmptyState, Avatar, StatsCard } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const [onboardingList, setOnboardingList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [formData, setFormData] = useState({
    employee: '',
    mentor: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const { isAdminOrHR } = useAuth();

  useEffect(() => {
    fetchOnboarding();
    fetchEmployees();
  }, [filters.status]);

  const fetchOnboarding = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      const response = await onboardingService.getAll(params);
      setOnboardingList(response.data.onboarding);
    } catch (error) {
      toast.error('Failed to fetch onboarding records');
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onboardingService.create(formData);
      toast.success('Onboarding record created');
      setShowModal(false);
      resetForm();
      fetchOnboarding();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await onboardingService.update(id, { status });
      toast.success('Status updated');
      fetchOnboarding();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateChecklistItem = async (onboardingId, itemId, status) => {
    try {
      await onboardingService.updateChecklistItem(onboardingId, itemId, { status });
      toast.success('Checklist item updated');
      if (selectedOnboarding && selectedOnboarding._id === onboardingId) {
        fetchOnboardingDetails(onboardingId);
      }
      fetchOnboarding();
    } catch (error) {
      toast.error('Failed to update checklist item');
    }
  };

  const fetchOnboardingDetails = async (id) => {
    try {
      const response = await onboardingService.getById(id);
      setSelectedOnboarding(response.data.onboarding);
    } catch (error) {
      toast.error('Failed to fetch details');
    }
  };

  const resetForm = () => {
    setFormData({
      employee: '',
      mentor: '',
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      on_hold: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const stats = {
    total: onboardingList.length,
    pending: onboardingList.filter(o => o.status === 'pending').length,
    inProgress: onboardingList.filter(o => o.status === 'in_progress').length,
    completed: onboardingList.filter(o => o.status === 'completed').length,
  };

  if (loading && onboardingList.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Manage new employee onboarding process</p>
        </div>
        {isAdminOrHR() && (
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Start Onboarding
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total" value={stats.total} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatsCard title="Pending" value={stats.pending} color="amber" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatsCard title="In Progress" value={stats.inProgress} color="blue" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} />
        <StatsCard title="Completed" value={stats.completed} color="emerald" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Onboarding List */}
      {onboardingList.length === 0 ? (
        <Card>
          <EmptyState
            title="No onboarding records"
            description="Start onboarding new employees"
            icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {onboardingList.map((item) => {
            const checklistCompleted = item.checklist?.filter(c => c.status === 'completed').length || 0;
            const checklistTotal = item.checklist?.length || 0;
            const progress = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

            return (
              <Card key={item._id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  item.status === 'completed' ? 'bg-emerald-500' :
                  item.status === 'in_progress' ? 'bg-blue-500' :
                  item.status === 'on_hold' ? 'bg-gray-400' : 'bg-amber-500'
                }`} />

                <div className="pt-2">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${item.employee?.firstName} ${item.employee?.lastName}`}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{item.employee?.employeeId}</p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {checklistCompleted} of {checklistTotal} tasks completed
                    </p>
                  </div>

                  {/* Mentor */}
                  {item.mentor && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Mentor: {item.mentor.firstName} {item.mentor.lastName}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedOnboarding(item);
                        fetchOnboardingDetails(item._id);
                      }}
                    >
                      View Details
                    </Button>
                    {isAdminOrHR() && item.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(item._id, 'in_progress')}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Start New Onboarding"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
            <select
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mentor (Optional)</label>
            <select
              value={formData.mentor}
              onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white"
            >
              <option value="">Select Mentor</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedOnboarding}
        onClose={() => setSelectedOnboarding(null)}
        title="Onboarding Details"
        size="lg"
      >
        {selectedOnboarding && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <Avatar
                name={`${selectedOnboarding.employee?.firstName} ${selectedOnboarding.employee?.lastName}`}
                size="xl"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {selectedOnboarding.employee?.firstName} {selectedOnboarding.employee?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{selectedOnboarding.employee?.email}</p>
                {getStatusBadge(selectedOnboarding.status)}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Checklist</h4>
              <div className="space-y-2">
                {selectedOnboarding.checklist?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-emerald-500' :
                        item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        {item.status === 'completed' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.task}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </div>
                    {isAdminOrHR() && item.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateChecklistItem(selectedOnboarding._id, item._id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
                {(!selectedOnboarding.checklist || selectedOnboarding.checklist.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No checklist items</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAdminOrHR() && selectedOnboarding.status !== 'completed' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {selectedOnboarding.status === 'pending' && (
                  <Button onClick={() => handleUpdateStatus(selectedOnboarding._id, 'in_progress')}>
                    Start Onboarding
                  </Button>
                )}
                {selectedOnboarding.status === 'in_progress' && (
                  <Button onClick={() => handleUpdateStatus(selectedOnboarding._id, 'completed')}>
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Onboarding;