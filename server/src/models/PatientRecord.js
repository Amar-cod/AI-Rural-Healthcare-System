const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: [{ type: String }],
  observations: { type: String },
  attachments: [{
    type: { type: String, enum: ['photo', 'report'], required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('PatientRecord', patientRecordSchema);
