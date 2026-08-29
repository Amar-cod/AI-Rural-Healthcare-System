const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['checkup', 'followup', 'telemedicine'], required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['requested', 'confirmed', 'completed', 'cancelled'], default: 'requested' },
}, { timestamps: true });

// Prevent double booking
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
