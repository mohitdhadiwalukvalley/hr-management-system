import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatsCard, Card, Badge, Button, LoadingSpinner } from '../components/common';
import { AttendanceWidget } from '../components/attendance';
import { employeeService, departmentService, attendanceService, leaveService } from '../services';

const Dashboard = () => {
  const { user, isAdminOrHR, isEmployee, isHR, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 0,
    presentToday: 0,
    pendingLeaves: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdminOrHR()) {
        // Admin/HR: Fetch all data
        const [employeesRes, departmentsRes, attendanceRes, leavesRes] = await Promise.allSettled([
          employeeService.getAll({ limit: 1000 }),
          departmentService.getAll(),
          attendanceService.getAll({ date: new Date().toISOString().split('T')[0], limit: 1000 }),
          leaveService.getAll({ status: 'pending' }),
        ]);

        // Process employees
        const employees = employeesRes.status === 'fulfilled' ? employeesRes.value.data?.data || [] : [];
        setAllEmployees(employees);

        // Process departments
        const depts = departmentsRes.status === 'fulfilled' ? departmentsRes.value.data?.data || [] : [];
        setDepartments(depts.slice(0, 5));

        // Process attendance
        const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.data || [] : [];
        setTodayAttendance(attendance);

        // Process leaves
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value.data?.data || [] : [];
        setRecentLeaves(leaves.slice(0, 5));

        setStats({
          totalEmployees: employees.length,
          departments: depts.length,
          presentToday: attendance.filter(a => a.status === 'present' || a.status === 'working' || a.currentState === 'working').length,
          pendingLeaves: leaves.length,
        });
      } else {
        // Employee: Fetch only own data
        const [leavesRes] = await Promise.allSettled([
          leaveService.getAll({ status: 'pending' }),
        ]);

        // Process own leaves
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value.data?.data || [] : [];
        setMyLeaves(leaves.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Format working hours
  const formatWorkingHours = (minutes) => {
    if (!minutes || minutes === 0) return '0h 0m 0s';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate real-time working hours for currently working employees
  const calculateCurrentWorkingMinutes = (attendance) => {
    let totalMinutes = attendance.totalWorkingMinutes || 0;

    // If currently working, add elapsed time
    if (attendance.currentState === 'working' && attendance.workSessions?.length > 0) {
      const lastSession = attendance.workSessions[attendance.workSessions.length - 1];
      if (lastSession?.checkIn) {
        const checkInTime = new Date(lastSession.checkIn).getTime();
        const elapsedMinutes = Math.floor((Date.now() - checkInTime) / (1000 * 60));
        totalMinutes += elapsedMinutes;
      }
    }

    return totalMinutes;
  };

  // Get attendance status for an employee
  const getAttendanceStatus = (employeeId) => {
    return todayAttendance.find(a => a.employee?._id === employeeId || a.employee === employeeId);
  };

  // Get status badge variant
  const getStatusBadge = (attendance) => {
    if (!attendance) return { variant: 'default', label: 'Not Checked In' };

    switch (attendance.currentState) {
      case 'working':
        return { variant: 'success', label: 'Working' };
      case 'lunch_break':
        return { variant: 'warning', label: 'Lunch Break' };
      case 'personal_break':
        return { variant: 'warning', label: 'On Break' };
      case 'checked_out':
        return { variant: 'info', label: 'Checked Out' };
      default:
        if (attendance.checkIn) {
          return { variant: 'success', label: 'Present' };
        }
        return { variant: 'default', label: 'Not Checked In' };
    }
  };

  // Combine employees with their attendance
  const getEmployeeAttendanceData = () => {
    return allEmployees.map(emp => {
      const attendance = getAttendanceStatus(emp._id);
      const status = getStatusBadge(attendance);
      return {
        ...emp,
        attendance,
        status,
      };
    }).sort((a, b) => {
      // Sort: Working first, then on break, then checked out, then not checked in
      const order = { working: 0, lunch_break: 1, personal_break: 2, checked_out: 3, not_checked_in: 4 };
      const aOrder = order[a.attendance?.currentState] ?? 4;
      const bOrder = order[b.attendance?.currentState] ?? 4;
      return aOrder - bOrder;
    });
  };

  const quickActions = [
    {
      name: 'Add Employee',
      href: '/employees',
      icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      color: 'blue',
    },
    {
      name: 'Leave Requests',
      href: '/leaves',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'emerald',
    },
    {
      name: 'Mark Attendance',
      href: '/attendance',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'purple',
    },
    {
      name: 'Run Payroll',
      href: '/payroll',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'amber',
    },
  ];

  const employeeQuickActions = [
    {
      name: 'My Leaves',
      href: '/leaves',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'emerald',
    },
    {
      name: 'My Payslips',
      href: '/payroll',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'amber',
    },
    {
      name: 'Attendance History',
      href: '/attendance',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'purple',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-700',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700',
      purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-700',
      amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-700',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Employee Dashboard
  if (isEmployee()) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-bold">
              {getGreeting()}, {user?.email?.split('@')[0]}!
            </h1>
            <p className="mt-2 text-blue-100 text-lg">
              Welcome to your employee portal.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        </div>

        {/* Attendance Widget - Most important for employees */}
        <AttendanceWidget />

        {/* Quick Actions for Employee */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {employeeQuickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getColorClasses(action.color)}`}
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
                <span className="text-sm font-medium text-center">{action.name}</span>
              </a>
            ))}
          </div>
        </Card>

        {/* My Leaves */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Leave Requests</h2>
            <a href="/leaves" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </a>
          </div>
          {myLeaves.length > 0 ? (
            <div className="space-y-3">
              {myLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{leave.leaveType}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{leave.days} day(s)</p>
                  </div>
                  <Badge variant={leave.status === 'pending' ? 'warning' : leave.status === 'approved' ? 'success' : 'danger'}>
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No pending leave requests</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Admin/HR Dashboard
  const employeeAttendanceData = getEmployeeAttendanceData();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {getGreeting()}, {user?.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-blue-100 text-lg">
            Here's what's happening in your organization today.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => window.location.href = '/employees'}
            >
              View Team
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => window.location.href = '/reports'}
            >
              View Reports
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-20 -mb-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          trend="+12%"
          trendUp={true}
          color="blue"
        />
        <StatsCard
          title="Present Today"
          value={stats.presentToday}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={`${Math.round((stats.presentToday / stats.totalEmployees) * 100) || 0}%`}
          trendUp={true}
          color="emerald"
        />
        <StatsCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="amber"
        />
        <StatsCard
          title="Departments"
          value={stats.departments}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Self Attendance Widget for HR only (Admin only views, doesn't check in) */}
      {isHR() && <AttendanceWidget />}

      {/* Quick Actions for Admin/HR */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getColorClasses(action.color)}`}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              <span className="text-sm font-medium">{action.name}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Today's Employee Attendance Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Attendance</h2>
          <a href="/attendance" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Details
          </a>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {employeeAttendanceData.filter(e => e.attendance?.currentState === 'working').length}
            </div>
            <div className="text-xs text-green-700">Working</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {employeeAttendanceData.filter(e => ['lunch_break', 'personal_break'].includes(e.attendance?.currentState)).length}
            </div>
            <div className="text-xs text-amber-700">On Break</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {employeeAttendanceData.filter(e => e.attendance?.currentState === 'checked_out').length}
            </div>
            <div className="text-xs text-blue-700">Checked Out</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {employeeAttendanceData.filter(e => !e.attendance || e.attendance?.currentState === 'not_checked_in').length}
            </div>
            <div className="text-xs text-gray-700">Not Checked In</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {employeeAttendanceData.filter(e => e.attendance?.checkIn).length}
            </div>
            <div className="text-xs text-purple-700">Total Present</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check In</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Check Out</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Working Hours</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Break Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {employeeAttendanceData.slice(0, 10).map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {emp.attendance?.currentState === 'working' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      <Badge
                        variant={emp.status.variant === 'success' ? 'success' : emp.status.variant === 'warning' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {emp.status.label}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {emp.attendance?.checkIn ? formatTime(emp.attendance.checkIn) : '--:--:--'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {emp.attendance?.checkOut ? formatTime(emp.attendance.checkOut) : '--:--:--'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {emp.attendance ? formatWorkingHours(calculateCurrentWorkingMinutes(emp.attendance)) : '0h 0m'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {emp.attendance?.totalBreakMinutes ? formatWorkingHours(emp.attendance.totalBreakMinutes) : '0h 0m'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employeeAttendanceData.length > 10 && (
          <div className="mt-4 text-center">
            <a href="/attendance" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all {employeeAttendanceData.length} employees →
            </a>
          </div>
        )}

        {employeeAttendanceData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">No employees found</p>
          </div>
        )}
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Leave Requests</h2>
            <a href="/leaves" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </a>
          </div>
          {recentLeaves.length > 0 ? (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                      {leave.employee?.firstName?.[0] || leave.employee?.email?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {leave.leaveType} - {leave.days} day(s)
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Pending</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No pending leave requests</p>
            </div>
          )}
        </Card>

        {/* Department Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Department Overview</h2>
            <a href="/departments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </a>
          </div>
          {departments.length > 0 ? (
            <div className="space-y-3">
              {departments.map((dept, index) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm ${
                      ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'][index % 5]
                    }`}>
                      {dept.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dept.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dept.code || 'No code'}</p>
                    </div>
                  </div>
                  <Badge variant="default" size="sm">
                    {dept.employeeCount || 0} employees
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm">No departments found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;