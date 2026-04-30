const Apartment = require('../models/Apartment');
const User = require('../models/User');

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Admin
const getApartments = async (req, res, next) => {
  try {
    const { block, type, isOccupied, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (block) query.buildingBlock = block.toUpperCase();
    if (type) query.type = type;
    if (isOccupied !== undefined) query.isOccupied = isOccupied === 'true';
    if (search) {
      query.$or = [
        { apartmentNumber: { $regex: search, $options: 'i' } },
        { buildingBlock: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [apartments, total] = await Promise.all([
      Apartment.find(query)
        .populate('ownerId', 'name email phone')
        .populate('currentResidentId', 'name email phone')
        .skip(skip).limit(Number(limit)).sort('buildingBlock apartmentNumber'),
      Apartment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: apartments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single apartment
// @route   GET /api/apartments/:id
// @access  Private
const getApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
      .populate('ownerId', 'name email phone')
      .populate('currentResidentId', 'name email phone');

    if (!apartment) return res.status(404).json({ success: false, message: 'Apartment not found' });
    res.json({ success: true, data: apartment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create apartment
// @route   POST /api/apartments
// @access  Admin
const createApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.create(req.body);
    res.status(201).json({ success: true, message: 'Apartment created', data: apartment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update apartment
// @route   PUT /api/apartments/:id
// @access  Admin
const updateApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('ownerId currentResidentId', 'name email phone');

    if (!apartment) return res.status(404).json({ success: false, message: 'Apartment not found' });
    res.json({ success: true, message: 'Apartment updated', data: apartment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete apartment
// @route   DELETE /api/apartments/:id
// @access  Admin
const deleteApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    if (!apartment) return res.status(404).json({ success: false, message: 'Apartment not found' });
    if (apartment.isOccupied) {
      return res.status(400).json({ success: false, message: 'Cannot delete occupied apartment' });
    }
    await apartment.deleteOne();
    res.json({ success: true, message: 'Apartment deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get apartment statistics
// @route   GET /api/apartments/stats
// @access  Admin
const getApartmentStats = async (req, res, next) => {
  try {
    const [total, occupied, byType] = await Promise.all([
      Apartment.countDocuments(),
      Apartment.countDocuments({ isOccupied: true }),
      Apartment.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        occupied,
        vacant: total - occupied,
        occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(1) : 0,
        byType
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getApartments, getApartment, createApartment, updateApartment, deleteApartment, getApartmentStats };
