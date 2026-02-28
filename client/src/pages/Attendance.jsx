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

  // Default to last 30 days
  const getDateRange = (days = 30) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const [filters, setFilters] = useState({
    ...getDateRange(30),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    // Fetch attendance when filters change
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Get fresh date values
      const todayDate = new Date().toISOString().split('T')[0];
      const { startDate, endDate, department, status } = filters;

      console.log('Fetching attendance with filters:', { startDate, endDate, todayDate });

      if (isEmployee()) {
        // Employees see their own attendance history
        let allRecords = [];

        // Check if we're viewing today only
        const isViewingToday = startDate === todayDate && endDate === todayDate;
        console.log('Is viewing today:', isViewingToday);

        if (isViewingToday) {
          // For today, try both real-time status AND history
          let hasTodayRecord = false;

          // First, try to get today's real-time status
          try {
            const statusResponse = await attendanceService.getMyStatus();
            const todayStatus = statusResponse.data?.attendance;
            const employeeData = statusResponse.data?.employee;

            console.log('Today status response:', statusResponse.data);

            if (todayStatus) {
              // Check if the check-in is from today or a previous day
              const firstCheckIn = todayStatus.workSessions?.[0]?.checkIn || todayStatus.checkIn;
              let recordDate = todayDate;
              let isFromPreviousDay = false;

              if (firstCheckIn) {
                const checkInDate = new Date(firstCheckIn).toISOString().split('T')[0];
                recordDate = checkInDate;
                isFromPreviousDay = checkInDate !== todayDate;
              }

              // Always create a record if there's any status (even if not_checked_in, show it)
              // But only add to today's records if the check-in was today
              if (todayStatus.currentState && todayStatus.currentState !== 'not_checked_in') {
                const todayRecord = {
                  _id: todayStatus._id || `today-${Date.now()}`,
                  date: recordDate, // Use actual check-in date
                  currentState: todayStatus.currentState,
                  checkIn: todayStatus.checkIn || (todayStatus.workSessions?.[0]?.checkIn),
                  checkOut: todayStatus.checkOut || (todayStatus.workSessions?.[todayStatus.workSessions?.length - 1]?.checkOut),
                  totalWorkingMinutes: todayStatus.totalWorkingMinutes || 0,
                  totalBreakMinutes: todayStatus.totalBreakMinutes || 0,
                  workSessions: todayStatus.workSessions || [],
                  status: isFromPreviousDay ? 'previous_day' : 'present', // Mark if from previous day
                  isFromPreviousDay: isFromPreviousDay, // Add flag for UI
                  employee: employeeData || {
                    _id: user?._id,
                    firstName: user?.firstName || user?.email?.split('@')[0],
                    lastName: user?.lastName || '',
                    employeeId: user?.employeeId || '',
                  },
                };

                // Only add to today's records if checked in today
                if (!isFromPreviousDay) {
                  allRecords.push(todayRecord);
                  hasTodayRecord = true;
                  console.log('Added today record from status:', todayRecord);
                } else {
                  console.log('Check-in is from previous day:', recordDate);
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch today status:', err);
          }

          // Also try history as a fallback/source
          if (!hasTodayRecord) {
            try {
              const response = await attendanceService.getMyHistory({ limit: 30 });
              const historyRecords = response.data.attendance || [];
              console.log('History records:', historyRecords);

              // Find today's record in history
              historyRecords.forEach(record => {
                if (record.date) {
                  const recordDate = new Date(record.date).toISOString().split('T')[0];
                  if (recordDate === todayDate) {
                    allRecords.push(record);
                    hasTodayRecord = true;
                    console.log('Found today record in history:', record);
                  }
                }
              });
            } catch (err) {
              console.error('Failed to fetch attendance history:', err);
            }
          }

          console.log('Today view - hasTodayRecord:', hasTodayRecord, 'allRecords:', allRecords.length);
        } else {
          // Fetch history and filter by date range
          try {
            const response = await attendanceService.getMyHistory({ limit: 100 });
            const historyRecords = response.data.attendance || [];

            // Filter by date range - ONLY include records within range
            historyRecords.forEach(record => {
              if (record.date) {
                const recordDate = new Date(record.date).toISOString().split('T')[0];
                if (recordDate >= startDate && recordDate <= endDate) {
                  allRecords.push(record);
                }
              }
            });
            console.log('Filtered history records:', allRecords.length);
          } catch (err) {
            console.error('Failed to fetch attendance history:', err);
          }

          // If viewing a range that includes today, also add today's real-time status
          if (startDate <= todayDate && endDate >= todayDate) {
            try {
              const statusResponse = await attendanceService.getMyStatus();
              const todayStatus = statusResponse.data?.attendance;
              const employeeData = statusResponse.data?.employee;

              if (todayStatus && todayStatus.currentState !== 'not_checked_in') {
                // Check if today is already in the records
                const todayInRecords = allRecords.some(r => {
                  const recordDate = r.date ? new Date(r.date).toISOString().split('T')[0] : null;
                  return recordDate === todayDate;
                });

                if (!todayInRecords) {
                  const todayRecord = {
                    _id: todayStatus._id || `today-${Date.now()}`,
                    date: todayDate,
                    currentState: todayStatus.currentState,
                    checkIn: todayStatus.checkIn || (todayStatus.workSessions?.[0]?.checkIn),
                    checkOut: todayStatus.checkOut || (todayStatus.workSessions?.[todayStatus.workSessions?.length - 1]?.checkOut),
                    totalWorkingMinutes: todayStatus.totalWorkingMinutes || 0,
                    totalBreakMinutes: todayStatus.totalBreakMinutes || 0,
                    workSessions: todayStatus.workSessions || [],
                    status: 'present',
                    employee: employeeData || {
                      _id: user?._id,
                      firstName: user?.firstName || user?.email?.split('@')[0],
                      lastName: user?.lastName || '',
                      employeeId: user?.employeeId || '',
                    },
                  };
                  allRecords.push(todayRecord);
                }
              }
            } catch (err) {
              console.error('Failed to fetch today status:', err);
            }
          }
        }

        // Sort by date descending
        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        // FINAL: Strict client-side filter to ensure only records within date range
        const finalRecords = allRecords.filter(record => {
          if (!record.date) return false;
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          const isInRange = recordDate >= startDate && recordDate <= endDate;
          return isInRange;
        });

        console.log('Final records count:', finalRecords.length, 'for range:', startDate, 'to', endDate);
        setAttendance(finalRecords);
      } else {
        // Admin/HR see all attendance
        const params = {
          startDate: startDate,
          endDate: endDate,
          limit: 100,
        };
        if (department) params.department = department;
        if (status) params.status = status;

        const response = await attendanceService.getAll(params);
        let records = response.data.attendance || [];

        // If viewing today's date, also fetch real-time attendance data
        if (startDate <= todayDate && endDate >= todayDate) {
          try {
            const todayResponse = await attendanceService.getAll({
              date: todayDate,
              limit: 1000
            });
            const todayRecords = todayResponse.data.attendance || [];

            // Merge: replace historical records for today with real-time records
            const todayEmployeeIds = new Set(todayRecords.map(r => r.employee?._id || r.employee));
            records = records.filter(r => !todayEmployeeIds.has(r.employee?._id || r.employee));
            records = [...todayRecords, ...records];
          } catch (err) {
            console.error('Failed to fetch today attendance:', err);
          }
        }

        // Sort by date descending
        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        // FINAL: Strict client-side filter to ensure only records within date range
        const finalRecords = records.filter(record => {
          if (!record.date) return false;
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          const isInRange = recordDate >= startDate && recordDate <= endDate;
          return isInRange;
        });

        console.log('Admin final records count:', finalRecords.length, 'for range:', startDate, 'to', endDate);
        setAttendance(finalRecords);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
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

  // Get status from attendance record - handle both 'status' and 'currentState' fields
  const getAttendanceStatus = (record) => {
    // Check if from previous day (forgot to checkout)
    if (record.isFromPreviousDay) {
      return 'previous_day';
    }

    // If status field exists and is not empty, use it
    if (record.status && record.status !== 'undefined' && record.status !== 'previous_day') {
      return record.status;
    }

    // Check currentState field (used by real-time check-in system)
    if (record.currentState) {
      switch (record.currentState) {
        case 'working':
        case 'checked_out':
        case 'lunch_break':
        case 'personal_break':
          return 'present';
        case 'not_checked_in':
          // If has checkIn, they were present today
          if (record.checkIn) {
            return 'present';
          }
          return 'absent';
        default:
          break;
      }
    }

    // Check if there's any check-in recorded (from workSessions or checkIn field)
    if (record.checkIn) {
      return 'present';
    }

    // Check workSessions array - if there's any session, they were present
    if (record.workSessions && record.workSessions.length > 0) {
      const hasCheckIn = record.workSessions.some(session => session.checkIn);
      if (hasCheckIn) {
        return 'present';
      }
    }

    // Default to absent only if no check-in data at all
    return 'absent';
  };

  const getStatusBadge = (record) => {
    const status = getAttendanceStatus(record);
    const variants = {
      present: 'success',
      absent: 'danger',
      'half-day': 'warning',
      wfh: 'info',
      working: 'success',
      lunch_break: 'warning',
      personal_break: 'warning',
      checked_out: 'info',
      not_checked_in: 'default',
      previous_day: 'warning',
    };
    const labels = {
      present: 'Present',
      absent: 'Absent',
      'half-day': 'Half Day',
      wfh: 'WFH',
      working: 'Working',
      lunch_break: 'Lunch Break',
      personal_break: 'On Break',
      checked_out: 'Checked Out',
      not_checked_in: 'Not Checked In',
      previous_day: 'Forgot Checkout',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  // Compute today's date once for consistent comparisons
  const today = new Date().toISOString().split('T')[0];
  const isTodayFilter = filters.startDate === today && filters.endDate === today;

  const stats = {
    present: attendance.filter(a => getAttendanceStatus(a) === 'present').length,
    absent: attendance.filter(a => getAttendanceStatus(a) === 'absent').length,
    halfDay: attendance.filter(a => getAttendanceStatus(a) === 'half-day').length,
    wfh: attendance.filter(a => getAttendanceStatus(a) === 'wfh').length,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
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

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isTodayFilter ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setFilters({ ...filters, startDate: today, endDate: today });
          }}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const weekStart = new Date(now);
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            weekStart.setDate(diff);
            setFilters({
              ...filters,
              startDate: weekStart.toISOString().split('T')[0],
              endDate: today,
            });
          }}
        >
          This Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            setFilters({
              ...filters,
              startDate: monthStart.toISOString().split('T')[0],
              endDate: today,
            });
          }}
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            setFilters({
              ...filters,
              startDate: lastMonth.toISOString().split('T')[0],
              endDate: today,
            });
          }}
        >
          Last 30 Days
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing records from <span className="font-medium text-gray-700 dark:text-gray-300">{filters.startDate}</span> to <span className="font-medium text-gray-700 dark:text-gray-300">{filters.endDate}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-medium text-gray-700 dark:text-gray-300">{attendance.length}</span> records
          </p>
        </div>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 dark:hover:border-gray-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 dark:hover:border-gray-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <EmptyState
                      title="No attendance records"
                      description="No attendance records found for the selected date range. Try adjusting your filters or check back later."
                      icon={
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                  </td>
                </tr>
              ) : (
                attendance.map((record) => {
                  // Get check-in time from record.checkIn or workSessions
                  const getCheckInTime = () => {
                    if (record.checkIn) return record.checkIn;
                    if (record.workSessions && record.workSessions.length > 0) {
                      // Get first check-in of the day
                      const firstSession = record.workSessions[0];
                      return firstSession?.checkIn;
                    }
                    return null;
                  };

                  // Get check-out time from record.checkOut or workSessions
                  const getCheckOutTime = () => {
                    if (record.checkOut) return record.checkOut;
                    if (record.workSessions && record.workSessions.length > 0) {
                      // Get last check-out of the day
                      const lastSession = record.workSessions[record.workSessions.length - 1];
                      return lastSession?.checkOut;
                    }
                    return null;
                  };

                  // Calculate work hours from totalWorkingMinutes if available
                  const workHours = record.totalWorkingMinutes
                    ? `${Math.floor(record.totalWorkingMinutes / 60)}h ${record.totalWorkingMinutes % 60}m`
                    : record.workHours
                      ? `${record.workHours}h`
                      : null;

                  const checkInTime = getCheckInTime();
                  const checkOutTime = getCheckOutTime();

                  // Handle employee display - could be object, string ID, or null
                  const getEmployeeDisplay = () => {
                    const emp = record.employee;
                    // If employee is an object with firstName
                    if (emp && typeof emp === 'object' && emp.firstName) {
                      return {
                        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
                        employeeId: emp.employeeId || '-',
                      };
                    }
                    // If employee is an ID string, use current user info (for employees viewing own records)
                    if (emp && typeof emp === 'string') {
                      return {
                        name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email?.split('@')[0] || 'Me',
                        employeeId: user?.employeeId || '-',
                      };
                    }
                    // Fallback to user info
                    return {
                      name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email?.split('@')[0] || 'Unknown',
                      employeeId: user?.employeeId || '-',
                    };
                  };

                  const employeeDisplay = getEmployeeDisplay();

                  return (
                    <tr key={record._id || `record-${Date.now()}-${Math.random()}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.date ? new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          }) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employeeDisplay.name}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {employeeDisplay.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{employeeDisplay.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {checkInTime ? new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {checkOutTime ? new Date(checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {workHours ? (
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{workHours}</span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{record.notes || '-'}</span>
                      </td>
                    </tr>
                  );
                })
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Employee</label>
            <select
              value={markingData.employee}
              onChange={(e) => setMarkingData({ ...markingData, employee: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 dark:hover:border-gray-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={markingData.status}
              onChange={(e) => setMarkingData({ ...markingData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 dark:hover:border-gray-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={markingData.notes}
              onChange={(e) => setMarkingData({ ...markingData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 dark:hover:border-gray-500 transition-all resize-none
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
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