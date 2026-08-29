const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true }, // For generated reports
  fileUrl: { type: String, default: null }, // Optional, if a file is uploaded
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
