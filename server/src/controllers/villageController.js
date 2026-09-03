const Village = require('../models/Village');
const PatientRecord = require('../models/PatientRecord');

const getAllVillages = async (req, res) => {
  try {
    const villages = await Village.find().sort({ name: 1 });
    res.json(villages);
  } catch (error) {
    console.error('getAllVillages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVillageHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins or doctors should view village-wide history
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized to view village history' });
    }

    const records = await PatientRecord.find({ villageId: id })
      .populate('patientId', 'name age gender')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('getVillageHistory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllVillages, getVillageHistory };
