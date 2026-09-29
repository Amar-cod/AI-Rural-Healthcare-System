const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../src/models/User');

if (process.env.NODE_ENV === 'production') {
  console.error("Refusing to run in production environment.");
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rhcs';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const usersToCreate = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        passwordRaw: 'password'
      },
      {
        name: 'Doctor Demo',
        email: 'doctor@example.com',
        role: 'doctor',
        passwordRaw: 'password'
      },
      {
        name: 'ASHA Worker Demo',
        email: 'asha1@example.com',
        role: 'asha_worker',
        passwordRaw: 'password'
      }
    ];

    for (const userData of usersToCreate) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`Skipped: User with email ${userData.email} already exists.`);
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.passwordRaw, salt);
        
        await User.create({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          passwordHash
        });
        console.log(`Created: User with email ${userData.email} as ${userData.role}.`);
      }
    }
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

seed();
