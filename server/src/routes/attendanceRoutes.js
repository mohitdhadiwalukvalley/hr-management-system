import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllAttendance,
  getAttendanceById,
  markAttendance,
  updateAttendance,
  bulkMarkAttendance,
  getMonthlyReport,
  getEmployeeSummary,
  deleteAttendance,
  // Employee self-service
  checkIn,
  checkOut,
  startLunch,
  endLunch,
  startBreak,
  endBreak,
  getMyStatus,
  getMyHistory,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const markValidation = [
  body('employee').isMongoId().withMessage('Valid employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'half-day', 'wfh']).withMessage('Valid status is required'),
  body('checkIn').optional().isISO8601(),
  body('checkOut').optional().isISO8601(),
  body('notes').optional().trim(),
  validate,
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid attendance ID'),
  body('status').optional().isIn(['present', 'absent', 'half-day', 'wfh', 'pending', 'working', 'on_break', 'checked_out']),
  body('checkIn').optional().isISO8601(),
  body('checkOut').optional().isISO8601(),
  body('notes').optional().trim(),
  validate,
];

const monthlyReportValidation = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year is required'),
  validate,
];

// ============ Employee Self-Service Routes (all authenticated users) ============
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.post('/lunch-start', protect, startLunch);
router.post('/lunch-end', protect, endLunch);
router.post('/break-start', protect, [body('reason').optional().trim(), validate], startBreak);
router.post('/break-end', protect, endBreak);
router.get('/my-status', protect, getMyStatus);
router.get('/my-history', protect, getMyHistory);

// ============ Admin/HR Routes ============
router.get('/', protect, authorize('admin', 'hr'), getAllAttendance);
router.get('/monthly-report', protect, authorize('admin', 'hr'), monthlyReportValidation, getMonthlyReport);
router.get('/employee/:employeeId/summary', protect, authorize('admin', 'hr'), param('employeeId').isMongoId(), validate, getEmployeeSummary);
router.get('/:id', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, getAttendanceById);
router.post('/', protect, authorize('admin', 'hr'), markValidation, markAttendance);
router.post('/bulk', protect, authorize('admin', 'hr'), bulkMarkAttendance);
router.put('/:id', protect, authorize('admin', 'hr'), updateValidation, updateAttendance);
router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteAttendance);

export default router;