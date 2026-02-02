const User = require('../models/User');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, Super Admin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get associated employee if exists
    const employee = await Employee.findOne({ user: user._id }).populate('department');

    res.status(200).json({
      success: true,
      data: { user, employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin, Super Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Only superadmin can create superadmin or admin
    if (['superadmin', 'admin'].includes(role) && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create Admin or Super Admin users'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_USER',
      module: 'users',
      description: `Created user ${user.name} with role ${user.role}`,
      targetId: user._id,
      targetModel: 'User',
      newData: { name, email, role },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, Super Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only superadmin can modify superadmin or admin roles
    if (['superadmin', 'admin'].includes(user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can modify Admin or Super Admin users'
      });
    }

    const previousData = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_USER',
      module: 'users',
      description: `Updated user ${user.name}`,
      targetId: user._id,
      targetModel: 'User',
      previousData,
      newData: { name, email, role, isActive },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete associated employee if exists
    await Employee.findOneAndDelete({ user: user._id });

    await user.deleteOne();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_USER',
      module: 'users',
      description: `Deleted user ${user.name}`,
      previousData: { name: user.name, email: user.email, role: user.role },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin, Super Admin)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
