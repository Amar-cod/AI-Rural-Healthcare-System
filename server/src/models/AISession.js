const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const aiSessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
  symptomsSummary: { type: String, default: '' },
  redFlags: [{ type: String }],
  suggestedPriority: { type: String, enum: ['high', 'medium', 'routine'], default: 'routine' },
  status: { type: String, enum: ['in-progress', 'handed-off'], default: 'in-progress' },
  language: { type: String, default: 'en' }
}, { timestamps: true });

module.exports = mongoose.model('AISession', aiSessionSchema);
