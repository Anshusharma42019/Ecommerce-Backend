require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'anshusharma42019@gmail.com';
    let user = await User.findOne({ email });

    if (user) {
      console.log('User found! Upgrading to Admin...');
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isActive = true;
      user.password = 'SecurePassword123'; // Force reset password so they can log in
      // Reset login attempts just in case
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      console.log(`Success! ${email} is now a fully verified Admin.`);
    } else {
      console.log('User not found. Creating a new Admin account...');
      user = new User({
        firstName: 'Anshu',
        lastName: 'Sharma',
        email: email,
        phone: '9876543210',
        password: 'SecurePassword123', // This will be hashed automatically by the pre-save hook
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      await user.save();
      console.log(`Success! Created new Admin account for ${email}.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

makeAdmin();
