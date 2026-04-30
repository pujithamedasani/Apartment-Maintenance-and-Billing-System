const Complaint = require('../models/Complaint');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, assignedTo, priority, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Residents only see their own complaints
    if (req.user.role === 'resident') query.residentId = req.user._id;
    // Maintenance staff see assigned complaints
    if (req.user.role === 'maintenance') query.assignedTo = req.user._id;
    // Admin filter by assignedTo
    if (req.user.role === 'admin' && assignedTo) query.assignedTo = assignedTo;

    const skip = (page - 1) * limit;
    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('residentId', 'name email phone')
        .populate('apartmentId', 'apartmentNumber buildingBlock')
        .populate('assignedTo', 'name email')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Complaint.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
const getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('residentId', 'name email phone')
      .populate('apartmentId', 'apartmentNumber buildingBlock')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Resident
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    const complaint = await Complaint.create({
      residentId: req.user._id,
      apartmentId: req.user.apartmentId,
      title, description, category,
      priority: priority || 'medium',
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id,
        note: 'Complaint submitted'
      }]
    });

    await complaint.populate('residentId apartmentId');
    res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint (admin/maintenance)
// @route   PUT /api/complaints/:id
// @access  Admin / Maintenance
const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const { status, assignedTo, note } = req.body;

    if (status && status !== complaint.status) {
      complaint.statusHistory.push({
        status,
        changedBy: req.user._id,
        note: note || `Status changed to ${status}`
      });
      complaint.status = status;
      if (status === 'resolved') complaint.resolvedAt = new Date();
    }

    if (assignedTo) complaint.assignedTo = assignedTo;
    if (req.body.priority) complaint.priority = req.body.priority;

    await complaint.save();
    await complaint.populate('residentId apartmentId assignedTo statusHistory.changedBy');

    res.json({ success: true, message: 'Complaint updated', data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint stats
// @route   GET /api/complaints/stats
// @access  Admin
const getComplaintStats = async (req, res, next) => {
  try {
    const [byStatus, byCategory, recentResolved] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Complaint.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      success: true,
      data: { byStatus, byCategory, recentResolved }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComplaints, getComplaint, createComplaint, updateComplaint, getComplaintStats };
