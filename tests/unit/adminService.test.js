'use strict';

const adminService = require('../../src/services/adminService');
const userRepo = require('../../src/repositories/userRepo');
const ApiError = require('../../src/helpers/ApiError');
const { ROLES } = require('../../src/constants');

// Mock userRepo methods
jest.mock('../../src/repositories/userRepo');

describe('AdminService - updateUserRole', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully update user role when role is valid and user exists', async () => {
    const mockUser = { _id: 'user123', firstName: 'John', lastName: 'Doe', role: 'user' };
    const updatedUser = { ...mockUser, role: 'admin' };

    userRepo.findById.mockResolvedValue(mockUser);
    userRepo.updateById.mockResolvedValue(updatedUser);

    const result = await adminService.updateUserRole('user123', 'admin');

    expect(userRepo.findById).toHaveBeenCalledWith('user123');
    expect(userRepo.updateById).toHaveBeenCalledWith('user123', { role: 'admin' }, { new: true });
    expect(result.role).toBe('admin');
  });

  test('should throw ApiError.badRequest if the role is invalid', async () => {
    await expect(adminService.updateUserRole('user123', 'super_admin')).rejects.toThrow(
      expect.objectContaining({
        message: 'Invalid role.',
        statusCode: 400
      })
    );

    expect(userRepo.findById).not.toHaveBeenCalled();
    expect(userRepo.updateById).not.toHaveBeenCalled();
  });

  test('should throw ApiError.notFound if the user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(adminService.updateUserRole('nonexistent', 'admin')).rejects.toThrow(
      expect.objectContaining({
        message: 'User not found.',
        statusCode: 404
      })
    );

    expect(userRepo.findById).toHaveBeenCalledWith('nonexistent');
    expect(userRepo.updateById).not.toHaveBeenCalled();
  });
});
