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
  body('status').optional().isIn(['present', 'absent', 'half-day', 'wfh']),
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

// Routes
router.get('/', protect, getAllAttendance);
router.get('/monthly-report', protect, authorize('admin', 'hr'), monthlyReportValidation, getMonthlyReport);
router.get('/employee/:employeeId/summary', protect, param('employeeId').isMongoId(), validate, getEmployeeSummary);
router.get('/:id', protect, param('id').isMongoId(), validate, getAttendanceById);
router.post('/', protect, authorize('admin', 'hr'), markValidation, markAttendance);
router.post('/bulk', protect, authorize('admin', 'hr'), bulkMarkAttendance);
router.put('/:id', protect, authorize('admin', 'hr'), updateValidation, updateAttendance);
router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteAttendance);

export default router;