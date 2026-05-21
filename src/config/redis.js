'use strict';

const IORedis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  let connected = false;

  redisClient = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    retryStrategy: (times) => {
      if (!connected) return null; // don't retry if initial connect failed
      if (times > 10) {
        logger.warn('Redis max retries reached. Operating without cache.');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redisClient.on('ready', () => {
    connected = true;
    logger.info('✅ Redis connected.');
  });
  redisClient.on('error', () => {}); // suppress noisy retry errors

  try {
    await redisClient.connect();
  } catch (err) {
    logger.warn(`Redis unavailable. App will run without caching: ${err.message}`);
    redisClient.disconnect();
    redisClient = null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, redisClient: new Proxy({}, {
  get(_, prop) {
    return redisClient ? redisClient[prop] : undefined;
  }
}), getRedisClient };
