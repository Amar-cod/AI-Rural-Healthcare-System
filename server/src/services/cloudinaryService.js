/**
 * Cloudinary Upload Service
 * 
 * Handles file uploads to Cloudinary for persistent storage.
 * Falls back gracefully when Cloudinary is not configured (local dev).
 */

let cloudinaryConfigured = false;
let cloudinary;

try {
  cloudinary = require('cloudinary').v2;
  
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    cloudinaryConfigured = true;
  }
} catch (err) {
  // cloudinary package not installed — local dev without cloud uploads
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer from multer memoryStorage
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} options.resourceType - 'image', 'raw', or 'auto'
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!cloudinaryConfigured) {
      return reject(new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'));
    }

    const uploadOptions = {
      folder: options.folder || 'rhcs/uploads',
      resource_type: options.resourceType || 'auto',
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({
        url: result.secure_url,
        publicId: result.public_id
      });
    });

    // Write buffer to the upload stream
    uploadStream.end(buffer);
  });
};

/**
 * Check if Cloudinary is configured.
 * @returns {boolean}
 */
const isConfigured = () => cloudinaryConfigured;

module.exports = { uploadToCloudinary, isConfigured };
