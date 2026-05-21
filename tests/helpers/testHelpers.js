'use strict';

const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../../src/app');

let mongoUri;

/**
 * Connect to the test MongoDB database
 */
const connectTestDB = async () => {
  mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/triven_ecommerce_test';
  await mongoose.connect(mongoUri);
};

/**
 * Disconnect and clean up test database
 */
const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

/**
 * Clear all collections between tests
 */
const clearAllCollections = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

/**
 * Create a test user directly in the DB
 */
const createTestUser = async (overrides = {}) => {
  const User = require('../../src/models/User');
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass@123',
    isEmailVerified: true,
    isActive: true,
    role: 'user',
    ...overrides,
  });
};

/**
 * Create an authenticated test request with JWT
 */
const getAuthHeader = async (user) => {
  const { generateAuthTokens } = require('../../src/helpers/tokenHelper');
  const { accessToken } = generateAuthTokens(user._id, user.role);
  return { Authorization: `Bearer ${accessToken}` };
};

const request = supertest(app);

module.exports = { connectTestDB, disconnectTestDB, clearAllCollections, createTestUser, getAuthHeader, request };
