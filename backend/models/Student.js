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
    required: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  messPlan: {
    type: String,
    enum: ['full', 'half'],
    default: 'full',
  },
  dailyRate: {
    type: Number,
    default: 120,
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
