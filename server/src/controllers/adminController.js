const DoctorProfile = require('../models/DoctorProfile');

const getAllApplications = async (req, res) => {
  try {
    const applications = await DoctorProfile.find({}).populate('userId', 'name email phone');
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await DoctorProfile.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.verificationStatus = status;
    await application.save();

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllApplications, updateDoctorStatus };
