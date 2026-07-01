const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary with credentials from environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Verify configuration on startup
const verifyCloudinaryConfig = async () => {
  try {
    await cloudinary.api.ping();
    logger.info('Cloudinary connected successfully');
  } catch (error) {
    logger.error(`Cloudinary configuration error: ${error.message}`);
    logger.warn('Image uploads will not work without valid Cloudinary credentials');
  }
};

// Folder structure for organized storage
const FOLDERS = {
  PROPERTY_IMAGES: 'nestfind/properties',
  PROPERTY_DOCUMENTS: 'nestfind/property-docs',
  USER_AVATARS: 'nestfind/avatars',
  KYC_DOCUMENTS: 'nestfind/kyc',
  BLOG_IMAGES: 'nestfind/blog',
};

// Transformation presets per upload type
const TRANSFORMATIONS = {
  property: [
    { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
  ],
  thumbnail: [
    { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
    { quality: 'auto:eco' },
    { fetch_format: 'auto' },
  ],
  avatar: [
    { width: 200, height: 200, crop: 'fill', gravity: 'face' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
  ],
  blog: [
    { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
  ],
};

// Upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, transformation = [], resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          reject(new Error(`Image upload failed: ${error.message}`));
        } else {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Delete a file from Cloudinary by public_id
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    if (result.result === 'ok') {
      logger.info(`Cloudinary file deleted: ${publicId}`);
      return true;
    }
    logger.warn(`Cloudinary delete returned: ${result.result} for ${publicId}`);
    return false;
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Delete multiple files at once
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) return;
    const result = await cloudinary.api.delete_resources(publicIds);
    logger.info(`Cloudinary bulk delete: ${publicIds.length} files removed`);
    return result;
  } catch (error) {
    logger.error(`Cloudinary bulk delete error: ${error.message}`);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};

// Generate a signed URL for secure private file access
const getSignedUrl = (publicId, expiresAt = Math.floor(Date.now() / 1000) + 3600) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

module.exports = {
  cloudinary,
  verifyCloudinaryConfig,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getSignedUrl,
  FOLDERS,
  TRANSFORMATIONS,
};
