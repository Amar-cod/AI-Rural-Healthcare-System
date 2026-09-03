const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Symptom = require('../models/Symptom');
const symptomData = require('../data/symptomGuidance.json');

const seedSymptoms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding symptoms.');

    // Clear existing symptoms
    await Symptom.deleteMany({});
    console.log('Cleared existing symptoms.');

    // Insert new symptoms
    await Symptom.insertMany(symptomData);
    console.log('Successfully seeded symptoms database.');

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding symptoms:', error);
    process.exit(1);
  }
};

seedSymptoms();
