require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hosteltrack';

const users = [
  { name: 'Admin User',    email: 'admin@hostel.com',  password: 'admin123',  role: 'admin' },
  { name: 'Block Warden',  email: 'warden@hostel.com', password: 'warden123', role: 'warden' },
];

const students = [
  { name: 'Arun Kumar',  rollNo: 'CS001', roomNo: '101', department: 'CS' },
  { name: 'Basil Ahmed',  rollNo: 'CS002', roomNo: '101', department: 'CS' },
  { name: 'Deepak Nair',  rollNo: 'EC001', roomNo: '102', department: 'EC' },
  { name: 'Edwin Jose',   rollNo: 'EC002', roomNo: '102', department: 'EC' },
  { name: 'Favas M',      rollNo: 'ME001', roomNo: '103', department: 'ME' },
  { name: 'George Paul',  rollNo: 'ME002', roomNo: '103', department: 'ME' },
  { name: 'Harish R',     rollNo: 'CS003', roomNo: '104', department: 'CS' },
  { name: 'Ijaz K',       rollNo: 'CS004', roomNo: '104', department: 'CS' },
  { name: 'Jithin P',     rollNo: 'EC003', roomNo: '105', department: 'EC' },
  { name: 'Kiran S',      rollNo: 'ME003', roomNo: '105', department: 'ME' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  // ── Seed users ──
  let userCount = 0;
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({ name: u.name, email: u.email, passwordHash, role: u.role });
      userCount++;
    }
  }

  // ── Seed students ──
  let studentCount = 0;
  for (const s of students) {
    const exists = await Student.findOne({ rollNo: s.rollNo });
    if (!exists) {
      await Student.create({ ...s, messPlan: 'full', dailyRate: 120 });
      studentCount++;
    }
  }

  console.log(`✅ Seeded ${userCount} users and ${studentCount} students`);
  console.log('📧 Admin:  admin@hostel.com / admin123');
  console.log('📧 Warden: warden@hostel.com / warden123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
