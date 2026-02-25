import mongoose from 'mongoose';

const earningsSchema = new mongoose.Schema({
  basic: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  reimbursement: { type: Number, default: 0 },
});

const deductionsSchema = new mongoose.Schema({
  tax: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  insurance: { type: Number, default: 0 },
  leaveDeduction: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
});

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    earnings: {
      type: earningsSchema,
      default: () => ({}),
    },
    deductions: {
      type: deductionsSchema,
      default: () => ({}),
    },
    grossSalary: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'processed', 'paid'],
      default: 'draft',
    },
    paidAt: Date,
    paymentRef: String,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash'],
    },
    workingDays: {
      type: Number,
      default: 22,
    },
    paidDays: {
      type: Number,
      default: 22,
    },
    unpaidDays: {
      type: Number,
      default: 0,
    },
    notes: String,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique payroll per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre('save', function (next) {
  const earnings = this.earnings || {};
  const deductions = this.deductions || {};

  this.grossSalary =
    (earnings.basic || 0) +
    (earnings.allowances || 0) +
    (earnings.overtime || 0) +
    (earnings.bonus || 0) +
    (earnings.reimbursement || 0);

  const totalDeductions =
    (deductions.tax || 0) +
    (deductions.pf || 0) +
    (deductions.insurance || 0) +
    (deductions.leaveDeduction || 0) +
    (deductions.other || 0);

  this.netSalary = this.grossSalary - totalDeductions;

  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;