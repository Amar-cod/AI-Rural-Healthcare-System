const Village = require('../models/Village');
const AshaWorkerProfile = require('../models/AshaWorkerProfile');

const getMyVillages = async (req, res) => {
  try {
    const profile = await AshaWorkerProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'ASHA profile not found' });
    }

    const villages = await Village.find({ _id: { $in: profile.assignedVillageIds } });
    res.json(villages);
  } catch (error) {
    console.error('Error fetching ASHA villages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyVillages
};
