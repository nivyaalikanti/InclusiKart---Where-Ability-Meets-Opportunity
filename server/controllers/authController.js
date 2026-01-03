const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSms, normalizePhone } = require('../utils/smsService');

// Register user - UPDATED VERSION
const register = async (req, res) => {
  try {
    console.log('=== REGISTRATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, role } = req.body;
    
    // Parse personalDetails if it's a string
    let personalDetails = {};
    if (req.body.personalDetails) {
      if (typeof req.body.personalDetails === 'string') {
        try {
          personalDetails = JSON.parse(req.body.personalDetails);
        } catch (err) {
          console.log('Failed to parse personalDetails as JSON, using as-is');
          personalDetails = { address: req.body.personalDetails };
        }
      } else {
        personalDetails = req.body.personalDetails;
      }
    }

    console.log('Parsed personalDetails:', personalDetails);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email or username'
      });
    }

    // Prepare user data
    const userData = {
      username,
      email,
      password,
      role,
      personalDetails: role === 'seller' ? {
        fullName: personalDetails.fullName || '',
        dateOfBirth: personalDetails.dateOfBirth || null,
        address: personalDetails.address || '',
        disabilityType: personalDetails.disabilityType || '',
        phoneNumber: normalizePhone(personalDetails.phoneNumber || '')
      } : undefined
    };

    console.log('Creating user with data:', userData);

    // Create user
    const user = await User.create(userData);

    if (user) {
      const token = generateToken(user._id);
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Send welcome SMS to sellers with next steps (non-blocking)
      try {
        if (user.role === 'seller') {
          const phone = user.personalDetails?.phoneNumber;
          if (phone) {
            const name = user.personalDetails?.fullName || user.username;
            const message = `Hello ${name}, welcome to InclusiKart! Your account has been created successfully. To start selling or get recognition, please log in and go to your Dashboard → Profile Verification, upload your disability certificate, and wait for admin approval. We're excited to support your journey!`;
            sendSms(phone, message);
          }
        }
      } catch (smsErr) {
        console.error('Failed to send registration SMS:', smsErr?.message || smsErr);
      }
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileStatus: user.profileStatus,
            personalDetails: user.personalDetails
          },
          token
        }
      });
    }
  } catch (error) {
    console.error('Register error details:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Duplicate user detected'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user - KEEP EXISTING
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileStatus: user.profileStatus,
          personalDetails: user.personalDetails
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user - KEEP EXISTING
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user data'
    });
  }
};

// Update profile - UPDATED TO HANDLE FILES
const updateProfile = async (req, res) => {
  try {
    console.log('=== UPDATE PROFILE ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User ID:', req.user._id);

    const { personalDetails, bankDetails } = req.body;
    const userId = req.user._id;

    // Prepare update data
    const updateData = {};
    
    if (personalDetails) {
      updateData.personalDetails = typeof personalDetails === 'string' 
        ? JSON.parse(personalDetails) 
        : personalDetails;
      // normalize phone if present
      if (updateData.personalDetails && updateData.personalDetails.phoneNumber) {
        const { normalizePhone } = require('../utils/smsService');
        updateData.personalDetails.phoneNumber = normalizePhone(updateData.personalDetails.phoneNumber);
      }
    }
    
    if (bankDetails) {
      updateData.bankDetails = typeof bankDetails === 'string'
        ? JSON.parse(bankDetails)
        : bankDetails;
    }

    // Handle file uploads (support multer.single -> req.file and multer.fields/array -> req.files)
    if (req.file || req.files) {
      // Helper to normalize path to forward slashes for URL usage
      const normalizePath = (p) => (p || '').replace(/\\/g, '/');

      // Single file upload (e.g., upload.single('disabilityCertificate'))
      if (req.file) {
        const f = req.file;
        if (f.fieldname === 'disabilityCertificate') {
          updateData.disabilityCertificate = {
            fileName: f.originalname,
            filePath: normalizePath(f.path),
            fileType: f.mimetype
          };
        } else if (f.fieldname === 'profileImage') {
          updateData.profileImage = {
            fileName: f.originalname,
            filePath: normalizePath(f.path),
            fileType: f.mimetype
          };
        }
      }

      // Multiple/fields upload (e.g., upload.fields or upload.array)
      if (req.files && typeof req.files === 'object') {
        // profileImage as array
        if (req.files.profileImage && req.files.profileImage.length > 0) {
          const f = req.files.profileImage[0];
          updateData.profileImage = {
            fileName: f.originalname,
            filePath: normalizePath(f.path),
            fileType: f.mimetype
          };
        }

        // disabilityCertificate as array
        if (req.files.disabilityCertificate && req.files.disabilityCertificate.length > 0) {
          const f = req.files.disabilityCertificate[0];
          updateData.disabilityCertificate = {
            fileName: f.originalname,
            filePath: normalizePath(f.path),
            fileType: f.mimetype
          };
        }
      }
    }

    console.log('Update data:', updateData);

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password - KEEP EXISTING
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while changing password'
    });
  }
};

// Logout - KEEP EXISTING
const logout = async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};