const express = require('express');
const { body } = require('express-validator');
const {
  createSupport,
  getSupportRequests,
  getSupportRequest,
  updateSupportRequest,
  getMySupportRequests
} = require('../controllers/supportController');
const { auth, sellerAuth, adminAuth } = require('../middleware/auth');
const { uploadSupportFiles, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const supportValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('type')
    .isIn(['donation', 'raw_materials'])
    .withMessage('Invalid support type'),
  body('category')
    .isIn(['financial', 'materials', 'equipment', 'training', 'other'])
    .withMessage('Invalid category'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid urgency level')
];

// Seller routes
router.get('/my-requests', auth, sellerAuth, getMySupportRequests);
router.post('/', auth, sellerAuth, uploadSupportFiles, supportValidation, handleUploadError, createSupport);
router.get('/seller/:id', auth, sellerAuth, getSupportRequest);

// Admin routes
router.get('/', auth, adminAuth, getSupportRequests);
router.get('/admin/:id', auth, adminAuth, getSupportRequest);
router.patch('/admin/:id', auth, adminAuth, updateSupportRequest);

module.exports = router;