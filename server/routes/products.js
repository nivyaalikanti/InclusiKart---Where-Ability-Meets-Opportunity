const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  updateProductStatus
} = require('../controllers/productController');
const { auth, sellerAuth, adminAuth } = require('../middleware/auth');
const { uploadProductImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('category')
    .isIn(['handicraft', 'clothing', 'accessories', 'home-decor', 'art', 'other'])
    .withMessage('Invalid category')
];

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Seller routes
router.get('/seller/my-products', auth, sellerAuth, getSellerProducts);
router.post('/', auth, sellerAuth, uploadProductImages, productValidation, handleUploadError, createProduct);
router.put('/:id', auth, sellerAuth, uploadProductImages, productValidation, handleUploadError, updateProduct);
router.delete('/:id', auth, sellerAuth, deleteProduct);

// Admin routes
router.patch('/:id/status', auth, adminAuth, updateProductStatus);

module.exports = router;