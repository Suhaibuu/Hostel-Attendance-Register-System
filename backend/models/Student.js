const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  rollNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  roomNo: {
    type: String,
    trim: true,
    default: null,   // null = not yet allotted
  },
  department: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: (v) => !v || /^\d{10}$/.test(v),
      message: 'Phone must be a 10-digit number',
    },
  },
  level: {
    type: String,
    enum: ['UG', 'PG'],
    default: 'UG',
  },
  semester: {
    type: String,
    enum: ['S1', 'S3', 'S7'],
    default: 'S1',
  },
  category: {
    type: String,
    enum: ['General', 'OBC', 'SC', 'ST', 'OEC', 'Fisheries'],
    default: 'General',
  },
  // Student login — default password is their roll no (lowercase)
  passwordHash: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ── Performance indexes ──
// Compound index for the most common query pattern: active students in a room
studentSchema.index({ active: 1, roomNo: 1 });
// Note: rollNo already has a unique index from `unique: true` in schema

module.exports = mongoose.model('Student', studentSchema);
