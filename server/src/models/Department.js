import mongoose from 'mongoose';

const leavePolicySchema = new mongoose.Schema({
  casual: {
    type: Number,
    default: 12,
    min: 0,
  },
  sick: {
    type: Number,
    default: 6,
    min: 0,
  },
  earned: {
    type: Number,
    default: 15,
    min: 0,
  },
});

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    leavePolicies: {
      type: leavePolicySchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });

const Department = mongoose.model('Department', departmentSchema);

export default Department;