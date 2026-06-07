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
  level: {
    type: String,
    enum: ['UG', 'PG'],
    default: 'UG',
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

module.exports = mongoose.model('Student', studentSchema);

