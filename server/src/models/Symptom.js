const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isRedFlag: { type: Boolean, default: false },
  generalGuidance: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Symptom', symptomSchema);
