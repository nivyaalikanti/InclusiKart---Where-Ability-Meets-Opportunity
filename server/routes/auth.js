//5c4b7573a0922768be0548b1483d90586c836b44f8d47e357dbed1963d5bb84eac02f21d38587d1dd6bbf72d8c7ff6bb4e1565725436a6ceef9043fe093ed228
const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { uploadCertificate, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const NGO = require('../models/NGO');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['seller', 'buyer', 'ngo']) // Add 'ngo' to allowed roles
    .withMessage('Role must be either seller, buyer, or ngo')
];

// NGO Registration Validation
const ngoRegisterValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('ngoName')
    .notEmpty()
    .withMessage('NGO name is required')
    .isLength({ min: 3 })
    .withMessage('NGO name must be at least 3 characters long'),
  body('registrationNumber')
    .notEmpty()
    .withMessage('Registration number is required')
    .isAlphanumeric()
    .withMessage('Registration number must be alphanumeric'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please enter a valid website URL')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Regular registration (for buyers and sellers)
router.post('/register', registerValidation, register);

// NGO Registration Route
router.post('/register/ngo', ngoRegisterValidation, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      ngoName, 
      registrationNumber,
      phone,
      website,
      description,
      focusAreas
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Check if registration number already exists
    const existingNGO = await NGO.findOne({ registrationNumber });
    if (existingNGO) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration number already exists'
      });
    }

    // Create new user with NGO role
    user = new User({
      username: email.split('@')[0] + '_ngo', // Generate username from email
      name,
      email,
      password,
      role: 'ngo',
      phone: phone || '',
      isActive: false, // NGOs need admin approval
      isVerified: false
    });

    await user.save();

    // Create NGO profile
    const ngo = new NGO({
      user: user._id,
      ngoName,
      registrationNumber,
      description: description || '',
      focusAreas: focusAreas ? focusAreas.split(',').map(area => area.trim()) : [],
      contactPerson: {
        name: name,
        email: email,
        phone: phone || ''
      },
      website: website || '',
      verificationStatus: 'pending',
      documents: [],
      capacity: {
        maxRequestsPerMonth: 10,
        currentlyHandling: 0
      }
    });

    await ngo.save();

    // Generate token (limited access until verified)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    user = user.toObject();
    delete user.password;

    res.status(201).json({
      status: 'success',
      message: 'NGO registration submitted for admin approval',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified
        },
        ngo: {
          ngoName,
          registrationNumber,
          verificationStatus: 'pending'
        }
      }
    });

  } catch (error) {
    console.error('NGO Registration Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Duplicate entry. Please check your information.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Server error during NGO registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// NGO Login (special login for NGOs)
// Extract NGO login handler so we can support two URL shapes (`/login/ngo` and `/ngo/login`)
const ngoLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is NGO
    if (user.role !== 'ngo') {
      return res.status(403).json({
        status: 'error',
        message: 'This account is not registered as an NGO'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your NGO account is pending admin approval'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if NGO profile is verified
    const ngoProfile = await NGO.findOne({ user: user._id });
    if (!ngoProfile || ngoProfile.verificationStatus !== 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'NGO profile not verified. Please contact admin.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: 'NGO login successful',
      data: {
        token,
        user: userResponse,
        ngo: {
          ngoName: ngoProfile.ngoName,
          verificationStatus: ngoProfile.verificationStatus,
          focusAreas: ngoProfile.focusAreas
        }
      }
    });

  } catch (error) {
    console.error('NGO Login Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during NGO login'
    });
  }
};

// Keep original path
router.post('/login/ngo', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], ngoLoginHandler);

// Also accept the alternate path used by some clients: /ngo/login
router.post('/ngo/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], ngoLoginHandler);

// Regular login (for all users)
router.post('/login', loginValidation, login);

// Get current user
router.get('/me', auth, getMe);

// Profile update with file upload
router.put(
  '/profile', 
  auth, 
  uploadCertificate,
  handleUploadError,
  updateProfile
);

// NGO Profile Update
router.put(
  '/profile/ngo',
  auth,
  async (req, res) => {
    try {
      // Check if user is NGO
      if (req.user.role !== 'ngo') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. NGO role required.'
        });
      }

      const {
        ngoName,
        description,
        focusAreas,
        contactPersonName,
        contactPersonPosition,
        contactPersonPhone,
        website,
        address,
        yearsOfOperation
      } = req.body;

      // Find and update NGO profile
      const ngoProfile = await NGO.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            ngoName,
            description,
            focusAreas: focusAreas ? focusAreas.split(',').map(area => area.trim()) : [],
            contactPerson: {
              name: contactPersonName,
              position: contactPersonPosition,
              phone: contactPersonPhone
            },
            website,
            address: address ? JSON.parse(address) : undefined,
            yearsOfOperation
          }
        },
        { new: true, runValidators: true }
      );

      if (!ngoProfile) {
        return res.status(404).json({
          status: 'error',
          message: 'NGO profile not found'
        });
      }

      res.json({
        status: 'success',
        message: 'NGO profile updated successfully',
        data: ngoProfile
      });

    } catch (error) {
      console.error('Update NGO Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Server error updating NGO profile'
      });
    }
  }
);

// Change password
router.put('/password', auth, changePassword);

// Logout
router.post('/logout', auth, logout);

module.exports = router;