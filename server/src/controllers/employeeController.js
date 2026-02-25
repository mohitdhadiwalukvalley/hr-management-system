import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    department,
    status,
    employmentType,
    sortBy = 'firstName',
    sortOrder = 'asc',
  } = req.query;

  const query = {};

  // Search filter
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  // Department filter
  if (department) {
    query.department = department;
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // Employment type filter
  if (employmentType) {
    query.employmentType = employmentType;
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const employees = await Employee.find(query)
    .populate('department', 'name code')
    .populate('reportingManager', 'firstName lastName employeeId')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Employee.countDocuments(query);

  res.json(
    ApiResponse.success({
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code leavePolicies')
    .populate('reportingManager', 'firstName lastName employeeId email')
    .populate('userId', 'email role');

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  res.json(ApiResponse.success({ employee }));
});

export const createEmployee = asyncHandler(async (req, res) => {
  const {
    employeeId,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    department,
    designation,
    dateOfJoining,
    employmentType,
    salary,
    bankDetails,
    reportingManager,
    emergencyContact,
    employmentHistory,
  } = req.body;

  // Check if employee with same employeeId or email exists
  const existingEmployee = await Employee.findOne({
    $or: [{ employeeId: employeeId.toUpperCase() }, { email: email.toLowerCase() }],
  });

  if (existingEmployee) {
    throw ApiError.conflict('Employee with this ID or email already exists');
  }

  // Verify department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw ApiError.badRequest('Department not found');
  }

  // Create employee
  const employee = await Employee.create({
    employeeId: employeeId.toUpperCase(),
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    dateOfBirth,
    gender,
    address,
    department,
    designation,
    dateOfJoining,
    employmentType: employmentType || 'full-time',
    salary,
    bankDetails,
    reportingManager,
    emergencyContact,
    employmentHistory,
  });

  // Create user account for the employee
  const user = await User.create({
    email: email.toLowerCase(),
    password: 'changeme123', // Default password, should be changed on first login
    role: 'employee',
    employeeId: employee._id,
  });

  // Link user to employee
  employee.userId = user._id;
  await employee.save();

  const populatedEmployee = await Employee.findById(employee._id)
    .populate('department', 'name code')
    .populate('reportingManager', 'firstName lastName employeeId');

  res
    .status(201)
    .json(
      ApiResponse.created({ employee: populatedEmployee }, 'Employee created successfully')
    );
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Check for duplicate email if email is being updated
  if (req.body.email && req.body.email !== employee.email) {
    const existingEmployee = await Employee.findOne({
      email: req.body.email.toLowerCase(),
      _id: { $ne: employee._id },
    });
    if (existingEmployee) {
      throw ApiError.conflict('Email already in use');
    }
  }

  // Update allowed fields
  const updateFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
    'address', 'designation', 'dateOfLeaving', 'employmentType',
    'salary', 'bankDetails', 'reportingManager', 'emergencyContact',
    'employmentHistory', 'documents'
  ];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      employee[field] = req.body[field];
    }
  });

  // Update email if provided
  if (req.body.email) {
    employee.email = req.body.email.toLowerCase();
    // Also update user email
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { email: req.body.email.toLowerCase() });
    }
  }

  // Update department if provided
  if (req.body.department) {
    const departmentExists = await Department.findById(req.body.department);
    if (!departmentExists) {
      throw ApiError.badRequest('Department not found');
    }
    employee.department = req.body.department;
  }

  await employee.save();

  const updatedEmployee = await Employee.findById(employee._id)
    .populate('department', 'name code')
    .populate('reportingManager', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ employee: updatedEmployee }, 'Employee updated successfully'));
});

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  employee.status = status;
  if (status === 'terminated') {
    employee.dateOfLeaving = new Date();
    // Deactivate user account
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }
  }

  await employee.save();

  res.json(ApiResponse.success({ employee }, 'Employee status updated successfully'));
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Soft delete by changing status
  employee.status = 'terminated';
  employee.dateOfLeaving = new Date();

  // Deactivate user account
  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, { isActive: false });
  }

  await employee.save();

  res.json(ApiResponse.success(null, 'Employee deactivated successfully'));
});

export const getEmployeeStats = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments({ status: 'active' });
  const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
  const terminatedEmployees = await Employee.countDocuments({ status: 'terminated' });

  const departmentStats = await Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    { $project: { department: '$department.name', count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const employmentTypeStats = await Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$employmentType', count: { $sum: 1 } } },
  ]);

  res.json(
    ApiResponse.success({
      totalEmployees,
      inactiveEmployees,
      terminatedEmployees,
      departmentStats,
      employmentTypeStats,
    })
  );
});