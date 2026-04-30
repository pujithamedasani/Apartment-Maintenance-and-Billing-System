const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Resident is required']
  },
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment'
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'cleaning', 'security', 'lift', 'parking', 'noise', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Status history tracking
  statusHistory: [{
    status: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    changedAt: { type: Date, default: Date.now }
  }],
  resolvedAt: {
    type: Date,
    default: null
  },
  attachments: [{
    url: String,
    filename: String
  }]
}, {
  timestamps: true
});

// Auto-generate ticket number
complaintSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Complaint').countDocuments();
    const date = new Date();
    this.ticketNumber = `TKT-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
