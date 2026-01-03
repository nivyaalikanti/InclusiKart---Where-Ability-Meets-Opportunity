const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Story = require('../models/Story');
const Support = require('../models/Support');
const Request = require('../models/Request');
const { sendSms, normalizePhone } = require('../utils/smsService');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalStories = await Story.countDocuments();

    // Pending counts
    // Count only sellers who have uploaded a disability certificate file
    const pendingVerifications = await User.countDocuments({ 
      role: 'seller', 
      profileStatus: 'pending',
      'disabilityCertificate.filePath': { $exists: true, $ne: '' }
    });
    const pendingProducts = await Product.countDocuments({ status: 'pending' });
    const pendingStories = await Story.countDocuments({ status: 'pending' });
    const pendingSupport = await Support.countDocuments({ status: 'pending' });

    // Recent activities
    const recentOrders = await Order.find()
      .populate('buyer', 'username personalDetails.fullName')
      .populate('seller', 'username personalDetails.fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email role profileStatus createdAt');

    // Sales statistics
    const salesData = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          totalSellers,
          totalBuyers,
          totalProducts,
          totalOrders,
          totalStories
        },
        pending: {
          verifications: pendingVerifications,
          products: pendingProducts,
          stories: pendingStories,
          support: pendingSupport
        },
        sales: {
          total: salesData[0]?.totalSales || 0,
          orders: salesData[0]?.totalOrders || 0,
          monthly: monthlySales
        },
        recentActivities: {
          orders: recentOrders,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// Get pending verifications
const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Only include sellers who have uploaded a disability certificate
    const sellers = await User.find({ 
      role: 'seller', 
      profileStatus: 'pending',
      'disabilityCertificate.filePath': { $exists: true, $ne: '' }
    })
    .select('username email personalDetails disabilityCertificate createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await User.countDocuments({ 
      role: 'seller', 
      profileStatus: 'pending' 
    });

    res.json({
      status: 'success',
      data: {
        sellers,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching pending verifications'
    });
  }
};

// Verify seller
const verifySeller = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }

    const seller = await User.findOneAndUpdate(
      { 
        _id: req.params.id, 
        role: 'seller',
        profileStatus: 'pending'
      },
      {
        profileStatus: status,
        adminNotes,
        ...(status === 'verified' && { 
          'disabilityCertificate.verified': true 
        })
      },
      { new: true }
    ).select('username email personalDetails profileStatus adminNotes');

    if (!seller) {
      return res.status(404).json({
        status: 'error',
        message: 'Seller not found or already processed'
      });
    }

    res.json({
      status: 'success',
      message: `Seller ${status} successfully`,
      data: {
        seller
      }
    });

    // Notify seller by SMS when verified (non-blocking)
    try {
      if (status === 'verified') {
        let phone = seller.personalDetails?.phoneNumber;
        phone = normalizePhone(phone);
        if (phone) {
          const name = seller.personalDetails?.fullName || seller.username;
          const message = `Congratulations ${name}! Your account on InclusiKart has been verified by our team. You can now list products, sell, and share your stories. Log in to your dashboard to get started — we can't wait to see what you'll create!`;
          sendSms(phone, message);
        }
      } else if (status === 'rejected') {
        let phone = seller.personalDetails?.phoneNumber;
        phone = normalizePhone(phone);
        if (phone) {
          const name = seller.personalDetails?.fullName || seller.username;
          const message = `Hello ${name}, thank you for submitting your verification. At this time your verification was not approved. Please check your profile and re-upload any required documents, then resubmit. If you need help, contact support.`;
          sendSms(phone, message);
        }
      }
    } catch (smsErr) {
      console.error('Failed to send verification SMS:', smsErr?.message || smsErr);
    }
  } catch (error) {
    console.error('Verify seller error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying seller'
    });
  }
};

// Get pending products
const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ status: 'pending' })
      .populate('seller', 'username personalDetails.fullName profileStatus')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ status: 'pending' });

    res.json({
      status: 'success',
      data: {
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching pending products'
    });
  }
};

// Get pending stories
const getPendingStories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const stories = await Story.find({ status: 'pending' })
      .populate('author', 'username personalDetails.fullName profileStatus disabilityType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Story.countDocuments({ status: 'pending' });

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
    console.error('Get pending stories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching pending stories'
    });
  }
};

// Get users with filtering
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.profileStatus = status;

    const users = await User.find(filter)
      .select('username email role profileStatus personalDetails.fullName createdAt lastLogin isActive')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching users'
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('username email role isActive');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating user status'
    });
  }
};

module.exports = {
  getDashboardStats,
  getPendingVerifications,
  verifySeller,
  getPendingProducts,
  getPendingStories,
  getUsers,
  updateUserStatus
};