import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { Button, Input, LoadingSpinner, Badge, Card, Modal, StatsCard, EmptyState, Avatar } from '../components/common';
import { AttendanceWidget } from '../components/attendance';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default to current week
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState({
    startDate: getWeekStart(),
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
  });
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markingData, setMarkingData] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
    notes: '',
  });
  const { isAdminOrHR, isEmployee, loading: authLoading, user } = useAuth();

  useEffect(() => {
    // Wait for auth to load before fetching data
    if (authLoading) return;

    if (isAdminOrHR()) {
      fetchDepartments();
      fetchEmployees();
    }
    fetchAttendance();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (filters.startDate || filters.endDate) {
      fetchAttendance();
    }
  }, [filters.startDate, filters.endDate, filters.department, filters.status, authLoading]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data.departments.filter(d => d.isActive));
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 1000, status: 'active' });
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      if (isEmployee()) {
        // Employees see their own attendance history
        const response = await attendanceService.getMyHistory({
          limit: 30,
        });
        setAttendance(response.data.attendance);
      } else {
        // Admin/HR see all attendance
        const params = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 100,
        };
        if (filters.department) params.department = filters.department;
        if (filters.status) params.status = filters.status;

        const response = await attendanceService.getAll(params);
        setAttendance(response.data.attendance);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.mark(markingData);
      toast.success('Attendance marked successfully');
      setShowMarkModal(false);
      setMarkingData({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '',
        checkOut: '',
        notes: '',
      });
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'success',
      absent: 'danger',
      'half-day': 'warning',
      wfh: 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    wfh: attendance.filter(a => a.status === 'wfh').length,
  };

  if (loading && attendance.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage employee attendance</p>
        </div>
        {isAdminOrHR() && (
          <Button onClick={() => setShowMarkModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Mark Attendance
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Present"
          value={stats.present}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="emerald"
        />
        <StatsCard
          title="Absent"
          value={stats.absent}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
        />
        <StatsCard
          title="Half Day"
          value={stats.halfDay}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <StatsCard
          title="Work From Home"
          value={stats.wfh}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="wfh">Work From Home</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <EmptyState
                      title="No attendance records"
                      description="No attendance records found for the selected date range"
                      icon={
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${record.employee?.firstName} ${record.employee?.lastName}`}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{record.employee?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {record.workHours ? (
                        <span className="text-sm font-medium text-gray-900">{record.workHours}h</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{record.notes || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        title="Mark Attendance"
      >
        <form onSubmit={handleMarkAttendance} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
            <select
              value={markingData.employee}
              onChange={(e) => setMarkingData({ ...markingData, employee: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white"
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
          <Input
            type="date"
            label="Date"
            value={markingData.date}
            onChange={(e) => setMarkingData({ ...markingData, date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={markingData.status}
              onChange={(e) => setMarkingData({ ...markingData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all bg-white"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="wfh">Work From Home</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Check In"
              value={markingData.checkIn}
              onChange={(e) => setMarkingData({ ...markingData, checkIn: e.target.value })}
            />
            <Input
              type="time"
              label="Check Out"
              value={markingData.checkOut}
              onChange={(e) => setMarkingData({ ...markingData, checkOut: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={markingData.notes}
              onChange={(e) => setMarkingData({ ...markingData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowMarkModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Mark Attendance</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;