import Onboarding from '../models/Onboarding.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get all onboarding records
export const getAllOnboarding = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const onboarding = await Onboarding.find(query)
    .populate('employee', 'firstName lastName employeeId email department')
    .populate('mentor', 'firstName lastName employeeId')
    .populate('checklist.assignedTo', 'email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Onboarding.countDocuments(query);

  res.json(
    ApiResponse.success({
      onboarding,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  );
});

// Get onboarding by ID
export const getOnboardingById = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email')
    .populate('mentor', 'firstName lastName employeeId')
    .populate('documents.verifiedBy', 'email')
    .populate('checklist.assignedTo', 'email')
    .populate('checklist.completedBy', 'email');

  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  res.json(ApiResponse.success({ onboarding }));
});

// Create onboarding record
export const createOnboarding = asyncHandler(async (req, res) => {
  const { employee, checklist, documents, mentor, startDate } = req.body;

  // Verify employee exists
  const employeeDoc = await Employee.findById(employee);
  if (!employeeDoc) {
    throw ApiError.notFound('Employee not found');
  }

  // Check if onboarding already exists
  const existingOnboarding = await Onboarding.findOne({ employee });
  if (existingOnboarding) {
    throw ApiError.conflict('Onboarding record already exists for this employee');
  }

  const onboarding = await Onboarding.create({
    employee,
    checklist: checklist || [],
    documents: documents || [],
    mentor,
    startDate: startDate ? new Date(startDate) : new Date(),
  });

  const populatedOnboarding = await Onboarding.findById(onboarding._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('mentor', 'firstName lastName employeeId');

  res
    .status(201)
    .json(
      ApiResponse.created({ onboarding: populatedOnboarding }, 'Onboarding record created successfully')
    );
});

// Update onboarding
export const updateOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  const { status, mentor, notes } = req.body;

  if (status) {
    onboarding.status = status;
    if (status === 'completed') {
      onboarding.completedAt = new Date();
    }
  }
  if (mentor) onboarding.mentor = mentor;
  if (notes) onboarding.notes = notes;

  await onboarding.save();

  const updatedOnboarding = await Onboarding.findById(onboarding._id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('mentor', 'firstName lastName employeeId');

  res.json(ApiResponse.success({ onboarding: updatedOnboarding }, 'Onboarding updated successfully'));
});

// Update document status
export const updateDocument = asyncHandler(async (req, res) => {
  const { onboardingId, documentId } = req.params;
  const { status, notes } = req.body;

  const onboarding = await Onboarding.findById(onboardingId);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  const document = onboarding.documents.id(documentId);
  if (!document) {
    throw ApiError.notFound('Document not found');
  }

  document.status = status;
  if (notes) document.notes = notes;
  if (status === 'verified') {
    document.verifiedAt = new Date();
    document.verifiedBy = req.user._id;
  }

  await onboarding.save();

  res.json(ApiResponse.success({ document }, 'Document updated successfully'));
});

// Update checklist item
export const updateChecklistItem = asyncHandler(async (req, res) => {
  const { onboardingId, itemId } = req.params;
  const { status, notes } = req.body;

  const onboarding = await Onboarding.findById(onboardingId);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  const item = onboarding.checklist.id(itemId);
  if (!item) {
    throw ApiError.notFound('Checklist item not found');
  }

  item.status = status;
  if (notes) item.notes = notes;
  if (status === 'completed') {
    item.completedAt = new Date();
    item.completedBy = req.user._id;
  }

  await onboarding.save();

  // Check if all checklist items are completed
  const allCompleted = onboarding.checklist.every(i =>
    i.status === 'completed' || i.status === 'skipped'
  );
  if (allCompleted && onboarding.status === 'in_progress') {
    onboarding.status = 'completed';
    onboarding.completedAt = new Date();
    await onboarding.save();
  }

  res.json(ApiResponse.success({ item }, 'Checklist item updated successfully'));
});

// Add checklist item
export const addChecklistItem = asyncHandler(async (req, res) => {
  const { task, description, assignedTo, dueDate } = req.body;

  const onboarding = await Onboarding.findById(req.params.id);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  onboarding.checklist.push({
    task,
    description,
    assignedTo,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  await onboarding.save();

  res.json(ApiResponse.success({ checklist: onboarding.checklist }, 'Checklist item added'));
});

// Add document
export const addDocument = asyncHandler(async (req, res) => {
  const { type, name, url } = req.body;

  const onboarding = await Onboarding.findById(req.params.id);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  onboarding.documents.push({
    type,
    name,
    url,
    status: 'uploaded',
    uploadedAt: new Date(),
  });

  await onboarding.save();

  res.json(ApiResponse.success({ documents: onboarding.documents }, 'Document added'));
});

// Delete onboarding
export const deleteOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);

  if (!onboarding) {
    throw ApiError.notFound('Onboarding record not found');
  }

  await onboarding.deleteOne();

  res.json(ApiResponse.success(null, 'Onboarding record deleted'));
});