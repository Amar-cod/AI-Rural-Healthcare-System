const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin'], 
    required: true 
  },
  phone: { type: String },
  language: { type: String, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
