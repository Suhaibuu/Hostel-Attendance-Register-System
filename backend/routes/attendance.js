const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// --------------- Helper: today as YYYY-MM-DD ---------------
const todayStr = () => new Date().toISOString().slice(0, 10);

// --------------- Helper: days in a month ---------------
const daysInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

// --------------- POST /api/attendance/mark ---------------
// Body: { roomNo, date, records: [{ studentId, present }] }
router.post('/mark', async (req, res) => {
  try {
    const { date, records } = req.body;

    const ops = records.map((r) =>
      Attendance.findOneAndUpdate(
        { studentId: r.studentId, date },
        {
          present: r.present,
          markedBy: req.user.id,
          markedAt: new Date(),
        },
        { upsert: true, new: true }
      )
    );

    await Promise.all(ops);
    res.json({ message: 'Attendance saved', count: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/today/:roomNo ---------------
// Merge active students with today's attendance
router.get('/today/:roomNo', async (req, res) => {
  try {
    const date = todayStr();
    const { roomNo } = req.params;

    // Active students in the room
    const students = await Student.find({ roomNo, active: true }).sort({ name: 1 });

    // Today's records for those students
    const studentIds = students.map((s) => s._id);
    const records = await Attendance.find({ studentId: { $in: studentIds }, date });

    // Build a lookup map  studentId → present
    const recordMap = {};
    records.forEach((r) => {
      recordMap[r.studentId.toString()] = r.present;
    });

    // Merge
    const merged = students.map((s) => ({
      studentId: s._id,
      name: s.name,
      rollNo: s.rollNo,
      present: recordMap[s._id.toString()] ?? null,
    }));

    res.json({ date, roomNo, students: merged });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/student/:studentId ---------------
// ?month=2026-06  (default: current month)
router.get('/student/:studentId', async (req, res) => {
  try {
    const month = req.query.month || todayStr().slice(0, 7); // YYYY-MM
    const total = daysInMonth(month);

    // All records whose date starts with the month prefix
    const records = await Attendance.find({
      studentId: req.params.studentId,
      date: { $gte: `${month}-01`, $lte: `${month}-31` },
    }).sort({ date: 1 });

    const presentDays = records.filter((r) => r.present).length;
    const absentDays = records.filter((r) => !r.present).length;

    res.json({
      month,
      totalDays: total,
      presentDays,
      absentDays,
      records,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/student/:studentId/months ---------------
// Returns sorted list of all months (YYYY-MM) that have attendance records
router.get('/student/:studentId/months', async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId }, 'date');
    const monthSet = new Set(records.map((r) => r.date.slice(0, 7)));
    const months = [...monthSet].sort().reverse(); // newest first
    res.json({ months });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/report ---------------
// Admin only — monthly mess bill report
router.get('/report', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const month = req.query.month || todayStr().slice(0, 7);
    const totalDays = daysInMonth(month);

    // All active students
    const students = await Student.find({ active: true }).sort({ roomNo: 1, name: 1 });

    // All attendance records for the month
    const allRecords = await Attendance.find({
      date: { $gte: `${month}-01`, $lte: `${month}-31` },
    });

    // Build lookup: studentId → { presentDays: number, absentDays: number }
    const statsMap = {};
    allRecords.forEach((r) => {
      const key = r.studentId.toString();
      if (!statsMap[key]) {
        statsMap[key] = { presentDays: 0, absentDays: 0 };
      }
      if (r.present) {
        statsMap[key].presentDays++;
      } else {
        statsMap[key].absentDays++;
      }
    });

    const report = students.map((s) => {
      const stats = statsMap[s._id.toString()] || { presentDays: 0, absentDays: 0 };
      const presentDays = stats.presentDays;
      const absentDays = stats.absentDays;
      const studentTotalDays = presentDays + absentDays;

      // Mess cut calculation:
      // General/OBC: 2 absent days = 1 mess cut (floor division)
      // SC/ST/OEC: 3 absent days = 1 mess cut (floor division)
      const category = s.category || 'General';
      const divisor = (category === 'SC' || category === 'ST' || category === 'OEC') ? 3 : 2;
      const messCut = Math.floor(absentDays / divisor);

      return {
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        roomNo: s.roomNo,
        department: s.department,
        category,
        presentDays,
        absentDays,
        totalDays: studentTotalDays,
        messCut,
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/stats/today ---------------
// Returns today's overall stats and room highlighting information
router.get('/stats/today', async (req, res) => {
  try {
    const date = todayStr();
    const students = await Student.find({ active: true });
    const records = await Attendance.find({ date });

    const recordMap = {};
    records.forEach((r) => {
      recordMap[r.studentId.toString()] = r.present;
    });

    let present = 0;
    let absent = 0;
    let unmarked = 0;

    // Build mapping: roomNo → { totalActiveStudents: 0, markedCount: 0 }
    const roomStats = {};

    students.forEach((s) => {
      if (!s.roomNo) return;
      
      const status = recordMap[s._id.toString()];
      if (status === true) {
        present++;
      } else if (status === false) {
        absent++;
      } else {
        unmarked++;
      }

      if (!roomStats[s.roomNo]) {
        roomStats[s.roomNo] = { total: 0, marked: 0 };
      }
      roomStats[s.roomNo].total++;
      if (status !== undefined && status !== null) {
        roomStats[s.roomNo].marked++;
      }
    });

    // Map roomNo → 'fully' | 'partially' | 'unmarked'
    const roomHighlight = {};
    Object.entries(roomStats).forEach(([roomNo, stats]) => {
      if (stats.marked === 0) {
        roomHighlight[roomNo] = 'unmarked';
      } else if (stats.marked === stats.total) {
        roomHighlight[roomNo] = 'fully';
      } else {
        roomHighlight[roomNo] = 'partially';
      }
    });

    res.json({
      date,
      present,
      absent,
      unmarked,
      roomHighlight,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
