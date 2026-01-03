const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getRequest,
  updateRequestStatus,
  getBuyerRequests,
  getSellerRequests
} = require('../controllers/requestController');
const { auth, buyerAuth, sellerAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const requestValidation = [
  body('requestedQuantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// Buyer routes
router.post('/', auth, buyerAuth, requestValidation, createRequest);
router.get('/buyer/my-requests', auth, buyerAuth, getBuyerRequests);

// Seller routes
router.get('/seller/my-requests', auth, sellerAuth, getSellerRequests);
router.patch('/seller/:id/status', auth, sellerAuth, updateRequestStatus);

// Common routes
router.get('/:id', auth, getRequest);

module.exports = router;