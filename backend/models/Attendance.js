const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  present: {
    type: Boolean,
    required: true,
  },
  messCut: {
    type: Boolean,
    default: false,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
});

// One attendance record per student per day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
// Fast lookups by date alone (today stats, reports)
attendanceSchema.index({ date: 1 });
// Fast range queries for monthly reports (date range + studentId)
attendanceSchema.index({ date: 1, studentId: 1, present: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
