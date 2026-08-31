const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Village = require('../models/Village');
const AshaWorkerProfile = require('../models/AshaWorkerProfile');
const bcrypt = require('bcryptjs');

const getPendingApplications = async (req, res) => {
  try {
    const applications = await DoctorProfile.find({}).populate('userId', 'name email phone');
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateApplicationStatus = async (req, res) => {
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
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVillages = async (req, res) => {
  try {
    const villages = await Village.find().populate('assignedAshaWorkerIds', 'name email');
    res.json(villages);
  } catch (error) {
    console.error('Error fetching villages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createVillage = async (req, res) => {
  try {
    const { name, district, state } = req.body;
    if (!name || !district || !state) {
      return res.status(400).json({ message: 'Name, district, and state are required' });
    }
    const village = new Village({ name, district, state });
    await village.save();
    res.status(201).json(village);
  } catch (error) {
    console.error('Error creating village:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAshaWorkers = async (req, res) => {
  try {
    const ashaWorkers = await User.find({ role: 'asha_worker' }).select('-passwordHash');
    res.json(ashaWorkers);
  } catch (error) {
    console.error('Error fetching ASHA workers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createAshaWorker = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    let userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      passwordHash,
      role: 'asha_worker',
      phone
    });
    
    await user.save();

    const profile = new AshaWorkerProfile({
      userId: user._id
    });
    await profile.save();

    res.status(201).json({ message: 'ASHA Worker created successfully', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error creating ASHA worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignAshaToVillage = async (req, res) => {
  try {
    const { villageId } = req.params;
    const { ashaWorkerId } = req.body;

    const village = await Village.findById(villageId);
    if (!village) return res.status(404).json({ message: 'Village not found' });

    const profile = await AshaWorkerProfile.findOne({ userId: ashaWorkerId });
    if (!profile) return res.status(404).json({ message: 'ASHA Worker Profile not found' });

    if (!village.assignedAshaWorkerIds.includes(ashaWorkerId)) {
      village.assignedAshaWorkerIds.push(ashaWorkerId);
      await village.save();
    }

    if (!profile.assignedVillageIds.includes(villageId)) {
      profile.assignedVillageIds.push(villageId);
      await profile.save();
    }

    res.json({ message: 'Assigned successfully', village });
  } catch (error) {
    console.error('Error assigning ASHA to village:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingApplications,
  updateApplicationStatus,
  getVillages,
  createVillage,
  getAshaWorkers,
  createAshaWorker,
  assignAshaToVillage
};
