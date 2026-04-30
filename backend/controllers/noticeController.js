const Notice = require('../models/Notice');

const getNotices = async (req, res, next) => {
  try {
    const { category, priority, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (priority) query.priority = priority;
    // Filter expired notices
    query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

    const skip = (page - 1) * limit;
    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate('createdBy', 'name')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Notice.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: notices,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({ ...req.body, createdBy: req.user._id });
    await notice.populate('createdBy', 'name');
    res.status(201).json({ success: true, message: 'Notice posted', data: notice });
  } catch (error) {
    next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('createdBy', 'name');
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
