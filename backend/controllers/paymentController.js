const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Admin
const getPayments = async (req, res, next) => {
  try {
    const { residentId, method, page = 1, limit = 15 } = req.query;
    const query = {};

    if (method) query.paymentMethod = method;
    if (residentId) query.residentId = residentId;
    if (req.user.role === 'resident') query.residentId = req.user._id;

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('invoiceId', 'invoiceNumber month year amount')
        .populate('residentId', 'name email')
        .populate('receivedBy', 'name')
        .skip(skip).limit(Number(limit)).sort('-paymentDate'),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private (Admin + Resident)
const recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amountPaid, paymentMethod, transactionId, remarks } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
    }

    const balanceDue = invoice.amount - invoice.amountPaid;
    if (amountPaid > balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds balance due (₹${balanceDue})`
      });
    }

    // Create payment record
    const payment = await Payment.create({
      invoiceId,
      residentId: invoice.residentId,
      amountPaid,
      paymentMethod,
      transactionId,
      remarks,
      receivedBy: req.user.role === 'admin' ? req.user._id : null
    });

    // Update invoice
    invoice.amountPaid += amountPaid;
    if (invoice.amountPaid >= invoice.amount) {
      invoice.paymentStatus = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'partial';
    }
    await invoice.save();

    await payment.populate('invoiceId residentId', 'invoiceNumber name email');
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by invoice
// @route   GET /api/payments/invoice/:invoiceId
// @access  Private
const getPaymentsByInvoice = async (req, res, next) => {
  try {
    const payments = await Payment.find({ invoiceId: req.params.invoiceId })
      .populate('receivedBy', 'name')
      .sort('-paymentDate');

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments, recordPayment, getPaymentsByInvoice };
