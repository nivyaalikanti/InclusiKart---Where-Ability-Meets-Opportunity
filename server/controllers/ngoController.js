const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const NGO = require('../models/NGO');
const mongoose = require('mongoose');

// @desc    Get all help requests for NGO dashboard
// @route   GET /api/ngo/requests
// @access  Private (NGO only)
const getAllHelpRequests = async (req, res) => {
  try {
    const ngoId = req.ngo._id;
    const { 
      status, 
      requestType, 
      urgencyLevel, 
      page = 1, 
      limit = 20,
      assignedToMe,
      search
    } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default: show pending and under_review requests
      query.status = { $in: ['pending', 'under_review'] };
    }
    
    // Filter by request type
    if (requestType) {
      query.requestType = requestType;
    }
    
    // Filter by urgency
    if (urgencyLevel) {
      query.urgencyLevel = urgencyLevel;
    }
    
    // Filter by assignment
    if (assignedToMe === 'true') {
      query.ngoAssigned = req.user._id;
    } else if (assignedToMe === 'false') {
      query.ngoAssigned = { $exists: false };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get requests with seller basic info
    const requests = await HelpRequest.find(query)
      .sort({ 
        urgencyLevel: -1, // Critical first
        createdAt: -1 
      })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('seller', 'name email phone businessName profileImage')
      .populate('ngoAssigned', 'name email ngoName');
    
    const total = await HelpRequest.countDocuments(query);
    
    // Get statistics
    const stats = await HelpRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const statusStats = {};
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      stats: statusStats,
      ngoCapacity: {
        max: req.ngo.capacity?.maxRequestsPerMonth || 10,
        current: req.ngo.capacity?.currentlyHandling || 0,
        canTakeMore: req.ngo.canTakeRequest()
      }
    });
    
  } catch (error) {
    console.error('Get All Help Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching help requests',
      error: error.message
    });
  }
};

// @desc    Get detailed help request with seller information
// @route   GET /api/ngo/requests/:id
// @access  Private (NGO only)
const getHelpRequestDetails = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Get help request with full seller details
    const helpRequest = await HelpRequest.findById(requestId)
      .populate({
        path: 'seller',
        select: 'name email phone businessName address profileImage createdAt bio',
        populate: {
          path: 'products',
          select: 'name price images category stock createdAt',
          options: { limit: 10 }
        }
      })
      .populate('ngoAssigned', 'name email ngoName contactPerson phone')
      .populate('fulfillmentDetails.fulfilledBy', 'name email ngoName');
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }
    
    // Get seller's statistics
    const sellerId = helpRequest.seller._id;
    
    // Get total products count
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    
    // Get total sales
    const salesData = await Order.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId), status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent orders
    const recentOrders = await Order.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'name email');
    
    // Get product categories
    const productCategories = await Product.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Prepare seller statistics
    const sellerStats = {
      totalProducts,
      totalSales: salesData[0]?.totalSales || 0,
      totalOrders: salesData[0]?.totalOrders || 0,
      recentOrders,
      productCategories,
      memberSince: helpRequest.seller.createdAt
    };
    
    res.json({
      success: true,
      data: {
        helpRequest,
        sellerStats
      }
    });
    
  } catch (error) {
    console.error('Get Help Request Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching help request details',
      error: error.message
    });
  }
};

// @desc    Assign help request to NGO
// @route   PUT /api/ngo/requests/:id/assign
// @access  Private (NGO only)
const assignHelpRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const ngoUserId = req.user._id;
    // ensure we have an ObjectId instance for aggregation match
    const ngoOid = (typeof ngoUserId === 'string') ? new mongoose.Types.ObjectId(ngoUserId) : ngoUserId;

    // Some requests may not have `req.ngo` populated by middleware; fetch NGO profile if needed
    let ngoProfileId = req.ngo && req.ngo._id;
    if (!ngoProfileId) {
      const ngoRecord = await NGO.findOne({ user: ngoUserId }).select('_id');
      if (!ngoRecord) {
        return res.status(403).json({
          success: false,
          message: 'NGO profile not found for this user'
        });
      }
      ngoProfileId = ngoRecord._id;
    }
    
    // Check if NGO can take more requests
    if (!req.ngo.canTakeRequest()) {
      return res.status(400).json({
        success: false,
        message: 'You have reached your maximum capacity for this month'
      });
    }
    
    // Find the help request
    const helpRequest = await HelpRequest.findById(requestId);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }
    
    // Check if already assigned
    if (helpRequest.ngoAssigned) {
      return res.status(400).json({
        success: false,
        message: 'This request is already assigned to another NGO'
      });
    }
    
    // Check if request is still pending
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request is no longer available for assignment'
      });
    }
    
    // Assign to NGO
    helpRequest.ngoAssigned = ngoUserId;
    helpRequest.status = 'under_review';
    
    // Update NGO's currently handling count
    await NGO.findByIdAndUpdate(
      ngoProfileId,
      { $inc: { 'capacity.currentlyHandling': 1 } }
    );
    
    await helpRequest.save();
    
    res.json({
      success: true,
      message: 'Help request assigned successfully',
      data: helpRequest
    });
    
  } catch (error) {
    console.error('Assign Help Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning help request',
      error: error.message
    });
  }
};

