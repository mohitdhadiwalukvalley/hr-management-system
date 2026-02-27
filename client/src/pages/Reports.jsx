import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { reportService } from '../services/reportService';
import { departmentService } from '../services/departmentService';
import { LoadingSpinner, Badge, Card, StatsCard, EmptyState } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('dashboard');
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [departments, setDepartments] = useState([]);
  const [reportData, setReportData] = useState(null);
  const { isAdminOrHR } = useAuth();

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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeReport, filters.month, filters.year]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data.departments.filter(d => d.isActive));
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'dashboard':
          response = await reportService.getDashboard();
          break;
        case 'attendance':
          response = await reportService.getAttendance({ month: filters.month, year: filters.year });
          break;
        case 'leaves':
          response = await reportService.getLeaves({ year: filters.year });
          break;
        case 'payroll':
          response = await reportService.getPayroll({ month: filters.month, year: filters.year });
          break;
        case 'employees':
          response = await reportService.getEmployees();
          break;
        case 'departments':
          response = await reportService.getDepartments();
          break;
        default:
          response = await reportService.getDashboard();
      }
      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const reportTypes = [
    { id: 'dashboard', label: 'Dashboard Summary', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'attendance', label: 'Attendance Report', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'leaves', label: 'Leave Report', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'payroll', label: 'Payroll Report', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'employees', label: 'Employee Report', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'departments', label: 'Department Report', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  const renderDashboardReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Employees" value={reportData?.totalEmployees || 0} color="blue" />
        <StatsCard title="Departments" value={reportData?.totalDepartments || 0} color="emerald" />
        <StatsCard title="Present Today" value={reportData?.todayAttendance || 0} color="purple" />
        <StatsCard title="Pending Leaves" value={reportData?.pendingLeaves || 0} color="amber" />
        <StatsCard title="Monthly Payroll" value={formatCurrency(reportData?.monthlyPayroll)} color="blue" />
      </div>
    </div>
  );

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      {reportData?.report?.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Employee</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Half Day</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">WFH</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.report.map((item) => (
                  <tr key={item.employee._id} className="hover:bg-gray-50 dark:bg-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.employee.name}</p>
                        <p className="text-sm text-gray-500">{item.employee.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="success">{item.stats.present}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="danger">{item.stats.absent}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="warning">{item.stats.halfDay}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="info">{item.stats.wfh}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="default">{item.stats.late}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState title="No data available" description="No attendance records found for this period" />
        </Card>
      )}
    </div>
  );

  const renderLeaveReport = () => (
    <div className="space-y-6">
      {reportData?.report?.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Employee</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Casual</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Sick</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Earned</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total Approved</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.report.map((item) => (
                  <tr key={item.employee._id} className="hover:bg-gray-50 dark:bg-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.employee.name}</p>
                        <p className="text-sm text-gray-500">{item.employee.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">{item.stats.casual}</td>
                    <td className="px-6 py-4 text-center text-sm">{item.stats.sick}</td>
                    <td className="px-6 py-4 text-center text-sm">{item.stats.earned}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="success">{item.stats.approved}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="warning">{item.stats.pending}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState title="No data available" description="No leave records found" />
        </Card>
      )}
    </div>
  );

  const renderPayrollReport = () => (
    <div className="space-y-6">
      {reportData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Employees" value={reportData.summary.totalEmployees} color="blue" />
          <StatsCard title="Total Gross" value={formatCurrency(reportData.summary.totalGross)} color="emerald" />
          <StatsCard title="Total Deductions" value={formatCurrency(reportData.summary.totalDeductions)} color="red" />
          <StatsCard title="Total Net" value={formatCurrency(reportData.summary.totalNet)} color="purple" />
        </div>
      )}
      {reportData?.payroll?.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Employee</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Gross</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.payroll.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:bg-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{item.employee?.department?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(item.grossSalary)}</td>
                    <td className="px-6 py-4 text-right text-sm text-red-600">
                      {formatCurrency(
                        (item.deductions?.tax || 0) +
                        (item.deductions?.pf || 0) +
                        (item.deductions?.insurance || 0) +
                        (item.deductions?.leaveDeduction || 0)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(item.netSalary)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === 'paid' ? 'success' : 'warning'}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState title="No payroll data" description="No payroll records found for this period" />
        </Card>
      )}
    </div>
  );

  const renderEmployeeReport = () => (
    <div className="space-y-6">
      {reportData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total" value={reportData.total} color="blue" />
            <StatsCard title="Active" value={reportData.active} color="emerald" />
            <StatsCard title="Inactive" value={reportData.inactive} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="By Department">
              <div className="space-y-2">
                {Object.entries(reportData.byDepartment || {}).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{dept}</span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="By Employment Type">
              <div className="space-y-2">
                {Object.entries(reportData.byEmploymentType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700 capitalize">{type.replace('-', ' ')}</span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  const renderDepartmentReport = () => (
    <div className="space-y-6">
      {reportData?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.map((dept) => (
            <Card key={dept._id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
                  <p className="text-sm text-gray-500">{dept.code}</p>
                </div>
                <Badge variant={dept.isActive ? 'success' : 'default'}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{dept.employeeCount} employees</span>
              </div>
              {dept.manager && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Manager: {dept.manager}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No departments" description="No department data available" />
        </Card>
      )}
    </div>
  );

  const renderReport = () => {
    switch (activeReport) {
      case 'dashboard':
        return renderDashboardReport();
      case 'attendance':
        return renderAttendanceReport();
      case 'leaves':
        return renderLeaveReport();
      case 'payroll':
        return renderPayrollReport();
      case 'employees':
        return renderEmployeeReport();
      case 'departments':
        return renderDepartmentReport();
      default:
        return renderDashboardReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and view various reports</p>
      </div>

      {/* Report Type Selection */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveReport(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeReport === type.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
              </svg>
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      {['attendance', 'payroll', 'leaves'].includes(activeReport) && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeReport !== 'leaves' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        renderReport()
      )}
    </div>
  );
};

export default Reports;