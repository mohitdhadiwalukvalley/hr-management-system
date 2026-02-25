import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllPayroll,
  getPayrollById,
  generatePayroll,
  updatePayroll,
  updatePayrollStatus,
  generateBulkPayroll,
  getPayslip,
  deletePayroll,
} from '../controllers/payrollController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const generateValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year is required'),
  validate,
];

const bulkGenerateValidation = [
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2020, max: 2100 }),
  validate,
];

const statusValidation = [
  param('id').isMongoId().withMessage('Invalid payroll ID'),
  body('status').isIn(['draft', 'pending', 'processed', 'paid']).withMessage('Valid status is required'),
  body('paymentRef').optional().trim(),
  body('paymentMethod').optional().isIn(['bank_transfer', 'cheque', 'cash']),
  validate,
];

// Routes
router.get('/', protect, authorize('admin', 'hr'), getAllPayroll);
router.get('/:id', protect, param('id').isMongoId(), validate, getPayrollById);
router.get('/:id/payslip', protect, param('id').isMongoId(), validate, getPayslip);

router.post('/generate', protect, authorize('admin', 'hr'), generateValidation, generatePayroll);
router.post('/generate-bulk', protect, authorize('admin', 'hr'), bulkGenerateValidation, generateBulkPayroll);

router.put('/:id', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, updatePayroll);
router.patch('/:id/status', protect, authorize('admin', 'hr'), statusValidation, updatePayrollStatus);

router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deletePayroll);

export default router;