// @desc    Update request status (NGO updates status when working on it)
// @route   PUT /api/ngo/requests/:id/status
// @access  Private (NGO only - assigned NGO)
const updateRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id;
    const ngoUserId = req.user._id;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Find request and verify assignment
    const helpRequest = await HelpRequest.findOne({
      _id: requestId,
      ngoAssigned: ngoUserId
    });
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found or not assigned to you'
      });
    }
    
    // Update status
    helpRequest.status = status;
    
    // Add notes if provided
    if (notes) {
      helpRequest.notes = notes;
    }
    
    // If fulfilled, update fulfillment details
    if (status === 'fulfilled') {
      helpRequest.fulfillmentDetails = {
        fulfilledBy: ngoUserId,
        fulfillmentDate: new Date(),
        notes: notes || 'Request fulfilled successfully'
      };
      
      // Update NGO's fulfilled count
      await NGO.findOneAndUpdate(
        { user: ngoUserId },
        { $inc: { totalRequestsFulfilled: 1, 'capacity.currentlyHandling': -1 } }
      );
    }
    
    // If rejected or cancelled, free up NGO capacity
    if (status === 'rejected' || status === 'cancelled') {
      await NGO.findOneAndUpdate(
        { user: ngoUserId },
        { $inc: { 'capacity.currentlyHandling': -1 } }
      );
    }
    
    await helpRequest.save();
    
    res.json({
      success: true,
      message: `Request status updated to ${status}`,
      data: helpRequest
    });
    
  } catch (error) {
    console.error('Update Request Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating request status',
      error: error.message
    });
  }
};

// @desc    Fulfill request with proof
// @route   POST /api/ngo/requests/:id/fulfill
// @access  Private (NGO only - assigned NGO)
const fulfillRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const ngoUserId = req.user._id;
    const { notes } = req.body;
    
    // Find request
    const helpRequest = await HelpRequest.findOne({
      _id: requestId,
      ngoAssigned: ngoUserId,
      status: 'in_progress'
    });
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or not in progress'
      });
    }
    
    // Update to fulfilled
    helpRequest.status = 'fulfilled';
    helpRequest.fulfillmentDetails = {
      fulfilledBy: ngoUserId,
      fulfillmentDate: new Date(),
      notes: notes || 'Request fulfilled successfully'
    };
    
    // Handle proof files
    if (req.files && req.files.length > 0) {
      helpRequest.fulfillmentDetails.proofOfFulfillment = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path
      }));
    }
    
    // Update NGO stats
    await NGO.findOneAndUpdate(
      { user: ngoUserId },
      { 
        $inc: { 
          totalRequestsFulfilled: 1,
          'capacity.currentlyHandling': -1
        }
      }
    );
    
    await helpRequest.save();
    
    res.json({
      success: true,
      message: 'Request marked as fulfilled successfully',
      data: helpRequest
    });
    
  } catch (error) {
    console.error('Fulfill Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fulfilling request',
      error: error.message
    });
  }
};

// @desc    Get NGO dashboard statistics
// @route   GET /api/ngo/dashboard/stats
// @access  Private (NGO only)
const getNGODashboardStats = async (req, res) => {
  try {
    // Debugging info
    console.log('getNGODashboardStats invoked - req.user:', req.user ? { id: req.user._id, role: req.user.role } : null);
    console.log('getNGODashboardStats invoked - req.ngo:', req.ngo ? { id: req.ngo._id } : null);

    // Ensure we have the authenticated user id
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const ngoUserId = req.user._id;
    const ngoOid = (typeof ngoUserId === 'string') ? new mongoose.Types.ObjectId(ngoUserId) : ngoUserId;

    // Resolve NGO profile id (req.ngo may or may not be set by middleware)
    let ngoProfileId = req.ngo && req.ngo._id;
    if (!ngoProfileId) {
      const ngoRecord = await NGO.findOne({ user: ngoUserId }).select('_id');
      if (!ngoRecord) {
        return res.status(403).json({ success: false, message: 'NGO profile not found for this user' });
      }
      ngoProfileId = ngoRecord._id;
    }

    // Aggregation to compute counts
    const requestCounts = await HelpRequest.aggregate([
      {
        $facet: {
          totalAssigned: [ { $match: { ngoAssigned: ngoOid } }, { $count: 'count' } ],
          pending: [ { $match: { ngoAssigned: ngoOid, status: 'pending' } }, { $count: 'count' } ],
          inProgress: [ { $match: { ngoAssigned: ngoOid, status: 'in_progress' } }, { $count: 'count' } ],
          fulfilled: [ { $match: { ngoAssigned: ngoOid, status: 'fulfilled' } }, { $count: 'count' } ],
          urgent: [ { $match: { ngoAssigned: ngoOid, urgencyLevel: 'critical', status: { $in: ['pending','under_review','in_progress'] } } }, { $count: 'count' } ]
        }
      }
    ]);

    // Get recent requests (use the same identifier)
    const recentRequests = await HelpRequest.find({ ngoAssigned: ngoOid })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('seller', 'name businessName');

    // Get NGO profile with capacity
    const ngoProfile = await NGO.findById(ngoProfileId).select('totalRequestsFulfilled capacity focusAreas rating');

    // Build stats response
    const stats = {
      totalAssigned: requestCounts[0]?.totalAssigned[0]?.count || 0,
      pending: requestCounts[0]?.pending[0]?.count || 0,
      inProgress: requestCounts[0]?.inProgress[0]?.count || 0,
      fulfilled: requestCounts[0]?.fulfilled[0]?.count || 0,
      urgent: requestCounts[0]?.urgent[0]?.count || 0,
      totalFulfilled: ngoProfile?.totalRequestsFulfilled || 0,
      capacity: ngoProfile?.capacity || { maxRequestsPerMonth: 10, currentlyHandling: 0 },
      focusAreas: ngoProfile?.focusAreas || [],
      rating: ngoProfile?.rating || { average: 0, totalReviews: 0 },
      recentRequests
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get NGO Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching NGO dashboard statistics', error: error.message });
  }
};

module.exports = {
  getAllHelpRequests,
  getHelpRequestDetails,
  assignHelpRequest,
  updateRequestStatus,
  fulfillRequest,
  getNGODashboardStats
};