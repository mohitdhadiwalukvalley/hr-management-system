import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
} from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('description').optional().trim(),
  body('manager').optional().isMongoId().withMessage('Invalid manager ID'),
  body('leavePolicies.casual').optional().isInt({ min: 0 }),
  body('leavePolicies.sick').optional().isInt({ min: 0 }),
  body('leavePolicies.earned').optional().isInt({ min: 0 }),
  validate,
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid department ID'),
  body('name').optional().trim().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('manager').optional().isMongoId().withMessage('Invalid manager ID'),
  body('isActive').optional().isBoolean(),
  validate,
];

// Routes
router.get('/', protect, getAllDepartments);
router.get('/:id', protect, param('id').isMongoId(), validate, getDepartmentById);
router.get('/:id/employees', protect, param('id').isMongoId(), validate, getDepartmentEmployees);
router.post('/', protect, authorize('admin', 'hr'), createValidation, createDepartment);
router.put('/:id', protect, authorize('admin', 'hr'), updateValidation, updateDepartment);
router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteDepartment);

export default router;