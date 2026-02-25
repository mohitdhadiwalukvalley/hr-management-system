import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'wfh'],
      default: 'present',
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    workHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyDeparture: {
      type: Boolean,
      default: false,
    },
    earlyMinutes: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Method to calculate work hours
attendanceSchema.methods.calculateWorkHours = function () {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    this.workHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  return this.workHours;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;