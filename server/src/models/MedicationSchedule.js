const mongoose = require('mongoose');

const medicationScheduleSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('MedicationSchedule', medicationScheduleSchema);
