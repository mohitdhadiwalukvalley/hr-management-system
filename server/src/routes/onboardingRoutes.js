import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllOnboarding,
  getOnboardingById,
  createOnboarding,
  updateOnboarding,
  updateDocument,
  updateChecklistItem,
  addChecklistItem,
  addDocument,
  deleteOnboarding,
} from '../controllers/onboardingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Validation rules
const createValidation = [
  body('employee').isMongoId().withMessage('Valid employee ID is required'),
  body('checklist').optional().isArray(),
  body('documents').optional().isArray(),
  body('mentor').optional().isMongoId(),
  validate,
];

const checklistValidation = [
  body('task').trim().notEmpty().withMessage('Task is required'),
  body('description').optional().trim(),
  body('assignedTo').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  validate,
];

// Routes
router.get('/', protect, authorize('admin', 'hr'), getAllOnboarding);
router.get('/:id', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, getOnboardingById);
router.post('/', protect, authorize('admin', 'hr'), createValidation, createOnboarding);
router.put('/:id', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, updateOnboarding);

// Document routes
router.post('/:id/documents', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, addDocument);
router.patch(
  '/:onboardingId/documents/:documentId',
  protect,
  authorize('admin', 'hr'),
  param('onboardingId').isMongoId(),
  param('documentId').isMongoId(),
  validate,
  updateDocument
);

// Checklist routes
router.post('/:id/checklist', protect, authorize('admin', 'hr'), param('id').isMongoId(), validate, addChecklistItem);
router.patch(
  '/:onboardingId/checklist/:itemId',
  protect,
  authorize('admin', 'hr'),
  param('onboardingId').isMongoId(),
  param('itemId').isMongoId(),
  validate,
  updateChecklistItem
);

router.delete('/:id', protect, authorize('admin'), param('id').isMongoId(), validate, deleteOnboarding);

export default router;