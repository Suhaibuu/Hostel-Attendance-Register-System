const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hosteltrack');
  console.log("Connected to DB");
  const Attendance = require('./models/Attendance');
  const Student = require('./models/Student');
  
  const studentCount = await Student.countDocuments();
  const attendanceCount = await Attendance.countDocuments();
  console.log(`Students: ${studentCount}, Attendance records: ${attendanceCount}`);
  
  const allRecs = await Attendance.find().limit(20);
  console.log("First 20 attendance records:", allRecs);
  
  await mongoose.disconnect();
}

run();
