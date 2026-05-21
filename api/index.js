'use strict';

require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/database');
const { connectRedis } = require('../src/config/redis');

let isInitialized = false;

const initialize = async () => {
  if (isInitialized) return;
  await connectDB();
  await connectRedis();
  isInitialized = true;
};

module.exports = async (req, res) => {
  await initialize();
  return app(req, res);
};
