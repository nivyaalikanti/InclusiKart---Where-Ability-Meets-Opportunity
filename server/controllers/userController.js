const User = require('../models/User');

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {};

    // Handle personal details
    if (req.body.personalDetails) {
      updateData.personalDetails = {};
      const personalFields = ['fullName', 'dateOfBirth', 'address', 'disabilityType', 'phoneNumber'];

      personalFields.forEach(field => {
        if (req.body[`personalDetails[${field}]`] !== undefined) {
          updateData.personalDetails[field] = req.body[`personalDetails[${field}]`];
        }
      });
    }

    // Handle bank details
    if (req.body.bankDetails) {
      updateData.bankDetails = {};
      const bankFields = ['accountNumber', 'accountHolderName', 'bankName', 'ifscCode', 'branch'];

      bankFields.forEach(field => {
        if (req.body[`bankDetails[${field}]`] !== undefined) {
          updateData.bankDetails[field] = req.body[`bankDetails[${field}]`];
        }
      });
    }

    // Handle disability certificate upload
    if (req.file) {
      updateData.disabilityCertificate = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      };
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

module.exports = {
  updateProfile
};
