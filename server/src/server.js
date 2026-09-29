/**
 * Local development server entry point.
 * 
 * This file is used for `npm run dev` only.
 * On Vercel, the app is served via api/index.js → src/app.js instead.
 * 
 * This file adds Socket.IO and cron jobs that aren't available in serverless.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./app');

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
