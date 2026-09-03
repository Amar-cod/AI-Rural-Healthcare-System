const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Report = require('../models/Report');

const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Validate role (Patient can only see own, Doctor/Admin can see any)
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Not authorized to view this history.' });
    }

    const consultations = await Consultation.find({ patientId })
      .populate('doctorId', 'name')
      .populate('aiSessionId', 'symptomsSummary redFlags')
      .sort({ createdAt: -1 });
      
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
      
    const reports = await Report.find({ patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });

    const patientRecords = await require('../models/PatientRecord').find({ patientId })
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ consultations, prescriptions, reports, patientRecords });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getPatientHistory };
