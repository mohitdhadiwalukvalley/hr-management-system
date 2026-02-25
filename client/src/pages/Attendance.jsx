import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { Button, Input, LoadingSpinner } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
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
  const { isAdminOrHR } = useAuth();

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      fetchAttendance();
    }
  }, [filters.startDate, filters.endDate, filters.department, filters.status]);

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
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 100,
      };
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;

      const response = await attendanceService.getAll(params);
      setAttendance(response.data.attendance);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'half-day': return 'bg-yellow-100 text-yellow-800';
      case 'wfh': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group attendance by date
  const groupedAttendance = attendance.reduce((groups, record) => {
    const date = new Date(record.date).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
    return groups;
  }, {});

  if (loading && attendance.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        {isAdminOrHR() && (
          <Button onClick={() => setShowMarkModal(true)}>
            Mark Attendance
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="wfh">Work From Home</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Present</p>
          <p className="text-2xl font-bold text-green-600">
            {attendance.filter(a => a.status === 'present').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Absent</p>
          <p className="text-2xl font-bold text-red-600">
            {attendance.filter(a => a.status === 'absent').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Half Day</p>
          <p className="text-2xl font-bold text-yellow-600">
            {attendance.filter(a => a.status === 'half-day').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">WFH</p>
          <p className="text-2xl font-bold text-blue-600">
            {attendance.filter(a => a.status === 'wfh').length}
          </p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.employee?.firstName} {record.employee?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{record.employee?.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.workHours ? `${record.workHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendance.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attendance records found for the selected date range.
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={markingData.employee}
                  onChange={(e) => setMarkingData({ ...markingData, employee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={markingData.status}
                  onChange={(e) => setMarkingData({ ...markingData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={markingData.notes}
                  onChange={(e) => setMarkingData({ ...markingData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowMarkModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Mark Attendance</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;