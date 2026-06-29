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
// date can be today OR any past date (YYYY-MM-DD)
router.post('/mark', async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'date and records are required' });
    }

    const ops = [];
    records.forEach((r) => {
      if (r.present === null || r.present === undefined) {
        ops.push({
          deleteOne: {
            filter: { studentId: r.studentId, date }
          }
        });
      } else {
        ops.push({
          updateOne: {
            filter: { studentId: r.studentId, date },
            update: {
              $set: {
                present: r.present,
                markedBy: req.user.id,
                markedAt: new Date(),
              },
            },
            upsert: true,
          }
        });
      }
    });

    if (ops.length > 0) {
      await Attendance.bulkWrite(ops, { ordered: false });
    }
    res.json({ message: 'Attendance saved', count: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------- GET /api/attendance/date/:roomNo?date=YYYY-MM-DD ---------------
// Flexible: fetch attendance for a room on ANY date (defaults to today)
const getRoomAttendanceByDate = async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const { roomNo } = req.params;

    // Basic date validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Active students in the room — lean() returns plain JS objects (5-10x faster)
    // Only select the fields we actually need
    const students = await Student.find(
      { roomNo, active: true },
      { name: 1, rollNo: 1 }
    ).sort({ name: 1 }).lean();

    // Records for those students on the given date
    const studentIds = students.map((s) => s._id);
    const records = await Attendance.find(
      { studentId: { $in: studentIds }, date },
      { studentId: 1, present: 1 }
    ).lean();

    // Build lookup map studentId → present
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
};

// Both endpoints: /date/:roomNo?date=YYYY-MM-DD  and  /today/:roomNo (alias)
router.get('/date/:roomNo', getRoomAttendanceByDate);
router.get('/today/:roomNo', getRoomAttendanceByDate);

// --------------- GET /api/attendance/student/:studentId ---------------
// ?month=2026-06  (default: current month)
router.get('/student/:studentId', async (req, res) => {
  try {
    const month = req.query.month || todayStr().slice(0, 7); // YYYY-MM
    const total = daysInMonth(month);

    // Only select fields we need, use lean() for speed
    const records = await Attendance.find(
      {
        studentId: req.params.studentId,
        date: { $gte: `${month}-01`, $lte: `${month}-31` },
      },
      { date: 1, present: 1, _id: 0 }
    ).sort({ date: 1 }).lean();

    let presentDays = 0;
    let absentDays = 0;
    for (let i = 0; i < records.length; i++) {
      if (records[i].present) presentDays++;
      else absentDays++;
    }

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
    // Use distinct + aggregation to avoid fetching all documents
    // distinct('date') returns unique date strings; we then extract months
    const dates = await Attendance.distinct('date', { studentId: req.params.studentId });
    const monthSet = new Set(dates.map((d) => d.slice(0, 7)));
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
    if (req.user.role !== 'admin' && req.user.role !== 'warden') {
      return res.status(403).json({ message: 'Admin or Warden access required' });
    }

    const month = req.query.month || todayStr().slice(0, 7);
    const totalDays = daysInMonth(month);

    // Run both queries in parallel — each with lean() and minimal projection
    const [students, allRecords] = await Promise.all([
      Student.find(
        { active: true },
        { name: 1, rollNo: 1, roomNo: 1, department: 1, category: 1 }
      ).sort({ roomNo: 1, name: 1 }).lean(),

      Attendance.find(
        { date: { $gte: `${month}-01`, $lte: `${month}-31` } },
        { studentId: 1, present: 1, _id: 0 }
      ).lean(),
    ]);

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

    // Run both queries in parallel with lean() and minimal projection
    const [students, records] = await Promise.all([
      Student.find(
        { active: true },
        { roomNo: 1, _id: 1 }
      ).lean(),

      Attendance.find(
        { date },
        { studentId: 1, present: 1, _id: 0 }
      ).lean(),
    ]);

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
