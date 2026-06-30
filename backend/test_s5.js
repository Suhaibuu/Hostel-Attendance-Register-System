const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Student = require('./models/Student');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hosteltrack');
  console.log("Connected to DB");

  try {
    const tempStudent = new Student({
      name: 'Test Student S5',
      rollNo: 'TESTS5',
      roomNo: '999',
      department: 'CS',
      phone: '1234567890',
      level: 'UG',
      semester: 'S5',
      category: 'General'
    });
    console.log("Saving student to DB...");
    await tempStudent.save();
    console.log("Save passed for S5!");

    // Clean up
    await Student.deleteOne({ rollNo: 'TESTS5' });
    console.log("Cleaned up test student.");
  } catch (err) {
    console.error("Save failed for S5:", err.message || err);
  }

  await mongoose.disconnect();
}

run();
