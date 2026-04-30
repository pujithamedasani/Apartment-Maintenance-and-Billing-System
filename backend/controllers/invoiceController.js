const Invoice = require('../models/Invoice');
const Apartment = require('../models/Apartment');
const User = require('../models/User');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Admin
const getInvoices = async (req, res, next) => {
  try {
    const { status, month, year, residentId, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status) query.paymentStatus = status;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (residentId) query.residentId = residentId;

    // Residents can only see their own invoices
    if (req.user.role === 'resident') {
      query.residentId = req.user._id;
    }

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('residentId', 'name email')
        .populate('apartmentId', 'apartmentNumber buildingBlock')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Invoice.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('residentId', 'name email phone')
      .populate('apartmentId', 'apartmentNumber buildingBlock floor type');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Resident can only view own invoice
    if (req.user.role === 'resident' && invoice.residentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invoice for a resident
// @route   POST /api/invoices/generate
// @access  Admin
const generateInvoice = async (req, res, next) => {
  try {
    const { residentId, apartmentId, month, year, breakdown } = req.body;

    // Check if invoice already exists for this period
    const existing = await Invoice.findOne({ residentId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Invoice already exists for this period' });
    }

    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ success: false, message: 'Apartment not found' });

    const charges = {
      maintenanceCharge: breakdown?.maintenanceCharge || apartment.monthlyMaintenance,
      waterCharge: breakdown?.waterCharge || 0,
      electricityCharge: breakdown?.electricityCharge || 0,
      parkingCharge: breakdown?.parkingCharge || 0,
      otherCharges: breakdown?.otherCharges || 0,
      lateFee: 0
    };
    const amount = Object.values(charges).reduce((a, b) => a + b, 0);

    // Due date: 10th of the billing month+1
    const dueDate = new Date(year, month, 10);

    const invoice = await Invoice.create({
      residentId, apartmentId, month, year,
      amount, breakdown: charges, dueDate,
      notes: req.body.notes || ''
    });

    await invoice.populate('residentId apartmentId');
    res.status(201).json({ success: true, message: 'Invoice generated', data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk generate invoices for all residents
// @route   POST /api/invoices/generate-bulk
// @access  Admin
const generateBulkInvoices = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const apartments = await Apartment.find({ isOccupied: true })
      .populate('currentResidentId');

    const results = { created: 0, skipped: 0, errors: [] };

    for (const apt of apartments) {
      if (!apt.currentResidentId) continue;

      try {
        const existing = await Invoice.findOne({
          residentId: apt.currentResidentId._id, month, year
        });
        if (existing) { results.skipped++; continue; }

        const dueDate = new Date(year, month, 10);
        await Invoice.create({
          residentId: apt.currentResidentId._id,
          apartmentId: apt._id,
          month, year,
          amount: apt.monthlyMaintenance,
          breakdown: { maintenanceCharge: apt.monthlyMaintenance },
          dueDate
        });
        results.created++;
      } catch (err) {
        results.errors.push({ apartment: apt.apartmentNumber, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.created} invoices, skipped ${results.skipped}`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Admin
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('residentId apartmentId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice stats for dashboard
// @route   GET /api/invoices/stats
// @access  Admin
const getInvoiceStats = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [totalRevenue, pendingAmount, byStatus, monthlyRevenue] = await Promise.all([
      Invoice.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Invoice.aggregate([
        { $match: { paymentStatus: { $in: ['unpaid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$amountPaid'] } } } }
      ]),
      Invoice.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ]),
      Invoice.aggregate([
        { $match: { year: currentYear } },
        { $group: { _id: '$month', revenue: { $sum: '$amountPaid' }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
        byStatus,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInvoices, getInvoice, generateInvoice, generateBulkInvoices, updateInvoice, getInvoiceStats };
