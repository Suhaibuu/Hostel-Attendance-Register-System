const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const router = express.Router();

// --------------- Helper: sign JWT ---------------
const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// ================================================
// STAFF ROUTES (admin / warden)
// ================================================

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    const token = sign({ id: user._id, name: user.name, role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login  (staff)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = sign({ id: user._id, name: user.name, role: user.role });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================================================
// STUDENT ROUTES
// ================================================

// POST /api/auth/student-login
// Students log in with their Roll No + password (default = roll no lowercase)
router.post('/student-login', async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    if (!rollNo || !password)
      return res.status(400).json({ message: 'Roll No and password are required' });

    const student = await Student.findOne({ rollNo: rollNo.trim().toUpperCase() });
    if (!student) return res.status(401).json({ message: 'Invalid credentials' });

    // If no passwordHash yet, accept roll no (lowercase) as default password
    let isMatch = false;
    if (student.passwordHash) {
      isMatch = await bcrypt.compare(password, student.passwordHash);
    } else {
      // Default password = roll no lowercase — set it permanently on first use
      isMatch = password === student.rollNo.toLowerCase();
      if (isMatch) {
        student.passwordHash = await bcrypt.hash(password, 10);
        await student.save();
      }
    }

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    if (!student.active) return res.status(403).json({ message: 'Account deactivated' });

    const token = sign({ id: student._id, role: 'student', rollNo: student.rollNo });
    res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        roomNo: student.roomNo,
        department: student.department,
        role: 'student',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
