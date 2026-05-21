'use strict';

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createCloudinaryStorage } = require('../config/cloudinary');
const ApiError = require('../helpers/ApiError');
const { UPLOAD } = require('../constants');

// Check if Cloudinary is configured with real credentials
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return (
    name && name !== 'your_cloud_name' &&
    key && key !== 'your_api_key' &&
    secret && secret !== 'your_api_secret'
  );
};

// Local storage configuration fallback
const getLocalStorage = (folder) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

const fileFilter = (req, file, cb) => {
  if (UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// Master wrapper to handle dynamic fallback and local path remapping seamlessly
const makeDynamicUpload = (folder, options = {}) => {
  const isCloudy = isCloudinaryConfigured();
  const storage = isCloudy ? createCloudinaryStorage(folder) : getLocalStorage(folder);
  const uploader = multer({
    storage,
    limits: options.limits || { fileSize: UPLOAD.MAX_SIZE_BYTES },
    fileFilter: options.fileFilter || fileFilter,
  });

  const mapFiles = (req) => {
    if (!isCloudy) {
      if (req.file && !req.file.path.startsWith('http')) {
        req.file.path = `/uploads/${folder}/${req.file.filename}`;
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files.forEach(f => {
            if (f.path && !f.path.startsWith('http')) {
              f.path = `/uploads/${folder}/${f.filename}`;
            }
          });
        } else {
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach(f => {
              if (f.path && !f.path.startsWith('http')) {
                f.path = `/uploads/${folder}/${f.filename}`;
              }
            });
          });
        }
      }
    }
  };

  return {
    single: (fieldname) => (req, res, next) => {
      uploader.single(fieldname)(req, res, (err) => {
        if (err) return next(err);
        mapFiles(req);
        next();
      });
    },
    array: (fieldname, maxCount) => (req, res, next) => {
      uploader.array(fieldname, maxCount)(req, res, (err) => {
        if (err) return next(err);
        mapFiles(req);
        next();
      });
    },
    fields: (fields) => (req, res, next) => {
      uploader.fields(fields)(req, res, (err) => {
        if (err) return next(err);
        mapFiles(req);
        next();
      });
    },
    any: () => (req, res, next) => {
      uploader.any()(req, res, (err) => {
        if (err) return next(err);
        mapFiles(req);
        next();
      });
    }
  };
};

const productUpload = makeDynamicUpload('products', {
  limits: { fileSize: UPLOAD.MAX_SIZE_BYTES, files: UPLOAD.MAX_PRODUCT_IMAGES }
});

const avatarUpload = makeDynamicUpload('avatars', {
  limits: { fileSize: 2 * 1024 * 1024 }
});

const categoryUpload = makeDynamicUpload('categories', {
  limits: { fileSize: UPLOAD.MAX_SIZE_BYTES }
});

const reviewUpload = makeDynamicUpload('reviews', {
  limits: { fileSize: UPLOAD.MAX_SIZE_BYTES, files: 5 }
});

// Generic multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return next(ApiError.badRequest(`File too large. Max size: ${UPLOAD.MAX_SIZE_MB}MB`));
    if (err.code === 'LIMIT_FILE_COUNT') return next(ApiError.badRequest(`Too many files. Max: ${UPLOAD.MAX_PRODUCT_IMAGES}`));
    return next(ApiError.badRequest(`Upload error: ${err.message}`));
  }
  next(err);
};

module.exports = { productUpload, avatarUpload, categoryUpload, reviewUpload, handleMulterError };
