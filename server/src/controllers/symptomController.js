const Symptom = require('../models/Symptom');

// Get all symptoms for quick select
const getAllSymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find().sort({ name: 1 });
    res.json(symptoms);
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllSymptoms };
