const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private (Admin, HR Admin)
exports.getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, startDate, endDate, employee, department, status } = req.query;

    const query = {};

    if (date) {
      const dateObj = new Date(date);
      query.date = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (employee) query.employee = employee;
    if (status) query.status = status;

    // If department filter, first find employees in that department
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const total = await Attendance.countDocuments(query);
    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('markedBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
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

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private (Admin, HR Admin)
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });

    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate({
      path: 'employee',
      select: 'firstName lastName employeeId department',
      populate: { path: 'department', select: 'name' }
    });

    const present = todayRecords.filter(a => a.status === 'present').length;
    const absent = todayRecords.filter(a => a.status === 'absent').length;
    const halfDay = todayRecords.filter(a => a.status === 'half_day').length;
    const onLeave = todayRecords.filter(a => a.status === 'leave').length;

    res.status(200).json({
      success: true,
      data: {
        date: today,
        totalEmployees,
        present,
        absent,
        halfDay,
        onLeave,
        notMarked: totalEmployees - todayRecords.length,
        records: todayRecords
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

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private (Admin, HR Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, remarks } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    const attendance = await Attendance.create({
      employee: employeeId,
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status,
      remarks,
      markedBy: req.user._id,
      ipAddress: req.ip
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'MARK_ATTENDANCE',
      module: 'attendance',
      description: `Marked attendance for ${employee.firstName} ${employee.lastName} - ${status}`,
      targetId: attendance._id,
      targetModel: 'Attendance',
      newData: { date, status },
      ipAddress: req.ip
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId',
        populate: { path: 'department', select: 'name' }
      });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: populatedAttendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark bulk attendance
// @route   POST /api/attendance/bulk
// @access  Private (Admin, HR Admin)
exports.markBulkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = {
      created: [],
      updated: [],
      errors: []
    };

    for (const record of records) {
      try {
        const existingAttendance = await Attendance.findOne({
          employee: record.employeeId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingAttendance) {
          // Update existing
          existingAttendance.status = record.status;
          existingAttendance.checkIn = record.checkIn ? new Date(record.checkIn) : existingAttendance.checkIn;
          existingAttendance.checkOut = record.checkOut ? new Date(record.checkOut) : existingAttendance.checkOut;
          existingAttendance.remarks = record.remarks;
          await existingAttendance.save();
          results.updated.push(record.employeeId);
        } else {
          // Create new
          await Attendance.create({
            employee: record.employeeId,
            date: attendanceDate,
            checkIn: record.checkIn ? new Date(record.checkIn) : null,
            checkOut: record.checkOut ? new Date(record.checkOut) : null,
            status: record.status,
            remarks: record.remarks,
            markedBy: req.user._id
          });
          results.created.push(record.employeeId);
        }
      } catch (err) {
        results.errors.push({ employeeId: record.employeeId, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk attendance processed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Admin, HR Admin)
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const previousData = {
      status: attendance.status,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut
    };

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'employee',
      select: 'firstName lastName employeeId',
      populate: { path: 'department', select: 'name' }
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_ATTENDANCE',
      module: 'attendance',
      description: `Updated attendance record ID: ${attendance._id}`,
      targetId: attendance._id,
      targetModel: 'Attendance',
      previousData,
      newData: req.body,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my attendance (for employee)
// @route   GET /api/attendance/my-attendance
// @access  Private
exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const attendance = await Attendance.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate summary
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const halfDay = attendance.filter(a => a.status === 'half_day').length;
    const onLeave = attendance.filter(a => a.status === 'leave').length;
    const totalHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        records: attendance,
        summary: {
          present,
          absent,
          halfDay,
          onLeave,
          totalHours: Math.round(totalHours * 100) / 100
        }
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

// @desc    Check in (self)
// @route   POST /api/attendance/check-in
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const checkInTime = new Date();

    if (existingAttendance) {
      existingAttendance.checkIn = checkInTime;
      await existingAttendance.save();

      return res.status(200).json({
        success: true,
        message: 'Checked in successfully',
        data: existingAttendance
      });
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      checkIn: checkInTime,
      status: 'present',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check out (self)
// @route   POST /api/attendance/check-out
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Admin, HR Admin)
exports.getAttendanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });

    const statusStats = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average working hours
    const avgWorkingHours = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          workingHours: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$workingHours' }
        }
      }
    ]);

    // Daily trend
    const dailyTrend = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        totalEmployees,
        statusStats,
        avgWorkingHours: avgWorkingHours[0]?.avgHours || 0,
        dailyTrend
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
