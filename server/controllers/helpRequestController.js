const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// @desc    Create a new help request
// @route   POST /api/help/requests
// @access  Private (Seller only)
const createHelpRequest = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Check if user is seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create help requests'
      });
    }

    const {
      requestType,
      category,
      title,
      description,
      urgencyLevel,
      quantity,
      unit,
      estimatedValue,
      deadline,
      notes
    } = req.body;

    // Basic validation
    if (!requestType || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide request type, title, and description'
      });
    }

    // Create help request
    const helpRequest = new HelpRequest({
      seller: sellerId,
      requestType,
      category,
      title,
      description,
      urgencyLevel: urgencyLevel || 'medium',
      quantity,
      unit,
      estimatedValue,
      deadline: deadline ? new Date(deadline) : null,
      notes,
      status: 'pending'
    });

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      helpRequest.attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype
      }));
    }

    await helpRequest.save();

    // Populate seller details in response
    await helpRequest.populate('seller', 'name email phone businessName');

    res.status(201).json({
      success: true,
      message: 'Help request created successfully',
      data: helpRequest
    });

  } catch (error) {
    console.error('Create Help Request Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating help request',
      error: error.message
    });
  }
};

// @desc    Get seller's help requests
// @route   GET /api/help/my-requests
// @access  Private (Seller only)
const getSellerHelpRequests = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = { seller: sellerId };
    
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requests = await HelpRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('ngoAssigned', 'name email ngoName');
    
    const total = await HelpRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get Seller Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching help requests',
      error: error.message
    });
  }
};

// @desc    Get single help request
// @route   GET /api/help/requests/:id
// @access  Private (Seller or NGO)
const getHelpRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let query = { _id: requestId };
    
    // Sellers can only see their own requests
    // NGOs can see any request
    if (userRole === 'seller') {
      query.seller = userId;
    }
    
    const helpRequest = await HelpRequest.findOne(query)
      .populate('seller', 'name email phone businessName address profileImage')
      .populate('ngoAssigned', 'name email ngoName contactPerson phone')
      .populate('fulfillmentDetails.fulfilledBy', 'name email ngoName');
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }
    
    res.json({
      success: true,
      data: helpRequest
    });
    
  } catch (error) {
    console.error('Get Help Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching help request',
      error: error.message
    });
  }
};

// @desc    Update help request (seller can update only pending requests)
// @route   PUT /api/help/requests/:id
// @access  Private (Seller only)
const updateHelpRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const sellerId = req.user._id;
    
    // Find request and verify ownership
    const helpRequest = await HelpRequest.findOne({
      _id: requestId,
      seller: sellerId,
      status: 'pending' // Only pending requests can be updated
    });
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found or cannot be updated'
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'category',
      'title',
      'description',
      'urgencyLevel',
      'quantity',
      'unit',
      'estimatedValue',
      'deadline',
      'notes'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        helpRequest[field] = req.body[field];
      }
    });
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype
      }));
      helpRequest.attachments.push(...newAttachments);
    }
    
    await helpRequest.save();
    
    res.json({
      success: true,
      message: 'Help request updated successfully',
      data: helpRequest
    });
    
  } catch (error) {
    console.error('Update Help Request Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating help request',
      error: error.message
    });
  }
};

// @desc    Delete help request (only if pending)
// @route   DELETE /api/help/requests/:id
// @access  Private (Seller only)
const deleteHelpRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const sellerId = req.user._id;
    
    const helpRequest = await HelpRequest.findOneAndDelete({
      _id: requestId,
      seller: sellerId,
      status: 'pending' // Only pending requests can be deleted
    });
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found or cannot be deleted'
      });
    }
    
    res.json({
      success: true,
      message: 'Help request deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete Help Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting help request',
      error: error.message
    });
  }
};

module.exports = {
  createHelpRequest,
  getSellerHelpRequests,
  getHelpRequest,
  updateHelpRequest,
  deleteHelpRequest
};