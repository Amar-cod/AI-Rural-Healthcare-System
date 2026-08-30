const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@Demo2026!', salt);

    const admin = new User({
      name: 'System Admin',
      email: 'admin@rhcs.com',
      passwordHash,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin seeded successfully! Email: admin@rhcs.com | Password: Admin@Demo2026!');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin', error);
    process.exit(1);
  }
};

seedAdmin();
