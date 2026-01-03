const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');

const ngoAuth = async (req, res, next) => {
  try {
    // Check for token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is NGO
    if (user.role !== 'ngo') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. NGO role required' 
      });
    }

    // Check if NGO profile is verified
    const ngoProfile = await NGO.findOne({ user: user._id });
    
    if (!ngoProfile || ngoProfile.verificationStatus !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'NGO profile not verified or not found' 
      });
    }

    // Attach user and ngo profile to request
    req.user = user;
    req.ngo = ngoProfile;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('NGO Auth Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Optional: Auth for both NGO and Admin
const ngoOrAdminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Allow both NGO and Admin roles
    if (user.role !== 'ngo' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. NGO or Admin role required' 
      });
    }

    req.user = user;
    req.token = token;
    
    // If NGO, also attach NGO profile
    if (user.role === 'ngo') {
      const ngoProfile = await NGO.findOne({ user: user._id });
      if (ngoProfile) {
        req.ngo = ngoProfile;
      }
    }
    
    next();
  } catch (error) {
    console.error('NGO/Admin Auth Error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

module.exports = { ngoAuth, ngoOrAdminAuth };