const mongoose = require('mongoose');

const ashaWorkerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('AshaWorkerProfile', ashaWorkerProfileSchema);
