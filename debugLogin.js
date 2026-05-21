require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'anshusharma42019@gmail.com';
    let user = await User.findOne({ email }).select('+password');
    
    if (user) {
      console.log('User found! Forcing password reset...');
      user.password = 'SecurePassword123';
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isActive = true;
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      
      // Verify immediately
      const updatedUser = await User.findOne({ email }).select('+password');
      const isMatch = await updatedUser.comparePassword('SecurePassword123');
      console.log('Password reset successful. Can log in with "SecurePassword123"? ->', isMatch);
    } else {
      console.log('User not found in DB!');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugLogin();
