const express = require('express');
const router = express.Router();
const { auth, sellerAuth } = require('../middleware/auth');
const { 
  uploadHelpAttachments, // Use the new export
  handleUploadError 
} = require('../middleware/upload'); // Updated import
const {
  createHelpRequest,
  getSellerHelpRequests,
  getHelpRequest,
  updateHelpRequest,
  deleteHelpRequest
} = require('../controllers/helpRequestController');

// All routes require authentication
router.use(auth);

// Create help request
router.post(
  '/requests', 
  sellerAuth, 
  uploadHelpAttachments, // Changed to use the specific function
  handleUploadError,
  createHelpRequest
);

// Get seller's help requests
router.get('/my-requests', sellerAuth, getSellerHelpRequests);

// Get single help request
router.get('/requests/:id', getHelpRequest);

// Update help request
router.put(
  '/requests/:id', 
  sellerAuth, 
  uploadHelpAttachments, // Changed to use the specific function
  handleUploadError,
  updateHelpRequest
);

// Delete help request
router.delete('/requests/:id', sellerAuth, deleteHelpRequest);

module.exports = router;