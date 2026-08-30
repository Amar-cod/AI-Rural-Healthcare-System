const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    instructions: { type: String, required: true },
    frequency: { type: String },
    durationDays: { type: Number }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
