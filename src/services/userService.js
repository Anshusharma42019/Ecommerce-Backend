'use strict';

const userRepo = require('../repositories/userRepo');
const { deleteCloudinaryResource } = require('../config/cloudinary');
const ApiError = require('../helpers/ApiError');

class UserService {
  async getProfile(userId) {
    const user = await userRepo.findById(userId, { populate: [] });
    if (!user) throw ApiError.notFound('User not found.');
    return user;
  }

  async updateProfile(userId, updateData) {
    const { firstName, lastName, phone, email, password } = updateData;
    const updateObj = { firstName, lastName, phone, email };
    
    // Hash password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      updateObj.password = await bcrypt.hash(password, salt);
    }
    
    // Clean up undefined fields
    Object.keys(updateObj).forEach(key => {
      if (updateObj[key] === undefined) delete updateObj[key];
    });

    const user = await userRepo.updateById(userId, updateObj, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found.');
    return user.toPublicJSON ? user.toPublicJSON() : user;
  }

  async uploadAvatar(userId, file) {
    const user = await userRepo.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');

    // Delete old avatar
    if (user.avatar && user.avatar.publicId) {
      await deleteCloudinaryResource(user.avatar.publicId).catch(() => {});
    }

    const updated = await userRepo.updateById(userId, {
      avatar: { url: file.path, publicId: file.filename },
    }, { new: true });
    return updated;
  }

  async addAddress(userId, addressData) {
    const user = await userRepo.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');

    if (addressData.isDefault) {
      await userRepo.updateById(userId, { $set: { 'addresses.$[].isDefault': false } });
    }

    const updated = await userRepo.updateById(userId,
      { $push: { addresses: addressData } }, { new: true }
    );
    return updated.addresses;
  }

  async updateAddress(userId, addressId, addressData) {
    const update = {};
    Object.keys(addressData).forEach((key) => {
      update[`addresses.$.${key}`] = addressData[key];
    });

    const user = await userRepo.updateOne(
      { _id: userId, 'addresses._id': addressId },
      { $set: update },
      { new: true }
    );
    if (!user) throw ApiError.notFound('Address not found.');
    return user.addresses;
  }

  async deleteAddress(userId, addressId) {
    const user = await userRepo.updateById(userId,
      { $pull: { addresses: { _id: addressId } } }, { new: true }
    );
    if (!user) throw ApiError.notFound('User not found.');
    return user.addresses;
  }

  async setDefaultAddress(userId, addressId) {
    await userRepo.updateById(userId, { $set: { 'addresses.$[].isDefault': false } });
    return userRepo.updateOne(
      { _id: userId, 'addresses._id': addressId },
      { $set: { 'addresses.$.isDefault': true } },
      { new: true }
    );
  }

  async getWishlist(userId) {
    const user = await userRepo.findById(userId, {
      populate: [{ path: 'wishlist', select: 'name slug price thumbnail averageRating stock' }],
      select: 'wishlist',
    });
    return user?.wishlist || [];
  }

  async toggleWishlist(userId, productId) {
    const user = await userRepo.findById(userId, { select: 'wishlist' });
    if (!user) throw ApiError.notFound('User not found.');

    const isWishlisted = user.wishlist.some((id) => id.toString() === productId);
    if (isWishlisted) {
      await userRepo.removeFromWishlist(userId, productId);
      return { wishlisted: false };
    } else {
      await userRepo.addToWishlist(userId, productId);
      return { wishlisted: true };
    }
  }
}

module.exports = new UserService();
