import mongoose from 'mongoose';

const workSessionSchema = new mongoose.Schema({
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
});

const lunchBreakSchema = new mongoose.Schema({
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
});

const personalBreakSchema = new mongoose.Schema({
  out: {
    type: Date,
    required: true,
  },
  in: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
    trim: true,
  },
});

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
    // Legacy fields for backward compatibility
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
    // New work sessions (multiple check-in/out cycles)
    workSessions: [workSessionSchema],
    // Lunch break
    lunchBreak: lunchBreakSchema,
    // Personal breaks
    personalBreaks: [personalBreakSchema],
    // Calculated totals (in minutes)
    totalWorkingMinutes: {
      type: Number,
      default: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'working', 'on_break', 'checked_out', 'absent', 'present', 'half-day', 'wfh'],
      default: 'pending',
    },
    // Current state for quick lookup
    currentState: {
      type: String,
      enum: ['not_checked_in', 'working', 'lunch_break', 'personal_break', 'checked_out'],
      default: 'not_checked_in',
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
attendanceSchema.index({ currentState: 1 });

// Method to calculate work hours (legacy support)
attendanceSchema.methods.calculateWorkHours = function () {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    this.workHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }
  return this.workHours;
};

// Method to calculate total working minutes from work sessions
attendanceSchema.methods.calculateTotals = function () {
  // Calculate work session durations
  this.totalWorkingMinutes = this.workSessions.reduce((total, session) => {
    if (session.checkIn && session.checkOut) {
      session.duration = Math.round((session.checkOut - session.checkIn) / (1000 * 60));
      return total + session.duration;
    }
    return total;
  }, 0);

  // Calculate lunch break duration
  if (this.lunchBreak && this.lunchBreak.start && this.lunchBreak.end) {
    this.lunchBreak.duration = Math.round((this.lunchBreak.end - this.lunchBreak.start) / (1000 * 60));
  }

  // Calculate personal break durations
  this.totalBreakMinutes = this.personalBreaks.reduce((total, breakItem) => {
    if (breakItem.out && breakItem.in) {
      breakItem.duration = Math.round((breakItem.in - breakItem.out) / (1000 * 60));
      return total + breakItem.duration;
    }
    return total;
  }, 0);

  // Add lunch break to total break minutes
  if (this.lunchBreak && this.lunchBreak.duration) {
    this.totalBreakMinutes += this.lunchBreak.duration;
  }

  // Update legacy workHours field
  this.workHours = Math.round((this.totalWorkingMinutes / 60) * 100) / 100;

  return {
    workingMinutes: this.totalWorkingMinutes,
    breakMinutes: this.totalBreakMinutes,
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;