import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get all leaves with filters
export const getAllLeaves = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    employee,
    status,
    leaveType,
    startDate,
    endDate,
    department,
  } = req.query;

  const query = {};

  if (employee) query.employee = employee;
  if (status) query.status = status;
  if (leaveType) query.leaveType = leaveType;

  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  let leavesQuery = Leave.find(query)
    .populate('employee', 'firstName lastName employeeId department')
    .populate('approvedBy', 'firstName lastName employeeId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Filter by department
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    const employeeIds = employees.map(e => e._id);
    query.employee = { $in: employeeIds };
    leavesQuery = Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  }

  const leaves = await leavesQuery;
  const total = await Leave.countDocuments(query);

  res.json(
    ApiResponse.success({
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get leave by ID
export const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email')
    .populate('approvedBy', 'firstName lastName employeeId');

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  res.json(ApiResponse.success({ leave }));
});

// Apply for leave
export const applyLeave = asyncHandler(async (req, res) => {
  const { employee, leaveType, startDate, endDate, reason, halfDay, halfDayType, attachment } = req.body;

  // Verify employee exists
  const employeeDoc = await Employee.findById(employee);
  if (!employeeDoc) {
    throw ApiError.notFound('Employee not found');
  }

  // Calculate days
  const days = Leave.calculateDays(startDate, endDate, halfDay);

  // Check if dates are valid
  if (new Date(startDate) > new Date(endDate)) {
    throw ApiError.badRequest('Start date cannot be after end date');
  }

  // Check for overlapping leaves
  const overlappingLeave = await Leave.findOne({
    employee,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });

  if (overlappingLeave) {
    throw ApiError.conflict('You already have a leave request for these dates');
  }

  // Check leave balance
  const balance = await getLeaveBalanceForEmployee(employee, leaveType);
  if (balance.available < days) {
    throw ApiError.badRequest(`Insufficient ${leaveType} leave balance. Available: ${balance.available}`);
  }

  const leave = await Leave.create({
    employee,
    leaveType,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    days,
    reason,
    halfDay: halfDay || false,
    halfDayType,
    attachment,
  });

  const populatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId');

  res
    .status(201)
    .json(
      ApiResponse.created({ leave: populatedLeave }, 'Leave request submitted successfully')
    );
});

// Update leave (before approval)
export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Can only update pending leave requests');
  }

  const { leaveType, startDate, endDate, reason, halfDay, halfDayType, attachment } = req.body;

  if (leaveType) leave.leaveType = leaveType;
  if (startDate) leave.startDate = new Date(startDate);
  if (endDate) leave.endDate = new Date(endDate);
  if (reason) leave.reason = reason;
  if (halfDay !== undefined) leave.halfDay = halfDay;
  if (halfDayType) leave.halfDayType = halfDayType;
  if (attachment) leave.attachment = attachment;

  // Recalculate days
  if (startDate || endDate) {
    leave.days = Leave.calculateDays(leave.startDate, leave.endDate, leave.halfDay);
  }

  await leave.save();

  const updatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ leave: updatedLeave }, 'Leave request updated successfully'));
});

// Approve leave
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee');

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Leave request is not pending');
  }

  // Check leave balance again
  const balance = await getLeaveBalanceForEmployee(leave.employee._id, leave.leaveType);
  if (balance.available < leave.days) {
    throw ApiError.badRequest(`Insufficient ${leave.leaveType} leave balance`);
  }

  leave.status = 'approved';
  leave.approvedBy = req.user.employeeId; // Assuming user has employeeId reference
  leave.approvedAt = new Date();

  await leave.save();

  const updatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('approvedBy', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ leave: updatedLeave }, 'Leave approved successfully'));
});

// Reject leave
export const rejectLeave = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Leave request is not pending');
  }

  leave.status = 'rejected';
  leave.approvedBy = req.user.employeeId;
  leave.approvedAt = new Date();
  leave.rejectionReason = rejectionReason;

  await leave.save();

  const updatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('approvedBy', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ leave: updatedLeave }, 'Leave rejected'));
});

// Cancel leave
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status === 'rejected' || leave.status === 'cancelled') {
    throw ApiError.badRequest('Cannot cancel this leave request');
  }

  leave.status = 'cancelled';
  leave.cancelledAt = new Date();
  leave.cancelledBy = req.user._id;

  await leave.save();

  res.json(ApiResponse.success(null, 'Leave cancelled successfully'));
});

// Helper function to get leave balance
async function getLeaveBalanceForEmployee(employeeId, leaveType) {
  const employee = await Employee.findById(employeeId).populate('department');
  if (!employee || !employee.department) {
    return { total: 0, used: 0, available: 0 };
  }

  const leavePolicy = employee.department.leavePolicies || { casual: 12, sick: 6, earned: 15 };
  const totalDays = leavePolicy[leaveType] || 0;

  // Calculate used days for current year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const endOfYear = new Date(new Date().getFullYear(), 11, 31);

  const usedLeaves = await Leave.aggregate([
    {
      $match: {
        employee: employee._id,
        status: 'approved',
        leaveType,
        startDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: '$days' },
      },
    },
  ]);

  const usedDays = usedLeaves[0]?.totalDays || 0;

  return {
    total: totalDays,
    used: usedDays,
    available: totalDays - usedDays,
  };
}

// Get leave balance for employee
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findById(employeeId).populate('department');
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const balances = {
    casual: await getLeaveBalanceForEmployee(employeeId, 'casual'),
    sick: await getLeaveBalanceForEmployee(employeeId, 'sick'),
    earned: await getLeaveBalanceForEmployee(employeeId, 'earned'),
  };

  res.json(ApiResponse.success({ balances }));
});

// Get my leaves (for current user)
export const getMyLeaves = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const { page = 1, limit = 20, status } = req.query;

  const query = { employee: employee._id };
  if (status) query.status = status;

  const leaves = await Leave.find(query)
    .populate('approvedBy', 'firstName lastName employeeId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Leave.countDocuments(query);

  res.json(
    ApiResponse.success({
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Delete leave
export const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw ApiError.badRequest('Can only delete pending leave requests');
  }

  await leave.deleteOne();

  res.json(ApiResponse.success(null, 'Leave request deleted'));
});