const mongoose = require('mongoose');

const medicineRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  requestedMedicines: [{ type: String, required: true }],
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('MedicineRequest', medicineRequestSchema);
