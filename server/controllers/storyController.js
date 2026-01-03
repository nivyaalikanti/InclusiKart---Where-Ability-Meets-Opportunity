const Story = require('../models/Story');
const { validationResult } = require('express-validator');

// Get all stories (with filtering)
const getStories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'approved',
      featured,
      author,
      search
    } = req.query;

    // Build filter: when status is 'all' or not provided, don't restrict by status
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    
    if (author) filter.author = author;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const stories = await Story.find(filter)
      .populate('author', 'username personalDetails.fullName profileStatus')
      .populate('comments.user', 'username personalDetails.fullName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Story.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        stories,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching stories'
    });
  }
};

// Get single story
const getStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate('author', 'username personalDetails.fullName profileStatus disabilityType')
    .populate('comments.user', 'username personalDetails.fullName')
    .populate('likes', 'username personalDetails.fullName');

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        story
      }
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching story'
    });
  }
};

// Create story
const createStory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, tags } = req.body;

    // Handle uploaded media
    const media = req.file ? {
      media: req.file.path,
      mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    } : {};

    const story = await Story.create({
      title,
      description,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      author: req.user._id,
      ...media,
      status: 'pending' // Stories need admin approval
    });

    await story.populate('author', 'username personalDetails.fullName');

    res.status(201).json({
      status: 'success',
      message: 'Story created successfully and submitted for approval',
      data: {
        story
      }
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating story'
    });
  }
};

// Update story
const updateStory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const story = await Story.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found or access denied'
      });
    }

    const updates = { ...req.body };
    
    // Parse tags if it's a string
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    // Handle new media if uploaded
    if (req.file) {
      updates.media = req.file.path;
      updates.mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    // Reset status to pending if significant changes are made
    if (updates.title || updates.description) {
      updates.status = 'pending';
    }

    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('author', 'username personalDetails.fullName');

    res.json({
      status: 'success',
      message: 'Story updated successfully',
      data: {
        story: updatedStory
      }
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating story'
    });
  }
};

// Delete story
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found or access denied'
      });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting story'
    });
  }
};

// Like/unlike story
const likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    const hasLiked = story.likes.includes(req.user._id);

    if (hasLiked) {
      // Unlike
      story.likes.pull(req.user._id);
      story.likesCount -= 1;
    } else {
      // Like
      story.likes.push(req.user._id);
      story.likesCount += 1;
    }

    await story.save();

    res.json({
      status: 'success',
      message: hasLiked ? 'Story unliked' : 'Story liked',
      data: {
        likesCount: story.likesCount,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('Like story error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating like'
    });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment cannot be empty'
      });
    }

    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    story.comments.push({
      user: req.user._id,
      comment: comment.trim()
    });
    
    story.commentsCount += 1;
    await story.save();

    await story.populate('comments.user', 'username personalDetails.fullName');

    const newComment = story.comments[story.comments.length - 1];

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: {
        comment: newComment
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while adding comment'
    });
  }
};

// Update story status (admin only)
const updateStoryStatus = async (req, res) => {
  try {
    const { status, adminNotes, isFeatured } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const updates = { status };
    if (adminNotes) updates.adminNotes = adminNotes;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;

    const story = await Story.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('author', 'username email personalDetails.fullName');

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found'
      });
    }

    res.json({
      status: 'success',
      message: `Story ${status} successfully`,
      data: {
        story
      }
    });
  } catch (error) {
    console.error('Update story status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating story status'
    });
  }
};

module.exports = {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  likeStory,
  addComment,
  updateStoryStatus
};