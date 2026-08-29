const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  aiSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AISession', default: null },
  notes: { type: String, default: '' },
  finalPriority: { type: String, enum: ['high', 'medium', 'routine'], default: 'routine' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
