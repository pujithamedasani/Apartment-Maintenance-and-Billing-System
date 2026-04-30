const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['general', 'maintenance', 'billing', 'event', 'emergency', 'rules'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  targetAudience: {
    type: String,
    enum: ['all', 'residents', 'maintenance'],
    default: 'all'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);
