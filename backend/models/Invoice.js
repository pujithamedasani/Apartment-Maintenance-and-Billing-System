const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Resident is required']
  },
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: [true, 'Apartment is required']
  },
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Invoice amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  // Breakdown of charges
  breakdown: {
    maintenanceCharge: { type: Number, default: 0 },
    waterCharge: { type: Number, default: 0 },
    electricityCharge: { type: Number, default: 0 },
    parkingCharge: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 }
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-generate invoice number before validation
invoiceSchema.pre('validate', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const monthStr = String(this.month).padStart(2, '0');
    this.invoiceNumber = `INV-${this.year}${monthStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for balance due
invoiceSchema.virtual('balanceDue').get(function() {
  return this.amount - this.amountPaid;
});

module.exports = mongoose.model('Invoice', invoiceSchema);
