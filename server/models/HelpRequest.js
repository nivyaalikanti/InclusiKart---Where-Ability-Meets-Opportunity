const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['raw_materials', 'financial', 'training', 'equipment', 'marketing', 'other'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'fulfilled', 'rejected'],
    default: 'pending'
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    trim: true
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  ngoAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  fulfillmentDetails: {
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fulfillmentDate: Date,
    notes: String,
    proofOfFulfillment: [{
      fileName: String,
      fileUrl: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
helpRequestSchema.index({ seller: 1, status: 1 });
helpRequestSchema.index({ status: 1, urgencyLevel: -1, createdAt: 1 });
helpRequestSchema.index({ ngoAssigned: 1, status: 1 });

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

module.exports = HelpRequest;