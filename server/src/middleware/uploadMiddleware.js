const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine villageId and patientId
    const patientId = req.patient ? req.patient._id.toString() : 'unknown_patient';
    const villageId = req.patient && req.patient.villageId ? req.patient.villageId.toString() : 'unknown_village';
    
    // e.g. server/uploads/asha/{villageId}/{patientId}/
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'asha', villageId, patientId);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate filenames using a timestamp + random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // MIME-type whitelist: image/jpeg, image/png, application/pdf only
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
