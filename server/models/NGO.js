const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  ngoName: {
    type: String,
    required: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  focusAreas: [{
    type: String,
    enum: ['raw_materials', 'financial', 'training', 'equipment', 'marketing', 'all']
  }],
  contactPerson: {
    name: String,
    position: String,
    email: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  website: String,
  yearsOfOperation: Number,
  totalRequestsFulfilled: {
    type: Number,
    default: 0
  },
  activeRequests: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  documents: [{
    docType: String,
    docUrl: String,
    uploadedAt: Date
  }],
  capacity: {
    maxRequestsPerMonth: Number,
    currentlyHandling: {
      type: Number,
      default: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Add method to check if NGO can take more requests
ngoSchema.methods.canTakeRequest = function() {
  if (!this.capacity) return true;
  return this.capacity.currentlyHandling < (this.capacity.maxRequestsPerMonth || 10);
};

const NGO = mongoose.model('NGO', ngoSchema);

module.exports = NGO;