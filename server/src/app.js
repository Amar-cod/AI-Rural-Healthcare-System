const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const aiRoutes = require('./routes/aiRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const historyRoutes = require('./routes/historyRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const medicineRequestRoutes = require('./routes/medicineRequestRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const ashaRoutes = require('./routes/ashaRoutes');
const villageRoutes = require('./routes/villageRoutes');
const symptomRoutes = require('./routes/symptomRoutes');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Request logging (skip in production for cleanliness)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({ status: 'OK', database: dbStatus });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medicine-requests', medicineRequestRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/asha', ashaRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/symptoms', symptomRoutes);

// Vercel Cron endpoint for medication reminders
// Protected by CRON_SECRET to prevent unauthorized access
app.get('/api/cron/reminders', async (req, res) => {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const Reminder = require('./models/Reminder');
    const User = require('./models/User');
    const { sendPushNotification } = require('./services/pushService');

    const now = new Date();
    const pendingReminders = await Reminder.find({
      status: 'pending',
      pushSent: false,
      scheduledTime: { $lte: now }
    });

    let sent = 0;
    for (const reminder of pendingReminders) {
      const user = await User.findById(reminder.patientId);
      if (user && user.pushSubscription) {
        await sendPushNotification(user.pushSubscription, {
          title: reminder.type === 'medication' ? 'Medication Reminder' : 'Health Reminder',
          body: reminder.message,
          url: '/patient/reminders'
        });
        sent++;
      }
      await Reminder.updateOne({ _id: reminder._id }, { $set: { pushSent: true } });
    }

    res.json({ message: `Processed ${pendingReminders.length} reminders, sent ${sent} notifications` });
  } catch (error) {
    console.error('Cron reminder error:', error);
    res.status(500).json({ message: 'Cron job failed', error: error.message });
  }
});

module.exports = app;
