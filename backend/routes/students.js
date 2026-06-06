const express = require('express');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// --------------- Helper: admin-only guard ---------------
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// --------------- GET /api/students ---------------
// ?room=204  → filter by roomNo
// ?all=true  → include inactive students
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.query.all !== 'true') {
      filter.active = true;
    }

    if (req.query.room) {
      filter.roomNo = req.query.room;
    }

    const students = await Student.find(filter).sort({ roomNo: 1, name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/students/rooms ---------------
// Returns sorted unique room numbers from active students
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Student.distinct('roomNo', { active: true });
    rooms.sort();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/students/room/:roomNo ---------------
// Returns active students in a specific room, sorted by name
router.get('/room/:roomNo', async (req, res) => {
  try {
    const students = await Student.find({
      roomNo: req.params.roomNo,
      active: true,
    }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/students/:id ---------------
// Fetch a single student by ID (for history view)
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- POST /api/students ---------------
// Admin or Warden — create a new student
router.post('/', async (req, res) => {
  try {
    const { name, rollNo, roomNo, department, messPlan, dailyRate } = req.body;
    const student = await Student.create({ name, rollNo, roomNo, department, messPlan, dailyRate });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- PUT /api/students/:id ---------------
// Admin only — update student fields
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- DELETE /api/students/:id ---------------
// Admin only — soft delete (set active = false)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
