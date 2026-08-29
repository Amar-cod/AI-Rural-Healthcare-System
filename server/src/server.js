const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({ status: 'OK', database: dbStatus });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI && process.env.MONGO_URI !== 'your_mongodb_atlas_connection_string' 
  ? process.env.MONGO_URI 
  : 'mongodb://localhost:27017/rural-health')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('MongoDB connection error (check your .env MONGO_URI):', err.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
