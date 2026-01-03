const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/certificates',
    'uploads/products',
    'uploads/stories',
    'uploads/support',
    'uploads/help-requests' // Add this new directory
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'disabilityCertificate') {
      uploadPath += 'certificates/';
    } else if (file.fieldname === 'productImages') {
      uploadPath += 'products/';
    } else if (file.fieldname === 'storyMedia') {
      uploadPath += 'stories/';
    } else if (file.fieldname === 'supportAttachments') {
      uploadPath += 'support/';
    } else if (file.fieldname === 'attachments' || file.fieldname === 'proofFiles') {
      uploadPath += 'help-requests/'; // For NGO help requests
    } else {
      uploadPath += 'general/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    
    cb(null, baseName + '-' + uniqueSuffix + fileExtension);
  }
});

// File filter - UPDATED to include help request attachments
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const allowedDocumentTypes = /pdf|doc|docx/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm/;
  
  const isImage = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
  const isDocument = allowedDocumentTypes.test(path.extname(file.originalname).toLowerCase());
  const isVideo = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (file.fieldname === 'disabilityCertificate') {
    if (isImage || isDocument) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF documents are allowed for certificates'), false);
    }
  } else if (file.fieldname === 'productImages') {
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed for products'), false);
    }
  } else if (file.fieldname === 'storyMedia') {
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed for stories'), false);
    }
  } else if (file.fieldname === 'supportAttachments') {
    if (isImage || isDocument) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed for support requests'), false);
    }
  } else if (file.fieldname === 'attachments' || file.fieldname === 'proofFiles') {
    // For help requests: allow images, documents
    if (isImage || isDocument) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents (PDF, DOC) are allowed for help requests'), false);
    }
  } else {
    cb(new Error('Unexpected file type'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

// Specific upload configurations
const uploadCertificate = upload.single('disabilityCertificate');
const uploadProductImages = upload.array('productImages', 5);
const uploadStoryMedia = upload.single('storyMedia');
const uploadSupportFiles = upload.array('supportAttachments', 5);

// NEW: For help requests
const uploadHelpAttachments = upload.array('attachments', 5);
const uploadProofFiles = upload.array('proofFiles', 5);
const uploadHelpRequestFiles = upload.fields([
  { name: 'attachments', maxCount: 5 },
  { name: 'proofFiles', maxCount: 5 }
]);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum allowed is 5.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  // Export the multer instance for direct use
  upload,
  
  // Existing exports
  uploadCertificate,
  uploadProductImages,
  uploadStoryMedia,
  uploadSupportFiles,
  handleUploadError,
  
  // NEW exports for help requests
  uploadHelpAttachments,
  uploadProofFiles,
  uploadHelpRequestFiles
};