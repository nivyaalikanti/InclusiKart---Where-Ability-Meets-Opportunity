const express = require('express');
const {
  getDashboardStats,
  getPendingVerifications,
  verifySeller,
  getPendingProducts,
  getPendingStories,
  getUsers,
  updateUserStatus
} = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(auth, adminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Verification management
router.get('/verifications/pending', getPendingVerifications);
router.patch('/verifications/:id', verifySeller);

// Product management
router.get('/products/pending', getPendingProducts);

// Story management
router.get('/stories/pending', getPendingStories);

module.exports = router;