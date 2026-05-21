'use strict';

require('dotenv').config();
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32chars_minimum';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_minimum';
process.env.JWT_EMAIL_VERIFY_SECRET = 'test_verify_secret';
process.env.JWT_RESET_PASSWORD_SECRET = 'test_reset_secret';
process.env.NODE_ENV = 'test';
process.env.MONGO_URI_TEST = 'mongodb://localhost:27017/triven_ecommerce_test';

const { connectTestDB, disconnectTestDB, clearAllCollections, request } = require('../helpers/testHelpers');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearAllCollections();
});

describe('POST /api/v1/auth/register', () => {
  const validUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass@1',
  };

  test('registers a new user successfully', async () => {
    const res = await request.post('/api/v1/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('returns 409 for duplicate email', async () => {
    await request.post('/api/v1/auth/register').send(validUser);
    const res = await request.post('/api/v1/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request.post('/api/v1/auth/register').send({ ...validUser, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for weak password', async () => {
    const res = await request.post('/api/v1/auth/register').send({ ...validUser, password: 'weak' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  const user = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: 'SecurePass@1' };

  beforeEach(async () => {
    // Create and verify user directly
    const User = require('../../src/models/User');
    await User.create({ ...user, isEmailVerified: true, isActive: true });
  });

  test('logs in with correct credentials', async () => {
    const res = await request.post('/api/v1/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('returns 401 for wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('returns 401 for non-existent email', async () => {
    const res = await request.post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: user.password });
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  test('health check returns 200', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
