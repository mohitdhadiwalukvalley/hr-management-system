import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const createValidation = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').isMongoId().withMessage('Valid department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('dateOfJoining').isISO8601().withMessage('Valid date of joining is required'),
  body('employmentType').optional().isIn(['full-time', 'part-time', 'contract']),
  body('salary.basic').optional().isFloat({ min: 0 }),
  validate,
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('department').optional().isMongoId(),
  body('designation').optional().trim().notEmpty(),
  validate,
];

const statusValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID'),
  body('status').isIn(['active', 'inactive', 'terminated']).withMessage('Valid status is required'),
  validate,
];

// Routes
router.get('/stats', protect, authorize('admin', 'hr'), getEmployeeStats);
router.get('/', protect, getAllEmployees);
router.get('/:id', protect, param('id').isMongoId(), validate, getEmployeeById);
router.post('/', protect, authorize('admin', 'hr'), createValidation, createEmployee);
router.put('/:id', protect, authorize('admin', 'hr'), updateValidation, updateEmployee);
router.patch('/:id/status', protect, authorize('admin', 'hr'), statusValidation, updateEmployeeStatus);
router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteEmployee);

export default router;