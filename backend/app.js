const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { logRequest } = require('./middleware/logging');

// Reuse one MongoDB connection across requests (and warm serverless invocations)
let connPromise = null;
const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connPromise) {
    connPromise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => {
        connPromise = null;
        throw err;
      });
  }
  return connPromise;
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequest); // Add logging middleware

// Netlify Functions may forward the internal function path; normalize it to /api/...
app.use((req, res, next) => {
  const prefix = '/.netlify/functions/api';
  if (req.url.startsWith(prefix)) req.url = '/api' + (req.url.slice(prefix.length) || '/');
  next();
});

// Ensure DB is connected before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database unavailable', error: err.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const skillVerificationRoutes = require('./routes/skillVerificationRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/skill-verification', skillVerificationRoutes);

// Health check
app.get('/', (req, res) => res.send('IntelliMatch API Running ✅'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 }));

// Error handler (multer etc.)
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Something went wrong' });
});

module.exports = { app, connectDB };
