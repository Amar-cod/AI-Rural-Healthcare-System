const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicationSchedule' },
  type: { type: String, enum: ['medication', 'followup'], required: true },
  message: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' },
  pushSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
