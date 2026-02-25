import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get all attendance records with filters
export const getAllAttendance = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    employee,
    startDate,
    endDate,
    status,
    department,
  } = req.query;

  const query = {};

  if (employee) query.employee = employee;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  let attendanceQuery = Attendance.find(query)
    .populate('employee', 'firstName lastName employeeId department')
    .populate('markedBy', 'email')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Filter by department
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    const employeeIds = employees.map(e => e._id);
    query.employee = { $in: employeeIds };
    attendanceQuery = Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('markedBy', 'email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  }

  const attendance = await attendanceQuery;
  const total = await Attendance.countDocuments(query);

  res.json(
    ApiResponse.success({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get attendance by ID
export const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email')
    .populate('markedBy', 'email');

  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }

  res.json(ApiResponse.success({ attendance }));
});

// Mark attendance
export const markAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, checkIn, checkOut, notes, isLate, lateMinutes } = req.body;

  // Verify employee exists
  const employeeDoc = await Employee.findById(employee);
  if (!employeeDoc) {
    throw ApiError.notFound('Employee not found');
  }

  // Check if attendance already exists for this date
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const existingAttendance = await Attendance.findOne({
    employee,
    date: {
      $gte: attendanceDate,
      $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (existingAttendance) {
    throw ApiError.conflict('Attendance already marked for this date');
  }

  // Create attendance record
  const attendance = new Attendance({
    employee,
    date: attendanceDate,
    status,
    checkIn: checkIn ? new Date(checkIn) : undefined,
    checkOut: checkOut ? new Date(checkOut) : undefined,
    notes,
    isLate: isLate || false,
    lateMinutes: lateMinutes || 0,
    markedBy: req.user._id,
  });

  // Calculate work hours
  if (attendance.checkIn && attendance.checkOut) {
    attendance.calculateWorkHours();
  }

  await attendance.save();

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('markedBy', 'email');

  res
    .status(201)
    .json(
      ApiResponse.created({ attendance: populatedAttendance }, 'Attendance marked successfully')
    );
});

// Update attendance
export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }

  const { status, checkIn, checkOut, notes, isLate, lateMinutes, earlyDeparture, earlyMinutes, overtime } = req.body;

  if (status) attendance.status = status;
  if (checkIn !== undefined) attendance.checkIn = checkIn ? new Date(checkIn) : null;
  if (checkOut !== undefined) attendance.checkOut = checkOut ? new Date(checkOut) : null;
  if (notes !== undefined) attendance.notes = notes;
  if (isLate !== undefined) attendance.isLate = isLate;
  if (lateMinutes !== undefined) attendance.lateMinutes = lateMinutes;
  if (earlyDeparture !== undefined) attendance.earlyDeparture = earlyDeparture;
  if (earlyMinutes !== undefined) attendance.earlyMinutes = earlyMinutes;
  if (overtime !== undefined) attendance.overtime = overtime;

  // Recalculate work hours
  if (attendance.checkIn && attendance.checkOut) {
    attendance.calculateWorkHours();
  }

  await attendance.save();

  const updatedAttendance = await Attendance.findById(attendance._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('markedBy', 'email');

  res.json(ApiResponse.success({ attendance: updatedAttendance }, 'Attendance updated successfully'));
});

// Bulk mark attendance
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    throw ApiError.badRequest('Records array is required');
  }

  const results = [];
  const errors = [];

  for (const record of records) {
    try {
      const { employee, date, status, checkIn, checkOut, notes } = record;

      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Check if already exists
      const existing = await Attendance.findOne({
        employee,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (existing) {
        // Update existing
        existing.status = status;
        if (checkIn) existing.checkIn = new Date(checkIn);
        if (checkOut) existing.checkOut = new Date(checkOut);
        if (notes) existing.notes = notes;
        existing.markedBy = req.user._id;
        if (existing.checkIn && existing.checkOut) existing.calculateWorkHours();
        await existing.save();
        results.push({ employee, date, status: 'updated' });
      } else {
        // Create new
        const attendance = new Attendance({
          employee,
          date: attendanceDate,
          status,
          checkIn: checkIn ? new Date(checkIn) : undefined,
          checkOut: checkOut ? new Date(checkOut) : undefined,
          notes,
          markedBy: req.user._id,
        });
        if (attendance.checkIn && attendance.checkOut) attendance.calculateWorkHours();
        await attendance.save();
        results.push({ employee, date, status: 'created' });
      }
    } catch (error) {
      errors.push({ record, error: error.message });
    }
  }

  res.json(
    ApiResponse.success({
      processed: results.length,
      errors: errors.length,
      results,
      errors,
    }, 'Bulk attendance processed')
  );
});

// Get monthly attendance report
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year, employee, department } = req.query;

  if (!month || !year) {
    throw ApiError.badRequest('Month and year are required');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const query = {
    date: { $gte: startDate, $lte: endDate },
  };

  if (employee) query.employee = employee;

  // If department filter, get employees in that department
  if (department) {
    const employees = await Employee.find({ department, status: 'active' }).select('_id');
    query.employee = { $in: employees.map(e => e._id) };
  }

  const attendance = await Attendance.find(query)
    .populate('employee', 'firstName lastName employeeId department')
    .sort({ date: 1 });

  // Calculate summary
  const summary = {
    totalDays: endDate.getDate(),
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    wfh: attendance.filter(a => a.status === 'wfh').length,
    lateArrivals: attendance.filter(a => a.isLate).length,
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
  };

  res.json(
    ApiResponse.success({
      month: parseInt(month),
      year: parseInt(year),
      attendance,
      summary,
    })
  );
});

// Get employee attendance summary
export const getEmployeeSummary = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { month, year } = req.query;

  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const attendance = await Attendance.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const summary = {
    month: targetMonth + 1,
    year: targetYear,
    totalDays: endDate.getDate(),
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    wfh: attendance.filter(a => a.status === 'wfh').length,
    lateArrivals: attendance.filter(a => a.isLate).length,
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
    averageWorkHours: attendance.length > 0
      ? (attendance.reduce((sum, a) => sum + (a.workHours || 0), 0) / attendance.length).toFixed(2)
      : 0,
  };

  res.json(ApiResponse.success({ attendance, summary }));
});

// Delete attendance record
export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw ApiError.notFound('Attendance record not found');
  }

  await attendance.deleteOne();

  res.json(ApiResponse.success(null, 'Attendance record deleted successfully'));
});