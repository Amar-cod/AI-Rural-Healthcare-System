// Models are required individually below since there is no index.js

// We need to fetch the AshaWorkerProfile to get assignedVillageIds.
// Or wait, does req.user have assignedVillageIds?
// Protect middleware just sets req.user (which is the User model).
// We should fetch the AshaWorkerProfile in the middleware.

const verifyAshaPatientAccess = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const patient = await require('../models/User').findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const village = await require('../models/Village').findOne({ 
      _id: patient.villageId, 
      assignedAshaWorkerIds: req.user.id 
    });

    if (!village) {
      return res.status(403).json({ message: 'Not authorized for this village' });
    }

    req.patient = patient;
    next();
  } catch (err) {
    console.error('verifyAshaPatientAccess error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyAshaPatientAccess };
