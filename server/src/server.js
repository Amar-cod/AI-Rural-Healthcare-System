const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
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

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PATCH') {
    console.log('Body:', req.body);
  }
  next();
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({ status: 'OK', database: dbStatus });
});

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

const PORT = process.env.PORT || 5000;
const http = require('http');
const server = http.createServer(app);
const io = require('./socket').init(server);

io.on('connection', (socket) => {
  socket.on('join_queue_room', (doctorId) => {
    socket.join(`queue_${doctorId}`);
  });
});

mongoose.connect(process.env.MONGO_URI && process.env.MONGO_URI !== 'your_mongodb_atlas_connection_string' 
  ? process.env.MONGO_URI 
  : 'mongodb://127.0.0.1:27017/rhcs')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      require('./cron/reminderCron').startReminderCron();
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    server.listen(PORT, () => console.log(`Server running on port ${PORT} (without DB)`));
  });
