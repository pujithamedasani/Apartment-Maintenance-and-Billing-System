const User = require('../models/User');
const Apartment = require('../models/Apartment');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');

// @desc    Get admin dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalResidents,
      totalApartments,
      occupiedApartments,
      totalStaff,
      currentMonthInvoices,
      pendingInvoices,
      recentPayments,
      complaintStats,
      monthlyRevenue,
      recentComplaints,
      recentNotices
    ] = await Promise.all([
      User.countDocuments({ role: 'resident', isActive: true }),
      Apartment.countDocuments(),
      Apartment.countDocuments({ isOccupied: true }),
      User.countDocuments({ role: 'maintenance', isActive: true }),

      Invoice.aggregate([
        { $match: { month: currentMonth, year: currentYear } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      Invoice.aggregate([
        { $match: { paymentStatus: { $in: ['unpaid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$amountPaid'] } }, count: { $sum: 1 } } }
      ]),

      Payment.aggregate([
        { $match: { paymentDate: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),

      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Monthly revenue for last 12 months
      Invoice.aggregate([
        {
          $match: {
            year: { $gte: currentYear - 1 },
            paymentStatus: { $in: ['paid', 'partial'] }
          }
        },
        {
          $group: {
            _id: { year: '$year', month: '$month' },
            revenue: { $sum: '$amountPaid' },
            invoices: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),

      Complaint.find({ status: { $ne: 'resolved' } })
        .populate('residentId', 'name')
        .populate('apartmentId', 'apartmentNumber buildingBlock')
        .sort('-createdAt').limit(5),

      Notice.find({ isActive: true })
        .populate('createdBy', 'name')
        .sort('-createdAt').limit(3)
    ]);

    // Build complaint stats map
    const complaintMap = { pending: 0, in_progress: 0, resolved: 0, closed: 0 };
    complaintStats.forEach(c => { complaintMap[c._id] = c.count; });

    res.json({
      success: true,
      data: {
        overview: {
          totalResidents,
          totalApartments,
          occupiedApartments,
          vacantApartments: totalApartments - occupiedApartments,
          totalStaff,
          occupancyRate: totalApartments > 0
            ? ((occupiedApartments / totalApartments) * 100).toFixed(1)
            : 0
        },
        billing: {
          currentMonthTotal: currentMonthInvoices[0]?.total || 0,
          currentMonthCount: currentMonthInvoices[0]?.count || 0,
          pendingAmount: pendingInvoices[0]?.total || 0,
          pendingCount: pendingInvoices[0]?.count || 0,
          recentCollected: recentPayments[0]?.total || 0,
          recentPaymentCount: recentPayments[0]?.count || 0
        },
        complaints: complaintMap,
        monthlyRevenue,
        recentComplaints,
        recentNotices
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get resident dashboard
// @route   GET /api/dashboard/resident
// @access  Resident
const getResidentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [pendingInvoices, recentPayments, myComplaints, notices] = await Promise.all([
      Invoice.find({ residentId: userId, paymentStatus: { $ne: 'paid' } })
        .populate('apartmentId', 'apartmentNumber buildingBlock')
        .sort('dueDate').limit(5),

      Payment.find({ residentId: userId })
        .populate('invoiceId', 'invoiceNumber month year')
        .sort('-paymentDate').limit(5),

      Complaint.find({ residentId: userId })
        .sort('-createdAt').limit(5),

      Notice.find({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      }).sort('-createdAt').limit(5)
    ]);

    const totalDue = pendingInvoices.reduce((sum, inv) => sum + (inv.amount - inv.amountPaid), 0);

    res.json({
      success: true,
      data: {
        totalDue,
        pendingInvoices,
        recentPayments,
        myComplaints,
        notices
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard, getResidentDashboard };
