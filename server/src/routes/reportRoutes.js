const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');

// Download a report
router.get('/:id/download', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Role check: Patient can only download own, Doctor/Admin can download any
    if (req.user.role === 'patient' && report.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (!report.fileUrl) {
      return res.status(404).json({ message: 'No file attached to this report.' });
    }

    // fileUrl is like '/uploads/prescription_123.pdf'
    // Remove leading slash if it exists to prevent path.join from going to root of drive on Windows
    const relativeUrl = report.fileUrl.startsWith('/') ? report.fileUrl.substring(1) : report.fileUrl;
    const filePath = path.join(__dirname, '../..', relativeUrl);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ message: 'File not found on server.' });
    }
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
