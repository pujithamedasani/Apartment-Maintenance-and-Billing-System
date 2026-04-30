const User = require('../models/User');
const Apartment = require('../models/Apartment');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).populate('apartmentId').skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('apartmentId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body; // Prevent password update via this route

    // If assigning apartment, update apartment's resident
    if (updateData.apartmentId) {
      const apartment = await Apartment.findById(updateData.apartmentId);
      if (apartment) {
        apartment.currentResidentId = req.params.id;
        apartment.isOccupied = true;
        await apartment.save();
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    }).populate('apartmentId');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile/update
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'profilePicture'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true
    }).populate('apartmentId');

    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, updateProfile };
