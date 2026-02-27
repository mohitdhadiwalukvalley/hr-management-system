import { Router } from 'express';
import { query } from 'express-validator';
import {
  getDashboardReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeReport,
  getDepartmentReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All report routes require authentication
router.use(protect);

// Dashboard summary
router.get('/dashboard', getDashboardReport);

// Attendance report
router.get('/attendance', [
  query('month').isInt({ min: 1, max: 12 }),
  query('year').isInt({ min: 2020, max: 2100 }),
  validate
], getAttendanceReport);

// Leave report
router.get('/leaves', [
  query('year').optional().isInt({ min: 2020, max: 2100 }),
  validate
], getLeaveReport);

// Payroll report (Admin/HR only)
router.get('/payroll', authorize('admin', 'hr'), [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 }),
  validate
], getPayrollReport);

// Employee report (Admin/HR only)
router.get('/employees', authorize('admin', 'hr'), getEmployeeReport);

// Department report
router.get('/departments', getDepartmentReport);

export default router;