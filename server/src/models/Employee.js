import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  basic: {
    type: Number,
    required: true,
    min: 0,
  },
  allowances: [
    {
      name: String,
      amount: Number,
    },
  ],
  deductions: [
    {
      name: String,
      amount: Number,
    },
  ],
});

const bankDetailsSchema = new mongoose.Schema({
  accountNo: {
    type: String,
    required: true,
  },
  ifsc: {
    type: String,
    required: true,
    uppercase: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  branchName: String,
});

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['id_proof', 'address_proof', 'education', 'experience', 'other'],
  },
  name: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const employmentHistorySchema = new mongoose.Schema({
  company: String,
  designation: String,
  startDate: Date,
  endDate: Date,
  reasonForLeaving: String,
});

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required'],
    },
    dateOfLeaving: {
      type: Date,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract'],
      default: 'full-time',
    },
    salary: {
      type: salarySchema,
      default: () => ({ basic: 0, allowances: [], deductions: [] }),
    },
    bankDetails: {
      type: bankDetailsSchema,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    documents: [documentSchema],
    employmentHistory: [employmentHistorySchema],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;