const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
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

// ── GET /api/students/me ─────────────────────────────────
// Student's own profile (requires role=student in JWT)
router.get('/me', async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access only' });
    }
    const student = await Student.findById(req.user.id, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/students ────────────────────────────────────
// ?all=true includes inactive | ?room=204 filters by room
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') filter.active = true;
    if (req.query.room) filter.roomNo = req.query.room;

    const students = await Student.find(filter, { passwordHash: 0 })
      .sort({ roomNo: 1, name: 1 })
      .lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/students/rooms ──────────────────────────────
// Sorted unique room numbers (excludes null/empty — unallotted students)
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Student.distinct('roomNo', {
      active: true,
      roomNo: { $nin: [null, ''] },
    });
    rooms.sort();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/students/room/:roomNo ───────────────────────
router.get('/room/:roomNo', async (req, res) => {
  try {
    const students = await Student.find(
      { roomNo: req.params.roomNo, active: true },
      { passwordHash: 0 }
    ).sort({ name: 1 }).lean();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/students/:id ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/students ───────────────────────────────────
// Admin or Warden — create a new student
// Default login password = roll no (lowercase), hashed and stored immediately
router.post('/', async (req, res) => {
  try {
    const { name, rollNo, roomNo, department, phone, level, semester, category } = req.body || {};

    // Hash roll no (lowercase) as the default password
    const passwordHash = await bcrypt.hash(rollNo.trim().toLowerCase(), 10);

    const student = await Student.create({
      name, rollNo, roomNo: roomNo || null, department, phone: phone || null, level, semester, category, passwordHash,
    });

    const { passwordHash: _, ...safe } = student.toObject();
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/students/:id ────────────────────────────────
// Admin only — update student fields (room allotment goes through here too)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    // Never allow updating passwordHash via this route
    const { passwordHash, ...updates } = req.body;

    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      projection: { passwordHash: 0 },
    }).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/students/:id ─────────────────────────────
// Admin only — delete student
// If req.query.hard === 'true', permanently delete the student and their attendance records.
// Otherwise (default), soft delete (set active = false).
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    if (req.query.hard === 'true') {
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      // Delete associated attendance records too
      await Attendance.deleteMany({ studentId: req.params.id });
      res.json({ message: 'Student and attendance records permanently deleted' });
    } else {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
      );
      if (!student) return res.status(404).json({ message: 'Student not found' });
      res.json({ message: 'Student deactivated (marked as Passed Out)' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/students/:id/reactivate ───────────────────
// Admin only — roll back a "Passed Out" student to active
router.patch('/:id/reactivate', adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { active: true },
      { new: true, projection: { passwordHash: 0 } }
    ).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student reactivated successfully', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
