const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();

// ---------------- Compression (gzip) ----------------
app.use(compression());

// ---------------- CORS ----------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hostel-attendance-register-system.vercel.app',
  'https://menshostel.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost during development
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Allow trusted production domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('❌ Rejected Origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ---------------- Middleware ----------------
app.use(express.json());

// ---------------- Health Check ----------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// ---------------- API Routes ----------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));

// ---------------- Root Route ----------------
app.get('/', (_req, res) => {
  res.send('🚀 Hostel Attendance Backend Running');
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/hosteltrack';

mongoose
  .connect(MONGO_URI, {
    // Connection pool: allow up to 10 concurrent operations (default is 5)
    maxPoolSize: 10,
    // Reduce time spent establishing new connections
    minPoolSize: 2,
    // Timeout waiting for a connection from the pool (ms)
    waitQueueTimeoutMS: 5000,
    // Server selection timeout — how long to try finding a suitable server
    serverSelectionTimeoutMS: 5000,
    // Socket timeout — how long to wait for a response (ms)
    socketTimeoutMS: 30000,
    // Heartbeat frequency for monitoring (ms)
    heartbeatFrequencyMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });