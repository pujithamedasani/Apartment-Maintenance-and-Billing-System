const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  apartmentNumber: {
    type: String,
    required: [true, 'Apartment number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  buildingBlock: {
    type: String,
    required: [true, 'Building block is required'],
    trim: true,
    uppercase: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required'],
    min: [0, 'Floor cannot be negative']
  },
  type: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse'],
    required: true
  },
  area: {
    type: Number, // in sq ft
    required: true
  },
  monthlyMaintenance: {
    type: Number,
    required: [true, 'Monthly maintenance amount is required'],
    min: [0, 'Maintenance amount cannot be negative']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentResidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  amenities: [{
    type: String
  }],
  parkingSlot: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for full address
apartmentSchema.virtual('fullAddress').get(function() {
  return `Block ${this.buildingBlock}, Apt ${this.apartmentNumber}, Floor ${this.floor}`;
});

module.exports = mongoose.model('Apartment', apartmentSchema);
