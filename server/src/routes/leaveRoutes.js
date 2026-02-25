import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllLeaves,
  getLeaveById,
  applyLeave,
  updateLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveBalance,
  getMyLeaves,
  deleteLeave,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const applyValidation = [
  body('employee').isMongoId().withMessage('Valid employee ID is required'),
  body('leaveType').isIn(['casual', 'sick', 'earned']).withMessage('Valid leave type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('halfDay').optional().isBoolean(),
  body('halfDayType').optional().isIn(['first_half', 'second_half']),
  validate,
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid leave ID'),
  body('leaveType').optional().isIn(['casual', 'sick', 'earned']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('reason').optional().trim().notEmpty(),
  body('halfDay').optional().isBoolean(),
  validate,
];

const rejectValidation = [
  param('id').isMongoId().withMessage('Invalid leave ID'),
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required'),
  validate,
];

// Routes
router.get('/', protect, getAllLeaves);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/balance/:employeeId', protect, param('employeeId').isMongoId(), validate, getLeaveBalance);
router.get('/:id', protect, param('id').isMongoId(), validate, getLeaveById);

router.post('/', protect, applyValidation, applyLeave);
router.put('/:id', protect, updateValidation, updateLeave);

router.patch('/:id/approve', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, approveLeave);
router.patch('/:id/reject', protect, authorize('admin', 'hr'), rejectValidation, rejectLeave);
router.patch('/:id/cancel', protect, param('id').isMongoId(), validate, cancelLeave);

router.delete('/:id', protect, param('id').isMongoId(), validate, deleteLeave);

export default router;