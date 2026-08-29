const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log(users.map(u => ({ email: u.email, role: u.role, name: u.name })));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();
