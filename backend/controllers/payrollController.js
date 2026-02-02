const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');
const { getWorkingDays, calculateTax, calculatePF, calculateESI, getMonthName } = require('../utils/helpers');
const Notification = require("../models/Notification");

// @desc    Get all payrolls
// @route   GET /api/payroll
// @access  Private (Admin, Payroll Admin, Finance)
exports.getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, status, department, employee } = req.query;

    const query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (employee) query.employee = employee;

    // If department filter, first find employees in that department
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const total = await Payroll.countDocuments(query);
    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId designation department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: payrolls,
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

// @desc    Get single payroll
// @route   GET /api/payroll/:id
// @access  Private
exports.getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      })
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Process payroll for employee
// @route   POST /api/payroll/process
// @access  Private (Payroll Admin)
exports.processPayroll = async (req, res) => {
  try {
    const { employeeId, month, year, overtime = 0, bonus = 0, incentives = 0, otherDeductions = 0 } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });
    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: `Payroll for ${getMonthName(month)} ${year} already exists for this employee`
      });
    }

    // Get attendance data
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    const presentDays = attendance.filter(a => a.status === 'present').length;
    const halfDays = attendance.filter(a => a.status === 'half_day').length;
    const workingDays = getWorkingDays(month, year);

    // Get approved leaves
    const leaves = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    const leaveDays = leaves.reduce((sum, leave) => sum + leave.totalDays, 0);

    // Calculate salary
    const basicSalary = employee.salary.basic;
    const hra = employee.salary.hra;
    const allowances = employee.salary.allowances;

    // Calculate deductions
    const annualIncome = (basicSalary + hra + allowances) * 12;
    const tax = calculateTax(annualIncome);
    const pf = calculatePF(basicSalary);
    const grossSalary = basicSalary + hra + allowances + overtime + bonus + incentives;
    const esi = calculateESI(grossSalary);

    // Calculate leave deductions (for unpaid leaves beyond balance)
    const perDaySalary = (basicSalary + hra + allowances) / workingDays;
    const absentDays = workingDays - presentDays - (halfDays * 0.5) - leaveDays;
    const leaveDeduction = absentDays > 0 ? Math.round(absentDays * perDaySalary) : 0;

    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      year,
      earnings: {
        basicSalary,
        hra,
        allowances,
        overtime,
        bonus,
        incentives
      },
      deductions: {
        tax,
        pf,
        esi,
        leaveDeduction,
        other: otherDeductions
      },
      grossSalary,
      totalDeductions: tax + pf + esi + leaveDeduction + otherDeductions,
      netSalary: grossSalary - (tax + pf + esi + leaveDeduction + otherDeductions),
      workingDays,
      presentDays: presentDays + (halfDays * 0.5),
      leaveDays,
      status: 'pending',
      processedBy: req.user._id,
      processedAt: new Date()
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'PROCESS_PAYROLL',
      module: 'payroll',
      description: `Processed payroll for ${employee.firstName} ${employee.lastName} - ${getMonthName(month)} ${year}`,
      targetId: payroll._id,
      targetModel: 'Payroll',
      newData: { month, year, netSalary: payroll.netSalary },
      ipAddress: req.ip
    });

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      })
      .populate('processedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Payroll processed successfully',
      data: populatedPayroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Process bulk payroll
// @route   POST /api/payroll/process-bulk
// @access  Private (Payroll Admin)
exports.processBulkPayroll = async (req, res) => {
  try {
    const { month, year, departmentId } = req.body;

    const query = { status: 'active' };
    if (departmentId) query.department = departmentId;

    const employees = await Employee.find(query);

    const results = {
      processed: [],
      skipped: [],
      errors: []
    };

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year
        });

        if (existingPayroll) {
          results.skipped.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            reason: 'Payroll already exists'
          });
          continue;
        }

        // Get attendance data
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendance = await Attendance.find({
          employee: employee._id,
          date: { $gte: startDate, $lte: endDate }
        });

        const presentDays = attendance.filter(a => a.status === 'present').length;
        const halfDays = attendance.filter(a => a.status === 'half_day').length;
        const workingDays = getWorkingDays(month, year);

        // Calculate salary
        const basicSalary = employee.salary.basic;
        const hra = employee.salary.hra;
        const allowances = employee.salary.allowances;

        const annualIncome = (basicSalary + hra + allowances) * 12;
        const tax = calculateTax(annualIncome);
        const pf = calculatePF(basicSalary);
        const grossSalary = basicSalary + hra + allowances;
        const esi = calculateESI(grossSalary);

        const payroll = await Payroll.create({
          employee: employee._id,
          month,
          year,
          earnings: { basicSalary, hra, allowances, overtime: 0, bonus: 0, incentives: 0 },
          deductions: { tax, pf, esi, leaveDeduction: 0, other: 0 },
          grossSalary,
          totalDeductions: tax + pf + esi,
          netSalary: grossSalary - (tax + pf + esi),
          workingDays,
          presentDays: presentDays + (halfDays * 0.5),
          leaveDays: 0,
          status: 'pending',
          processedBy: req.user._id,
          processedAt: new Date()
        });

        results.processed.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          netSalary: payroll.netSalary
        });
      } catch (err) {
        results.errors.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          error: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk payroll processing completed`,
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

// @desc    Approve payroll
// @route   PUT /api/payroll/:id/approve
// @access  Private (Admin, Finance)
exports.approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'pending' && payroll.status !== 'processed') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve payroll with status: ${payroll.status}`
      });
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'APPROVE_PAYROLL',
      module: 'payroll',
      description: `Approved payroll ID: ${payroll._id}`,
      targetId: payroll._id,
      targetModel: 'Payroll',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Payroll approved successfully',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark payroll as paid
// @route   PUT /api/payroll/:id/pay
// @access  Private (Finance)
exports.markAsPaid = async (req, res) => {
  try {
    const { transactionId, paymentMethod } = req.body;
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Payroll must be approved before marking as paid'
      });
    }

    payroll.status = 'paid';
    payroll.paidAt = new Date();
    payroll.transactionId = transactionId;
    payroll.paymentMethod = paymentMethod || 'bank_transfer';
    await payroll.save();

    await Notification.create({
      user: payroll.employee.user,
      title: "Salary Credited",
      message: `Your salary for ${payroll.month}/${payroll.year} has been credited successfully.`
    });

    res.status(200).json({
      success: true,
      message: 'Payroll marked as paid',
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my payroll (for employee)
// @route   GET /api/payroll/my-payroll
// @access  Private (Employee)
exports.getMyPayroll = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const { year } = req.query;
    const query = { employee: employee._id };
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats
// @access  Private (Admin, Payroll Admin, Finance)
exports.getPayrollStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const monthlyStats = await Payroll.aggregate([
      { $match: { month: parseInt(currentMonth), year: parseInt(currentYear) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' }
        }
      }
    ]);

    const totalProcessed = await Payroll.countDocuments({
      month: currentMonth,
      year: currentYear
    });

    const totalPaid = await Payroll.aggregate([
      {
        $match: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear),
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$netSalary' }
        }
      }
    ]);

    const pendingApproval = await Payroll.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      data: {
        currentMonth: getMonthName(currentMonth),
        currentYear,
        totalProcessed,
        pendingApproval,
        totalPaid: totalPaid[0]?.total || 0,
        statusBreakdown: monthlyStats
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
