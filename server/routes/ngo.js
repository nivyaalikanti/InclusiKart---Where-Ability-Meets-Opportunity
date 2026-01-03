const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  uploadProofFiles, // Use the new export
  handleUploadError 
} = require('../middleware/upload'); // Updated import
const {
  getAllHelpRequests,
  getHelpRequestDetails,
  assignHelpRequest,
  updateRequestStatus,
  fulfillRequest,
  getNGODashboardStats
} = require('../controllers/ngoController');

// Middleware to check if user is NGO and attach NGO profile to request
const NGOModel = require('../models/NGO');
const requireNGO = async (req, res, next) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. NGO role required.'
      });
    }

    // Load NGO profile and attach to req
    const ngoProfile = await NGOModel.findOne({ user: req.user._id });
    if (!ngoProfile) {
      return res.status(403).json({
        status: 'error',
        message: 'NGO profile not found for this user.'
      });
    }

    req.ngo = ngoProfile;
    next();
  } catch (err) {
    console.error('requireNGO middleware error:', err);
    res.status(500).json({ status: 'error', message: 'Server error validating NGO access' });
  }
};

// All routes require authentication
router.use(auth);

// Apply NGO role check to all routes
router.use(requireNGO);

// NGO Dashboard Statistics
router.get('/dashboard/stats', getNGODashboardStats);

// Get all help requests
router.get('/requests', getAllHelpRequests);

// Get detailed help request
router.get('/requests/:id', getHelpRequestDetails);

// Assign help request to NGO
router.put('/requests/:id/assign', assignHelpRequest);

// Update request status
router.put('/requests/:id/status', updateRequestStatus);

// Fulfill request with proof
router.post(
  '/requests/:id/fulfill', 
  uploadProofFiles, // Changed to use the specific function
  handleUploadError,
  fulfillRequest
);

module.exports = router;