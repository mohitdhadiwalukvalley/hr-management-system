import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payroll from '../models/Payroll.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get dashboard summary report
export const getDashboardReport = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments({ status: 'active' });
  const totalDepartments = await Department.countDocuments({ isActive: true });

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.countDocuments({
    date: today,
    status: { $in: ['present', 'wfh'] }
  });

  // Get pending leaves
  const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

  // Get monthly payroll summary
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const payroll = await Payroll.find({ month: currentMonth, year: currentYear });
  const totalPayroll = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  res.json(ApiResponse.success({
    totalEmployees,
    totalDepartments,
    todayAttendance,
    pendingLeaves,
    monthlyPayroll: totalPayroll,
  }));
});

// Get attendance report
export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { month, year, department } = req.query;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const matchQuery = {
    date: { $gte: startDate, $lte: endDate }
  };

  // If department is specified, filter by department
  let employeeFilter = {};
  if (department) {
    employeeFilter = { department };
  }

  const employees = await Employee.find({ status: 'active', ...employeeFilter })
    .populate('department', 'name')
    .select('firstName lastName employeeId department');

  const report = [];

  for (const employee of employees) {
    const attendance = await Attendance.find({
      employee: employee._id,
      ...matchQuery
    });

    const stats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      wfh: attendance.filter(a => a.status === 'wfh').length,
      late: attendance.filter(a => a.isLate).length,
    };

    report.push({
      employee: {
        _id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department?.name
      },
      stats
    });
  }

  res.json(ApiResponse.success({ report, month, year }));
});

// Get leave report
export const getLeaveReport = asyncHandler(async (req, res) => {
  const { year, department } = req.query;

  const matchQuery = {};

  // Filter by year
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    matchQuery.startDate = { $gte: startDate, $lte: endDate };
  }

  let employeeFilter = {};
  if (department) {
    employeeFilter = { department };
  }

  const employees = await Employee.find({ status: 'active', ...employeeFilter })
    .populate('department', 'name')
    .select('firstName lastName employeeId department');

  const report = [];

  for (const employee of employees) {
    const leaves = await Leave.find({
      employee: employee._id,
      ...matchQuery
    });

    const stats = {
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      rejected: leaves.filter(l => l.status === 'rejected').length,
      pending: leaves.filter(l => l.status === 'pending').length,
      casual: leaves.filter(l => l.leaveType === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      sick: leaves.filter(l => l.leaveType === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      earned: leaves.filter(l => l.leaveType === 'earned' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
    };

    report.push({
      employee: {
        _id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department?.name
      },
      stats
    });
  }

  res.json(ApiResponse.success({ report, year }));
});

// Get payroll report
export const getPayrollReport = asyncHandler(async (req, res) => {
  const { month, year, department } = req.query;

  const matchQuery = {
    month: parseInt(month) || new Date().getMonth() + 1,
    year: parseInt(year) || new Date().getFullYear()
  };

  let employeeFilter = {};
  if (department) {
    employeeFilter = { department };
  }

  const payroll = await Payroll.find(matchQuery)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId department',
      populate: { path: 'department', select: 'name' },
      match: employeeFilter
    });

  const filteredPayroll = payroll.filter(p => p.employee);

  const summary = {
    totalGross: filteredPayroll.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
    totalNet: filteredPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    totalDeductions: filteredPayroll.reduce((sum, p) => {
      const d = p.deductions || {};
      return sum + (d.tax || 0) + (d.pf || 0) + (d.insurance || 0) + (d.leaveDeduction || 0) + (d.other || 0);
    }, 0),
    totalEmployees: filteredPayroll.length,
    paid: filteredPayroll.filter(p => p.status === 'paid').length,
    pending: filteredPayroll.filter(p => p.status === 'pending' || p.status === 'draft').length,
  };

  res.json(ApiResponse.success({
    payroll: filteredPayroll,
    summary,
    month: matchQuery.month,
    year: matchQuery.year
  }));
});

// Get employee report
export const getEmployeeReport = asyncHandler(async (req, res) => {
  const employees = await Employee.find()
    .populate('department', 'name')
    .select('firstName lastName employeeId email department designation employmentType status dateOfJoining');

  const report = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    byDepartment: {},
    byEmploymentType: {
      'full-time': employees.filter(e => e.employmentType === 'full-time').length,
      'part-time': employees.filter(e => e.employmentType === 'part-time').length,
      'contract': employees.filter(e => e.employmentType === 'contract').length,
    },
    employees: employees.map(e => ({
      _id: e._id,
      name: `${e.firstName} ${e.lastName}`,
      employeeId: e.employeeId,
      email: e.email,
      department: e.department?.name,
      designation: e.designation,
      employmentType: e.employmentType,
      status: e.status,
      dateOfJoining: e.dateOfJoining
    }))
  };

  // Group by department
  employees.forEach(emp => {
    const dept = emp.department?.name || 'Unassigned';
    report.byDepartment[dept] = (report.byDepartment[dept] || 0) + 1;
  });

  res.json(ApiResponse.success(report));
});

// Get department report
export const getDepartmentReport = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate('manager', 'firstName lastName');

  const report = [];

  for (const dept of departments) {
    const employeeCount = await Employee.countDocuments({
      department: dept._id,
      status: 'active'
    });

    report.push({
      _id: dept._id,
      name: dept.name,
      code: dept.code,
      manager: dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : null,
      employeeCount,
      leavePolicies: dept.leavePolicies,
      isActive: dept.isActive
    });
  }

  res.json(ApiResponse.success(report));
});