import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    halfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: ['first_half', 'second_half'],
    },
    attachment: {
      type: String, // URL to attachment file
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1 });

// Static method to calculate leave days
leaveSchema.statics.calculateDays = function (startDate, endDate, halfDay = false) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;

  // Simple calculation - count all days including weekends
  // In a production system, you might want to exclude weekends/holidays
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  days = halfDay ? 0.5 : diffDays;
  return days;
};

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;