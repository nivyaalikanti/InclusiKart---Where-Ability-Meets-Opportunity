const express = require('express');
const { body } = require('express-validator');
const {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  likeStory,
  addComment,
  updateStoryStatus
} = require('../controllers/storyController');
const { auth, sellerAuth, adminAuth } = require('../middleware/auth');
const { uploadStoryMedia, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const storyValidation = [
  body('title')
    .notEmpty()
    .withMessage('Story title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Story description is required')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters')
];

// Public routes
router.get('/', getStories);
router.get('/:id', getStory);

// Authenticated routes
router.post('/', auth, sellerAuth, uploadStoryMedia, storyValidation, handleUploadError, createStory);
router.put('/:id', auth, sellerAuth, uploadStoryMedia, storyValidation, handleUploadError, updateStory);
router.delete('/:id', auth, sellerAuth, deleteStory);
router.post('/:id/like', auth, likeStory);
router.post('/:id/comment', auth, addComment);

// Admin routes
router.patch('/:id/status', auth, adminAuth, updateStoryStatus);

module.exports = router;