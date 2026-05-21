'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async (retryCount = 0) => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/triven_ecommerce';

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Run the product images fix task asynchronously after connection is fully established
    setTimeout(async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const Product = require('../models/Product');
        
        const sourceTriphala = 'C:\\Users\\anshu\\.gemini\\antigravity\\brain\\255ef1c2-bd1c-400b-986e-1c05b20f492d\\triphala_powder_1779261065815.png';
        const sourceAmrit = 'C:\\Users\\anshu\\.gemini\\antigravity\\brain\\255ef1c2-bd1c-400b-986e-1c05b20f492d\\amrit_kalash_1779261088784.png';
        
        const destDirBackend = path.join(__dirname, '..', '..', 'uploads', 'products');
        const destDirFrontend = path.join(__dirname, '..', '..', '..', 'Frontend', 'assets');
        
        // Ensure directories exist
        fs.mkdirSync(destDirBackend, { recursive: true });
        fs.mkdirSync(destDirFrontend, { recursive: true });
        
        const destTriphalaBackend = path.join(destDirBackend, 'triphala_powder.png');
        const destTriphalaFrontend = path.join(destDirFrontend, 'triphala_powder.png');
        const destAmritBackend = path.join(destDirBackend, 'amrit_kalash.png');
        const destAmritFrontend = path.join(destDirFrontend, 'amrit_kalash.png');
        
        // Copy files
        if (fs.existsSync(sourceTriphala)) {
          fs.copyFileSync(sourceTriphala, destTriphalaBackend);
          fs.copyFileSync(sourceTriphala, destTriphalaFrontend);
          logger.info('✅ Copied Triphala images successfully to both uploads/products/ and Frontend/assets/');
        }
        
        if (fs.existsSync(sourceAmrit)) {
          fs.copyFileSync(sourceAmrit, destAmritBackend);
          fs.copyFileSync(sourceAmrit, destAmritFrontend);
          logger.info('✅ Copied Amrit Kalash images successfully to both uploads/products/ and Frontend/assets/');
        }
        
        // Update MongoDB
        // Triphala Powder
        const triphalaProd = await Product.findOne({ name: /Triphala/i });
        if (triphalaProd) {
          triphalaProd.thumbnail = { url: '/uploads/products/triphala_powder.png' };
          triphalaProd.images = [{ url: '/uploads/products/triphala_powder.png' }];
          await triphalaProd.save();
          logger.info(`✅ Updated Triphala Powder image in DB (ID: ${triphalaProd._id})`);
        }
        
        // Amrit Kalash
        const amritProd = await Product.findOne({ name: /Amrit/i });
        if (amritProd) {
          amritProd.thumbnail = { url: '/uploads/products/amrit_kalash.png' };
          amritProd.images = [{ url: '/uploads/products/amrit_kalash.png' }];
          await amritProd.save();
          logger.info(`✅ Updated Amrit Kalash Supplement image in DB (ID: ${amritProd._id})`);
        }
      } catch (err) {
        logger.error('❌ Error executing fixProductImages inside database.js:', err);
      }
    }, 1000);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

  } catch (err) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err.message);

    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    logger.error('Exhausted MongoDB connection retries. Exiting.');
    process.exit(1);
  }
};

module.exports = { connectDB };
