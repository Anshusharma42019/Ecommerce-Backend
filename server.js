'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initializeJobs } = require('./src/jobs');
const { initializeSockets } = require('./src/sockets');
const logger = require('./src/utils/logger');

// Set custom DNS if required for resolving some services faster
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const PORT = process.env.PORT || 5000;
const APP_NAME = process.env.APP_NAME || 'Triven E-Commerce API';

// ─── Create HTTP server ───────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Initialize Socket.IO ─────────────────────────────────────────────────────
initializeSockets(server);

// ─── Graceful Shutdown Handler ────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Initiating graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error during server close:', err);
      process.exit(1);
    }

    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');

      const { redisClient } = require('./src/config/redis');
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }

      logger.info(`${APP_NAME} shut down gracefully.`);
      process.exit(0);
    } catch (shutdownErr) {
      logger.error('Error during graceful shutdown:', shutdownErr);
      process.exit(1);
    }
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after 30s timeout.');
    process.exit(1);
  }, 30000).unref();
};

// ─── Unhandled Errors ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', { reason });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Drop problematic unique index on variants.sku if exists
    try {
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      const productsCol = db.collection('products');
      const indexes = await productsCol.indexes();
      const hasVariantSkuIndex = indexes.some((idx) => idx.name === 'variants.sku_1');
      if (hasVariantSkuIndex) {
        logger.info('⚠️ Problematic variants.sku_1 index found. Dropping to prevent product creation duplicate key errors...');
        await productsCol.dropIndex('variants.sku_1');
        logger.info('✅ Successfully dropped variants.sku_1 index!');
      }
    } catch (indexErr) {
      logger.error('Failed to manage products indexes:', indexErr);
    }

    // Auto-seed default categories if empty or incomplete
    try {
      const Category = require('./src/models/Category');
      const count = await Category.countDocuments();
      const seedCategories = [
        { name: 'Herbal Supplements', description: 'Traditional Ayurvedic tablets, capsules, and wellness formulations for daily health support.', sortOrder: 1, isActive: true },
        { name: 'Massage & Hair Oils', description: 'Traditional therapeutic Ayurvedic tailams, body oils, and nourishing hair formulations.', sortOrder: 2, isActive: true },
        { name: 'Skincare & Personal Care', description: 'Natural herbal soaps, face packs, cleansers, and organic beauty products.', sortOrder: 3, isActive: true },
        { name: 'Wellness Teas & Juices', description: 'Pure organic herbal teas, health tonics, and rejuvenating wellness drinks.', sortOrder: 4, isActive: true },
        { name: 'Single Herb Powders (Churna)', description: '100% pure powders of single herbs like Ashwagandha, Triphala, Shatavari, and Turmeric.', sortOrder: 5, isActive: true }
      ];

      if (count < seedCategories.length) {
        logger.info('Categories database empty or incomplete. Re-seeding defaults...');
        await Category.deleteMany({});
        for (const catData of seedCategories) {
          const cat = new Category(catData);
          await cat.save();
        }
        logger.info('✅ Auto-seeded default categories successfully.');
      }
    } catch (seedErr) {
      logger.error('Failed to auto-seed categories:', seedErr);
    }

    // Connect to Redis
    await connectRedis();

    // Initialize background job queues
    initializeJobs();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 ${APP_NAME} running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

bootstrap();
