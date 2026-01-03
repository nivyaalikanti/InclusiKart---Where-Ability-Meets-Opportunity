const Request = require('../models/Request');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Create request
const createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, requestedQuantity, message } = req.body;
    const buyerId = req.user._id;

    // Check if product exists and is approved
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot request unapproved products'
      });
    }

    // Check if buyer is not the seller
    if (product.seller.toString() === buyerId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot request your own product'
      });
    }

    // Check for existing active request
    const existingRequest = await Request.findOne({
      buyer: buyerId,
      product: productId,
      status: 'pending',
      isActive: true
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active request for this product'
      });
    }

    const request = await Request.create({
      buyer: buyerId,
      seller: product.seller,
      product: productId,
      requestedQuantity,
      message
    });

    await request.populate('buyer', 'username personalDetails.fullName');
    await request.populate('seller', 'username personalDetails.fullName');
    await request.populate('product', 'name images price');

    res.status(201).json({
      status: 'success',
      message: 'Request sent successfully to the seller',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating request'
    });
  }
};

// Get single request
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('seller', 'username personalDetails.fullName email')
      .populate('product', 'name images price description');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    // Check access rights
    const isBuyer = request.buyer._id.toString() === req.user._id.toString();
    const isSeller = request.seller._id.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this request'
      });
    }

    res.json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching request'
    });
  }
};

// Update request status (seller only)
const updateRequestStatus = async (req, res) => {
  try {
    const { status, responseMessage } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    const request = await Request.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found or access denied'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Request has already been processed'
      });
    }

    request.status = status;
    request.responseMessage = responseMessage;
    
    if (status === 'accepted') {
      // Update product quantity if accepted
      const product = await Product.findById(request.product);
      if (product) {
        product.quantity += request.requestedQuantity;
        await product.save();
      }
    }

    await request.save();
    await request.populate('buyer', 'username personalDetails.fullName email');
    await request.populate('product', 'name images');

    res.json({
      status: 'success',
      message: `Request ${status} successfully`,
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating request status'
    });
  }
};

// Get buyer requests
const getBuyerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { buyer: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const requests = await Request.find(filter)
      .populate('seller', 'username personalDetails.fullName')
      .populate('product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        requests,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get buyer requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching buyer requests'
    });
  }
};

// Get seller requests
const getSellerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { seller: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const requests = await Request.find(filter)
      .populate('buyer', 'username personalDetails.fullName email')
      .populate('product', 'name images price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(filter);

    // Statistics
    const pendingCount = await Request.countDocuments({ 
      seller: req.user._id, 
      status: 'pending' 
    });

    res.json({
      status: 'success',
      data: {
        requests,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        statistics: {
          pendingCount
        }
      }
    });
  } catch (error) {
    console.error('Get seller requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching seller requests'
    });
  }
};

module.exports = {
  createRequest,
  getRequest,
  updateRequestStatus,
  getBuyerRequests,
  getSellerRequests
};