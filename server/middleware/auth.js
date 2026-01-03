const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is valid but user no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed.'
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authorization failed.'
    });
  }
};

const sellerAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Seller role required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authorization failed.'
    });
  }
};
const ngoAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. NGO role required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authorization failed.'
    });
  }
};
const buyerAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Buyer role required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authorization failed.'
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  sellerAuth,
  buyerAuth,
  ngoAuth
};