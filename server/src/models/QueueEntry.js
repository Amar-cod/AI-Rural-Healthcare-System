const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['waiting', 'in-consult', 'done'], default: 'waiting' },
  position: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
