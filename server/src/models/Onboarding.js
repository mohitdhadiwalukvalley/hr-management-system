import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['id_proof', 'address_proof', 'education', 'experience', 'offer_letter', 'nda', 'other'],
  },
  name: {
    type: String,
    required: true,
  },
  url: String,
  status: {
    type: String,
    enum: ['pending', 'uploaded', 'verified', 'rejected'],
    default: 'pending',
  },
  uploadedAt: Date,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
});

const checklistItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  description: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    default: 'pending',
  },
  dueDate: Date,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
});

const onboardingSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
      unique: true,
    },
    documents: [documentSchema],
    checklist: [checklistItemSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'on_hold'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    notes: String,
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
onboardingSchema.index({ employee: 1 });
onboardingSchema.index({ status: 1 });

const Onboarding = mongoose.model('Onboarding', onboardingSchema);

export default Onboarding;