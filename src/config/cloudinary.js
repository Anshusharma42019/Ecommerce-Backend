'use strict';

const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

logger.info('✅ Cloudinary configured.');

/**
 * Create a Cloudinary multer storage for a specific resource folder
 */
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `${process.env.CLOUDINARY_FOLDER || 'triven-ecommerce'}/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
      resource_type: 'image',
      use_filename: false,
      unique_filename: true,
    }),
  });
};

/**
 * Delete a Cloudinary resource by public_id
 */
const deleteCloudinaryResource = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (err) {
    logger.error('Cloudinary delete error:', err.message);
    throw err;
  }
};

/**
 * Upload a buffer directly to Cloudinary
 */
const uploadBuffer = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${process.env.CLOUDINARY_FOLDER || 'triven-ecommerce'}/${folder}`,
        resource_type: 'auto',
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { cloudinary, createCloudinaryStorage, deleteCloudinaryResource, uploadBuffer };
