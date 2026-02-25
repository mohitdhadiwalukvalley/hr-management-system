import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get all payroll records
export const getAllPayroll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, employee, month, year, status } = req.query;

  const query = {};
  if (employee) query.employee = employee;
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (status) query.status = status;

  const payroll = await Payroll.find(query)
    .populate('employee', 'firstName lastName employeeId department')
    .sort({ year: -1, month: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payroll.countDocuments(query);

  res.json(
    ApiResponse.success({
      payroll,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get payroll by ID
export const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email department');

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found');
  }

  res.json(ApiResponse.success({ payroll }));
});

// Generate payroll for employee
export const generatePayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.body;

  // Verify employee exists
  const employee = await Employee.findById(employeeId).populate('department');
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Check if payroll already exists
  const existingPayroll = await Payroll.findOne({
    employee: employeeId,
    month,
    year,
  });

  if (existingPayroll) {
    throw ApiError.conflict('Payroll already exists for this month');
  }

  // Calculate working days and paid days from attendance
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const workingDays = endDate.getDate();

  const attendance = await Attendance.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  const presentDays = attendance.filter(a =>
    a.status === 'present' || a.status === 'wfh'
  ).length;
  const halfDays = attendance.filter(a => a.status === 'half-day').length * 0.5;
  const paidDays = presentDays + halfDays;
  const unpaidDays = workingDays - paidDays;

  // Calculate earnings
  const basicSalary = employee.salary?.basic || 0;
  const perDaySalary = basicSalary / workingDays;
  const leaveDeduction = unpaidDays * perDaySalary;

  // Calculate allowances
  const allowances = employee.salary?.allowances?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;

  // Calculate deductions (basic PF calculation - 12% of basic)
  const pf = Math.min(basicSalary * 0.12, 1800); // PF capped at 1800

  const payroll = await Payroll.create({
    employee: employeeId,
    month,
    year,
    earnings: {
      basic: basicSalary,
      allowances,
      overtime: 0,
      bonus: 0,
      reimbursement: 0,
    },
    deductions: {
      tax: 0,
      pf,
      insurance: 0,
      leaveDeduction: Math.round(leaveDeduction),
      other: 0,
    },
    workingDays,
    paidDays,
    unpaidDays,
    status: 'draft',
    generatedBy: req.user._id,
  });

  const populatedPayroll = await Payroll.findById(payroll._id)
    .populate('employee', 'firstName lastName employeeId');

  res
    .status(201)
    .json(
      ApiResponse.created({ payroll: populatedPayroll }, 'Payroll generated successfully')
    );
});

// Update payroll
export const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found');
  }

  const { earnings, deductions, notes } = req.body;

  if (earnings) payroll.earnings = { ...payroll.earnings, ...earnings };
  if (deductions) payroll.deductions = { ...payroll.deductions, ...deductions };
  if (notes) payroll.notes = notes;

  await payroll.save();

  const updatedPayroll = await Payroll.findById(payroll._id)
    .populate('employee', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ payroll: updatedPayroll }, 'Payroll updated successfully'));
});

// Update payroll status
export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status, paymentRef, paymentMethod } = req.body;

  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found');
  }

  payroll.status = status;
  if (status === 'paid') {
    payroll.paidAt = new Date();
    payroll.paymentRef = paymentRef;
    payroll.paymentMethod = paymentMethod;
  }

  await payroll.save();

  res.json(ApiResponse.success({ payroll }, 'Payroll status updated'));
});

// Generate bulk payroll
export const generateBulkPayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;

  // Get all active employees
  const employees = await Employee.find({ status: 'active' }).populate('department');

  const results = [];
  const errors = [];

  for (const employee of employees) {
    try {
      // Check if payroll already exists
      const existing = await Payroll.findOne({
        employee: employee._id,
        month,
        year,
      });

      if (existing) {
        errors.push({ employee: employee.employeeId, error: 'Payroll already exists' });
        continue;
      }

      // Calculate attendance-based values
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const workingDays = endDate.getDate();

      const attendance = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate },
      });

      const presentDays = attendance.filter(a =>
        a.status === 'present' || a.status === 'wfh'
      ).length;
      const halfDays = attendance.filter(a => a.status === 'half-day').length * 0.5;
      const paidDays = presentDays + halfDays;
      const unpaidDays = workingDays - paidDays;

      const basicSalary = employee.salary?.basic || 0;
      const perDaySalary = basicSalary / workingDays;
      const leaveDeduction = unpaidDays * perDaySalary;
      const allowances = employee.salary?.allowances?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;
      const pf = Math.min(basicSalary * 0.12, 1800);

      const payroll = await Payroll.create({
        employee: employee._id,
        month,
        year,
        earnings: {
          basic: basicSalary,
          allowances,
        },
        deductions: {
          pf,
          leaveDeduction: Math.round(leaveDeduction),
        },
        workingDays,
        paidDays,
        unpaidDays,
        status: 'draft',
        generatedBy: req.user._id,
      });

      results.push({ employee: employee.employeeId, payrollId: payroll._id });
    } catch (error) {
      errors.push({ employee: employee.employeeId, error: error.message });
    }
  }

  res.json(
    ApiResponse.success({
      processed: results.length,
      errors: errors.length,
      results,
      errors,
    }, 'Bulk payroll generated')
  );
});

// Get employee payslip
export const getPayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email department designation');

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found');
  }

  // Format payslip data
  const payslip = {
    payrollId: payroll._id,
    employee: {
      name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      employeeId: payroll.employee.employeeId,
      email: payroll.employee.email,
      department: payroll.employee.department?.name,
      designation: payroll.employee.designation,
    },
    period: {
      month: payroll.month,
      year: payroll.year,
    },
    earnings: payroll.earnings,
    deductions: payroll.deductions,
    grossSalary: payroll.grossSalary,
    netSalary: payroll.netSalary,
    workingDays: payroll.workingDays,
    paidDays: payroll.paidDays,
    unpaidDays: payroll.unpaidDays,
    status: payroll.status,
    paidAt: payroll.paidAt,
  };

  res.json(ApiResponse.success({ payslip }));
});

// Delete payroll
export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found');
  }

  if (payroll.status === 'paid') {
    throw ApiError.badRequest('Cannot delete paid payroll');
  }

  await payroll.deleteOne();

  res.json(ApiResponse.success(null, 'Payroll deleted successfully'));
});