const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['seller', 'buyer', 'admin','ngo'],
    required: true
  },
  profileStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  personalDetails: {
    fullName: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    dateOfBirth: {
      type: Date,
      required: function() { return this.role === 'seller'; }
    },
    address: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    disabilityType: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    phoneNumber: String
  },
  bankDetails: {
    accountNumber: String,
    accountHolderName: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },
  disabilityCertificate: {
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  adminNotes: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);