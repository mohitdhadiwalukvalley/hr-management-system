import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper to get employee from user
const getEmployeeFromUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.employeeId) {
    return null;
  }
  return await Employee.findById(user.employeeId);
};

// Helper to get or create today's attendance record
const getOrCreateTodayRecord = async (employeeId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    attendance = new Attendance({
      employee: employeeId,
      date: today,
      status: 'pending',
      currentState: 'not_checked_in',
      workSessions: [],
      personalBreaks: [],
    });
  }

  return attendance;
};

// ============ Employee Self-Service Endpoints ============

// Check in (start work)
export const checkIn = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState === 'working') {
    throw ApiError.badRequest('Already checked in. Please check out first.');
  }

  if (attendance.currentState === 'checked_out') {
    throw ApiError.badRequest('Already checked out for today.');
  }

  // Start a new work session
  const session = { checkIn: now, duration: 0 };
  attendance.workSessions.push(session);

  // Update state
  attendance.currentState = 'working';
  attendance.status = 'working';

  // Update legacy checkIn field for first session
  if (attendance.workSessions.length === 1) {
    attendance.checkIn = now;
  }

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Checked in successfully',
    })
  );
});

// Check out (end work)
export const checkOut = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState === 'not_checked_in') {
    throw ApiError.badRequest('Not checked in yet.');
  }

  if (attendance.currentState === 'checked_out') {
    throw ApiError.badRequest('Already checked out for today.');
  }

  if (attendance.currentState === 'lunch_break') {
    throw ApiError.badRequest('Please end your lunch break before checking out.');
  }

  if (attendance.currentState === 'personal_break') {
    throw ApiError.badRequest('Please end your personal break before checking out.');
  }

  // End the current work session
  const currentSession = attendance.workSessions[attendance.workSessions.length - 1];
  if (currentSession && !currentSession.checkOut) {
    currentSession.checkOut = now;
  }

  // Update state
  attendance.currentState = 'checked_out';
  attendance.status = 'present';
  attendance.checkOut = now;

  // Calculate totals
  attendance.calculateTotals();

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Checked out successfully',
    })
  );
});

// Start lunch break
export const startLunch = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState !== 'working') {
    throw ApiError.badRequest('Can only start lunch break while working.');
  }

  // Pause current work session
  const currentSession = attendance.workSessions[attendance.workSessions.length - 1];
  if (currentSession && !currentSession.checkOut) {
    currentSession.checkOut = now;
  }

  // Start lunch break
  attendance.lunchBreak = { start: now };
  attendance.currentState = 'lunch_break';

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Lunch break started',
    })
  );
});

// End lunch break
export const endLunch = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState !== 'lunch_break') {
    throw ApiError.badRequest('Not on lunch break.');
  }

  // End lunch break
  attendance.lunchBreak.end = now;
  if (attendance.lunchBreak.start) {
    attendance.lunchBreak.duration = Math.round((now - attendance.lunchBreak.start) / (1000 * 60));
  }

  // Resume work with new session
  attendance.workSessions.push({ checkIn: now, duration: 0 });
  attendance.currentState = 'working';

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Lunch break ended',
    })
  );
});

// Start personal break
export const startBreak = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const { reason } = req.body;
  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState !== 'working') {
    throw ApiError.badRequest('Can only start personal break while working.');
  }

  // Pause current work session
  const currentSession = attendance.workSessions[attendance.workSessions.length - 1];
  if (currentSession && !currentSession.checkOut) {
    currentSession.checkOut = now;
  }

  // Start personal break
  attendance.personalBreaks.push({ out: now, reason, duration: 0 });
  attendance.currentState = 'personal_break';

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Personal break started',
    })
  );
});

// End personal break
export const endBreak = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const attendance = await getOrCreateTodayRecord(employee._id);
  const now = new Date();

  if (attendance.currentState !== 'personal_break') {
    throw ApiError.badRequest('Not on personal break.');
  }

  // End current personal break
  const currentBreak = attendance.personalBreaks[attendance.personalBreaks.length - 1];
  if (currentBreak && !currentBreak.in) {
    currentBreak.in = now;
    currentBreak.duration = Math.round((now - currentBreak.out) / (1000 * 60));
  }

  // Resume work with new session
  attendance.workSessions.push({ checkIn: now, duration: 0 });
  attendance.currentState = 'working';

  await attendance.save();

  res.json(
    ApiResponse.success({
      attendance,
      message: 'Personal break ended',
    })
  );
});

// Get my current attendance status
export const getMyStatus = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  res.json(
    ApiResponse.success({
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
      },
      attendance: attendance || {
        currentState: 'not_checked_in',
        status: 'pending',
        workSessions: [],
        personalBreaks: [],
        totalWorkingMinutes: 0,
        totalBreakMinutes: 0,
      },
    })
  );
});

// Get my attendance history
export const getMyHistory = asyncHandler(async (req, res) => {
  const employee = await getEmployeeFromUser(req.user._id);
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  const { page = 1, limit = 30, month, year } = req.query;

  let startDate, endDate;
  if (month && year) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    // Default to last 30 days
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  const attendance = await Attendance.find({
    employee: employee._id,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate('employee', 'firstName lastName employeeId department')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments({
    employee: employee._id,
    date: { $gte: startDate, $lte: endDate },
  });

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

// ============ Admin/HR Endpoints ============

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