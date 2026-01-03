const Support = require('../models/Support');
const { validationResult } = require('express-validator');

// Create support request
const createSupport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type,
      title,
      description,
      category,
      urgency,
      requiredAmount,
      materialsRequired
    } = req.body;

    // Handle uploaded attachments
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.filename,
      filePath: file.path
    })) : [];

    // Parse materialsRequired if provided
    let materialsArray = [];
    if (materialsRequired) {
      try {
        materialsArray = typeof materialsRequired === 'string' 
          ? JSON.parse(materialsRequired)
          : materialsRequired;
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid materialsRequired format'
        });
      }
    }

    const support = await Support.create({
      seller: req.user._id,
      type,
      title,
      description,
      category,
      urgency,
      requiredAmount: requiredAmount ? parseFloat(requiredAmount) : undefined,
      materialsRequired: materialsArray,
      attachments
    });

    await support.populate('seller', 'username personalDetails.fullName disabilityType');

    res.status(201).json({
      status: 'success',
      message: 'Support request submitted successfully',
      data: {
        support
      }
    });
  } catch (error) {
    console.error('Create support error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating support request'
    });
  }
};

// Get support requests (admin)
const getSupportRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      urgency,
      category
    } = req.query;

    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (urgency && urgency !== 'all') filter.urgency = urgency;
    if (category && category !== 'all') filter.category = category;

    const requests = await Support.find(filter)
      .populate('seller', 'username personalDetails.fullName disabilityType')
      .populate('assignedTo', 'username personalDetails.fullName')
      .sort({ urgency: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Support.countDocuments(filter);

    // Statistics
    const stats = await Support.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        requests,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get support requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching support requests'
    });
  }
};

// Get single support request
const getSupportRequest = async (req, res) => {
  try {
    const request = await Support.findById(req.params.id)
      .populate('seller', 'username personalDetails.fullName disabilityType email')
      .populate('assignedTo', 'username personalDetails.fullName');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Support request not found'
      });
    }

    // Check access rights
    if (req.user.role === 'seller' && request.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this support request'
      });
    }

    res.json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Get support request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching support request'
    });
  }
};

// Update support request (admin only)
const updateSupportRequest = async (req, res) => {
  try {
    const {
      status,
      assignedTo,
      adminNotes,
      receivedAmount,
      materialsReceived,
      completionDate
    } = req.body;

    const request = await Support.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Support request not found'
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (adminNotes) updates.adminNotes = adminNotes;
    if (receivedAmount !== undefined) updates.receivedAmount = parseFloat(receivedAmount);
    if (completionDate) updates.completionDate = completionDate;

    // Handle materials received
    if (materialsReceived) {
      let newMaterials = [];
      try {
        newMaterials = typeof materialsReceived === 'string' 
          ? JSON.parse(materialsReceived)
          : materialsReceived;
        
        // Add received date to new materials
        newMaterials = newMaterials.map(material => ({
          ...material,
          receivedAt: new Date()
        }));
        
        updates.materialsReceived = [...request.materialsReceived, ...newMaterials];
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid materialsReceived format'
        });
      }
    }

    const updatedRequest = await Support.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
    .populate('seller', 'username personalDetails.fullName disabilityType email')
    .populate('assignedTo', 'username personalDetails.fullName');

    res.json({
      status: 'success',
      message: 'Support request updated successfully',
      data: {
        request: updatedRequest
      }
    });
  } catch (error) {
    console.error('Update support request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating support request'
    });
  }
};

// Get seller's support requests
const getMySupportRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { seller: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const requests = await Support.find(filter)
      .populate('assignedTo', 'username personalDetails.fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Support.countDocuments(filter);

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
    console.error('Get my support requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching support requests'
    });
  }
};

module.exports = {
  createSupport,
  getSupportRequests,
  getSupportRequest,
  updateSupportRequest,
  getMySupportRequests
};