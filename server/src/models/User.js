const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin', 'asha_worker'], 
    required: true 
  },
  phone: { type: String },
  language: { type: String, default: 'en' },
  currentPriority: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'routine'], 
    default: 'routine' 
  },
  pushSubscription: { type: Object },
  // Phase 2D fields for Patients
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
  healthId: { type: String, unique: true, sparse: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
