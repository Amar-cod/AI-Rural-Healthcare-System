const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  specialization: { type: String, required: true },
  qualifications: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  availability: [{ type: String }],
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
