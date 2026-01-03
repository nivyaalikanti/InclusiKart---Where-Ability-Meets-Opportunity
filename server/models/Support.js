const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['donation', 'raw_materials'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Support title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Support description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['financial', 'materials', 'equipment', 'training', 'other']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'fulfilled', 'rejected'],
    default: 'pending'
  },
  requiredAmount: {
    type: Number,
    min: 0
  },
  receivedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  materialsRequired: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  materialsReceived: [{
    name: String,
    quantity: Number,
    unit: String,
    receivedAt: Date
  }],
  adminNotes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin user
  },
  completionDate: Date,
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  donors: [{
    donorName: String,
    amount: Number,
    donatedAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }]
}, {
  timestamps: true
});

supportSchema.index({ seller: 1 });
supportSchema.index({ type: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ urgency: -1, createdAt: -1 });

module.exports = mongoose.model('Support', supportSchema);