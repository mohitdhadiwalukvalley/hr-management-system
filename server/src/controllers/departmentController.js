import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAllDepartments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const departments = await Department.find(query)
    .populate('manager', 'firstName lastName employeeId')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Department.countDocuments(query);

  res.json(
    ApiResponse.success({
      departments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate(
    'manager',
    'firstName lastName employeeId email'
  );

  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  res.json(ApiResponse.success({ department }));
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, manager, leavePolicies } = req.body;

  // Check if department with same name or code exists
  const existingDepartment = await Department.findOne({
    $or: [{ name: name.toLowerCase() }, { code: code.toUpperCase() }],
  });

  if (existingDepartment) {
    throw ApiError.conflict('Department with this name or code already exists');
  }

  const department = await Department.create({
    name,
    code,
    description,
    manager,
    leavePolicies,
  });

  const populatedDepartment = await Department.findById(department._id).populate(
    'manager',
    'firstName lastName employeeId'
  );

  res
    .status(201)
    .json(
      ApiResponse.created({ department: populatedDepartment }, 'Department created successfully')
    );
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, manager, leavePolicies, isActive } = req.body;

  const department = await Department.findById(req.params.id);

  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  // Check for duplicate name/code if being updated
  if (name || code) {
    const query = {
      _id: { $ne: department._id },
      $or: [],
    };
    if (name) query.$or.push({ name: name.toLowerCase() });
    if (code) query.$or.push({ code: code.toUpperCase() });

    const existingDepartment = await Department.findOne(query);
    if (existingDepartment) {
      throw ApiError.conflict('Department with this name or code already exists');
    }
  }

  // Update fields
  if (name) department.name = name;
  if (code) department.code = code.toUpperCase();
  if (description !== undefined) department.description = description;
  if (manager !== undefined) department.manager = manager;
  if (leavePolicies) department.leavePolicies = leavePolicies;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  const updatedDepartment = await Department.findById(department._id).populate(
    'manager',
    'firstName lastName employeeId'
  );

  res.json(ApiResponse.success({ department: updatedDepartment }, 'Department updated successfully'));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  // Soft delete by setting isActive to false
  department.isActive = false;
  await department.save();

  res.json(ApiResponse.success(null, 'Department deactivated successfully'));
});

export const getDepartmentEmployees = asyncHandler(async (req, res) => {
  const Employee = (await import('../models/Employee.js')).default;

  const department = await Department.findById(req.params.id);

  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  const employees = await Employee.find({ department: req.params.id, status: 'active' })
    .select('employeeId firstName lastName email designation')
    .sort({ firstName: 1 });

  res.json(ApiResponse.success({ employees }));
});