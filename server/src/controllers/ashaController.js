const Village = require('../models/Village');
const AshaWorkerProfile = require('../models/AshaWorkerProfile');
const User = require('../models/User');
const PatientRecord = require('../models/PatientRecord');
const bcrypt = require('bcryptjs');

const getMyVillages = async (req, res) => {
  try {
    const profile = await AshaWorkerProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'ASHA profile not found' });
    }

    const villages = await Village.find({ assignedAshaWorkerIds: req.user.id });
    res.json(villages);
  } catch (error) {
    console.error('Error fetching ASHA villages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVillagePatients = async (req, res) => {
  try {
    const villageId = req.params.id;
    const profile = await AshaWorkerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'ASHA Profile not found' });
    
    const village = await Village.findOne({ _id: villageId, assignedAshaWorkerIds: req.user.id });
    if (!village) {
      return res.status(403).json({ message: 'Not authorized for this village' });
    }

    const patients = await User.find({ villageId, role: 'patient' }).select('-passwordHash');
    res.json(patients);
  } catch (error) {
    console.error('Error fetching village patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const registerPatient = async (req, res) => {
  try {
    const { villageId, name, email, phone, age, gender, symptoms, observations } = req.body;
    
    const profile = await AshaWorkerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: 'ASHA Profile not found' });

    const village = await Village.findOne({ _id: villageId, assignedAshaWorkerIds: req.user.id });
    if (!village) {
      return res.status(403).json({ message: 'Not authorized for this village' });
    }

    // Check if patient exists (by phone or email if provided)
    // For rural areas, email might be missing or mock. If phone exists, use it.
    let user = null;
    if (phone) {
      user = await User.findOne({ phone, role: 'patient' });
    }
    if (!user && email) {
      user = await User.findOne({ email, role: 'patient' });
    }

    if (!user) {
      // Create new patient
      const count = await User.countDocuments({ role: 'patient' });
      const healthId = `RHCS-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
      
      const defaultPassword = await bcrypt.hash('Patient@123', 10);
      user = new User({
        name,
        email: email || `patient_${Date.now()}@rhcs.local`, // fallback if no email
        phone,
        age,
        gender,
        villageId,
        healthId,
        role: 'patient',
        passwordHash: defaultPassword
      });
      await user.save();
    } else {
      // Update basic demographic if provided
      if (age) user.age = age;
      if (gender) user.gender = gender;
      if (name) user.name = name;
      if (villageId) user.villageId = villageId; // move to new village if needed
      await user.save();
    }

    // Add PatientRecord
    const record = new PatientRecord({
      patientId: user._id,
      villageId,
      collectedBy: req.user.id,
      symptoms: symptoms || [],
      observations: observations || ''
    });
    await record.save();

    res.status(201).json({ patient: user, record });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadPatientPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // req.patient is set by verifyAshaPatientAccess
    const patientId = req.patient._id;
    // URL relative to server root or public path (we can just serve /uploads static route later)
    // For now, we store the local path or relative URL
    // e.g. /uploads/asha/{villageId}/{patientId}/{filename}
    const villageId = req.patient.villageId.toString();
    const url = `/uploads/asha/${villageId}/${patientId}/${req.file.filename}`;

    // Optionally attach it to the LATEST patient record for this user by this ASHA worker
    const latestRecord = await PatientRecord.findOne({ 
      patientId, 
      collectedBy: req.user.id 
    }).sort({ createdAt: -1 });

    if (latestRecord) {
      latestRecord.attachments.push({ type: 'photo', url });
      await latestRecord.save();
    }

    res.json({ url, message: 'Photo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadPatientReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const patientId = req.patient._id;
    const villageId = req.patient.villageId.toString();
    const url = `/uploads/asha/${villageId}/${patientId}/${req.file.filename}`;

    const latestRecord = await PatientRecord.findOne({ 
      patientId, 
      collectedBy: req.user.id 
    }).sort({ createdAt: -1 });

    if (latestRecord) {
      latestRecord.attachments.push({ type: 'report', url });
      await latestRecord.save();
    }

    res.json({ url, message: 'Report uploaded successfully' });
  } catch (error) {
    console.error('Error uploading report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyVillages,
  getVillagePatients,
  registerPatient,
  uploadPatientPhoto,
  uploadPatientReport
};
