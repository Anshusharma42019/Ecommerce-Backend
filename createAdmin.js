require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@triven.com';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Admin already exists with email:', email);
      process.exit(0);
    }

    const adminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: email,
      phone: '9999999999',
      password: 'adminPassword123!',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', 'adminPassword123!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
