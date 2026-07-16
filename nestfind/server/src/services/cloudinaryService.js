// nestfind/nestfind/server/src/services/cloudinaryService.js

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// ── CLOUDINARY CONFIG ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── FOLDER STRUCTURE ──────────────────────────────────────────────────────────
const FOLDERS = {
  propertyImages: 'nestfind/properties',
  avatars: 'nestfind/avatars',
  kyc: 'nestfind/kyc',
  blog: 'nestfind/blog',
  maintenance: 'nestfind/maintenance',
  contracts: 'nestfind/contracts',
};

// ── UPLOAD FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {Object} options - Upload options
 * @returns {Object} - { public_id, url, secureUrl, width, height, format, fileSize }
 */
const uploadBuffer = async (buffer, options = {}) => {
  try {
    const uploadOptions = {
      folder: options.folder || FOLDERS.propertyImages,
      resource_type: options.resourceType || 'image',
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
      ...options.transformations,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return {
      success: true,
      public_id: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      fileSize: result.bytes,
      resourceType: result.resource_type,
    };
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Upload a property image with optimization.
 *
 * @param {Buffer} buffer - Image buffer
 * @param {string} propertyId - Property ID for folder organization
 * @returns {Object} - Upload result
 */
const uploadPropertyImage = async (buffer, propertyId) => {
  return uploadBuffer(buffer, {
    folder: `${FOLDERS.propertyImages}/${propertyId}`,
    transformations: {
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' },
      ],
    },
  });
};

/**
 * Upload a user avatar with square crop.
 *
 * @param {Buffer} buffer - Image buffer
 * @param {string} userId - User ID for naming
 * @returns {Object} - Upload result
 */
const uploadAvatar = async (buffer, userId) => {
  return uploadBuffer(buffer, {
    folder: FOLDERS.avatars,
    publicId: `avatar_${userId}`,
    transformations: {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
      ],
    },
  });
};

/**
 * Upload a KYC document.
 *
 * @param {Buffer} buffer - Document buffer
 * @param {string} userId - User ID
 * @param {string} docType - Document type (nationalId, selfie, etc.)
 * @returns {Object} - Upload result
 */
const uploadKYCDocument = async (buffer, userId, docType) => {
  return uploadBuffer(buffer, {
    folder: `${FOLDERS.kyc}/${userId}`,
    publicId: `${docType}_${userId}_${Date.now()}`,
    resourceType: 'auto',
    transformations: {
      transformation: [
        { quality: 'auto:best' },
      ],
    },
  });
};

/**
 * Upload a blog post cover image.
 *
 * @param {Buffer} buffer - Image buffer
 * @returns {Object} - Upload result
 */
const uploadBlogImage = async (buffer) => {
  return uploadBuffer(buffer, {
    folder: FOLDERS.blog,
    transformations: {
      transformation: [
        { width: 1200, height: 630, crop: 'fill', quality: 'auto:good' },
      ],
    },
  });
};

/**
 * Upload a maintenance request photo.
 *
 * @param {Buffer} buffer - Image buffer
 * @param {string} requestId - Maintenance request ID
 * @returns {Object} - Upload result
 */
const uploadMaintenancePhoto = async (buffer, requestId) => {
  return uploadBuffer(buffer, {
    folder: `${FOLDERS.maintenance}/${requestId}`,
    transformations: {
      transformation: [
        { width: 1000, height: 750, crop: 'limit', quality: 'auto' },
      ],
    },
  });
};

// ── DELETE FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Delete a single file from Cloudinary.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @returns {Object} - { success, result }
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return { success: false, error: 'No public_id provided' };

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === 'ok' || result.result === 'not found') {
      logger.info(`Cloudinary file deleted: ${publicId}`);
      return { success: true, result: result.result };
    }

    return { success: false, error: `Delete failed: ${result.result}` };
  } catch (error) {
    logger.error(`Cloudinary delete failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple files from Cloudinary.
 *
 * @param {Array} publicIds - Array of public_ids to delete
 * @param {string} resourceType - Resource type
 * @returns {Object} - { success, deleted, failed }
 */
const deleteMultipleFiles = async (publicIds, resourceType = 'image') => {
  if (!publicIds || publicIds.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    const deleted = Object.values(result.deleted).filter(
      (v) => v === 'deleted'
    ).length;
    const failed = publicIds.length - deleted;

    logger.info(`Cloudinary bulk delete: ${deleted} deleted, ${failed} failed`);
    return { success: true, deleted, failed, details: result.deleted };
  } catch (error) {
    logger.error(`Cloudinary bulk delete failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all files in a folder.
 *
 * @param {string} folderPath - Cloudinary folder path
 * @returns {Object} - Delete result
 */
const deleteFolder = async (folderPath) => {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);
    logger.info(`Cloudinary folder deleted: ${folderPath}`);
    return { success: true, result };
  } catch (error) {
    logger.error(`Cloudinary folder delete failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ── URL TRANSFORMATION ────────────────────────────────────────────────────────

/**
 * Generate a transformed image URL.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed URL
 */
const getTransformedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

/**
 * Get thumbnail URL for a property image.
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} - Thumbnail URL
 */
const getThumbnailUrl = (publicId, width = 400, height = 300) => {
  return getTransformedUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Get optimized image URL for web display.
 *
 * @param {string} publicId - Cloudinary public_id
 * @returns {string} - Optimized URL
 */
const getOptimizedUrl = (publicId) => {
  return getTransformedUrl(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
  });
};

// ── UTILITY ───────────────────────────────────────────────────────────────────

/**
 * Check if Cloudinary is properly configured.
 *
 * @returns {boolean} - true if configured
 */
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder'
  );
};

/**
 * Get Cloudinary usage statistics.
 *
 * @returns {Object} - Usage stats
 */
const getUsageStats = async () => {
  try {
    const result = await cloudinary.api.usage();
    return {
      success: true,
      storage: result.storage,
      bandwidth: result.bandwidth,
      requests: result.requests,
      resources: result.resources,
      credits: result.credits,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadBuffer,
  uploadPropertyImage,
  uploadAvatar,
  uploadKYCDocument,
  uploadBlogImage,
  uploadMaintenancePhoto,
  deleteFile,
  deleteMultipleFiles,
  deleteFolder,
  getTransformedUrl,
  getThumbnailUrl,
  getOptimizedUrl,
  isConfigured,
  getUsageStats,
  FOLDERS,
};