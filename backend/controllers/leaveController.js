const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private (Admin, HR Admin)
exports.getLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, leaveType, employee, startDate, endDate } = req.query;

    const query = {};

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employee) query.employee = employee;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('approvedBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
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

// @desc    Get pending leaves
// @route   GET /api/leaves/pending
// @access  Private (Admin, HR Admin)
exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'pending' })
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      })
      .populate('approvedBy', 'name');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, isHalfDay, halfDayType } = req.body;

    // Get employee
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply for leave in the past'
      });
    }

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for this period'
      });
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = isHalfDay ? 0.5 : diffDays;

    // Check leave balance
    const leaveBalance = employee.leaveBalance[leaveType] || 0;
    if (leaveType !== 'unpaid' && totalDays > leaveBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${leaveBalance} days`
      });
    }

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      isHalfDay,
      halfDayType
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'APPLY_LEAVE',
      module: 'leave',
      description: `Applied for ${leaveType} leave from ${startDate} to ${endDate}`,
      targetId: leave._id,
      targetModel: 'Leave',
      newData: { leaveType, startDate, endDate, totalDays },
      ipAddress: req.ip
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId',
        populate: { path: 'department', select: 'name' }
      });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/approve
// @access  Private (Admin, HR Admin)
exports.approveLeave = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`
      });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();

    if (status === 'rejected') {
      leave.rejectionReason = rejectionReason || 'No reason provided';
    } else {
      // Deduct from leave balance
      const employee = await Employee.findById(leave.employee);
      if (employee && leave.leaveType !== 'unpaid') {
        employee.leaveBalance[leave.leaveType] = Math.max(
          0,
          (employee.leaveBalance[leave.leaveType] || 0) - leave.totalDays
        );
        await employee.save();
      }
    }

    await leave.save();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      module: 'leave',
      description: `${status === 'approved' ? 'Approved' : 'Rejected'} leave request ID: ${leave._id}`,
      targetId: leave._id,
      targetModel: 'Leave',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Leave request ${status}`,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave
    const employee = await Employee.findOne({ user: req.user._id });
    if (leave.employee.toString() !== employee._id.toString() && !['admin', 'superadmin', 'hr_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending leave requests'
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled',
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my leaves (for employee)
// @route   GET /api/leaves/my-leaves
// @access  Private
exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const { status, year } = req.query;
    const query = { employee: employee._id };
    if (status) query.status = status;
    if (year) {
      query.startDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const leaves = await Leave.find(query)
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
      leaveBalance: employee.leaveBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private (Admin, HR Admin)
exports.getLeaveStats = async (req, res) => {
  try {
    const totalPending = await Leave.countDocuments({ status: 'pending' });
    const totalApproved = await Leave.countDocuments({ status: 'approved' });
    const totalRejected = await Leave.countDocuments({ status: 'rejected' });

    const leaveTypeStats = await Leave.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    // Monthly leave trend (current year)
    const currentYear = new Date().getFullYear();
    const monthlyTrend = await Leave.aggregate([
      {
        $match: {
          status: 'approved',
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPending,
        totalApproved,
        totalRejected,
        leaveTypeStats,
        monthlyTrend
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
