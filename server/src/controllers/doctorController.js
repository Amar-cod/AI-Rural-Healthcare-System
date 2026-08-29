const DoctorProfile = require('../models/DoctorProfile');

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

module.exports = { applyProfile, getProfile, getApprovedDoctors };
