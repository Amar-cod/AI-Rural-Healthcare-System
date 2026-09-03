const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const AISession = require('../models/AISession');

const applyProfile = async (req, res) => {
  try {
    const { specialization, qualifications, licenseNumber, availability } = req.body;

    const existingProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Application already exists.' });
    }

    const licenseExists = await DoctorProfile.findOne({ licenseNumber });
    if (licenseExists) {
      return res.status(400).json({ message: 'License number already registered.' });
    }

    const profile = await DoctorProfile.create({
      userId: req.user.id,
      specialization,
      qualifications,
      licenseNumber,
      availability: availability || []
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user.id }).populate('userId', 'name email');
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ verificationStatus: 'approved' })
      .populate('userId', 'name email language');
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatients = async (req, res) => {
  try {
    const { priority, villageId, search } = req.query;
    
    // Base query
    const query = { role: 'patient' };
    if (priority) {
      query.currentPriority = priority;
    }
    if (villageId) {
      query.villageId = villageId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { healthId: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await User.find(query).select('-passwordHash').sort({ updatedAt: -1 });

    // Since it's a doctor dashboard, we may want to attach some recent consultation/session summary
    // For now, returning the patients with their currentPriority is enough.
    // The sorting should put critical first. We will do this in JS to ensure custom order.
    
    const priorityWeights = { critical: 4, high: 3, medium: 2, routine: 1 };
    patients.sort((a, b) => {
      const weightA = priorityWeights[a.currentPriority] || 1;
      const weightB = priorityWeights[b.currentPriority] || 1;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json(patients);
  } catch (error) {
    console.error('getPatients error:', error);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
};

const escalatePatientPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    if (priority !== 'critical') {
      return res.status(400).json({ message: 'Can only escalate to critical via this endpoint' });
    }

    const patient = await User.findById(id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.currentPriority = 'critical';
    await patient.save();

    res.json({ message: 'Patient priority escalated to critical', patient });
  } catch (error) {
    console.error('escalatePatientPriority error:', error);
    res.status(500).json({ message: 'Server error escalating patient' });
  }
};

module.exports = { applyProfile, getProfile, getApprovedDoctors, getPatients, escalatePatientPriority };
