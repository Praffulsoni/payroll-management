const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Department = require('../models/Department');
const { getMonthName, getWorkingDays } = require('../utils/helpers');

// @desc    Get payroll report
// @route   GET /api/reports/payroll
// @access  Private (Admin, Payroll Admin, Finance)
exports.getPayrollReport = async (req, res) => {
  try {
    const { month, year, department, status } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const matchQuery = { month: currentMonth, year: currentYear };
    if (status) matchQuery.status = status;

    let employeeFilter = {};
    if (department) {
      employeeFilter.department = department;
    }

    const payrolls = await Payroll.find(matchQuery)
      .populate({
        path: 'employee',
        match: employeeFilter,
        select: 'firstName lastName employeeId designation department bankDetails',
        populate: { path: 'department', select: 'name code' }
      })
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name');

    // Filter out null employees (if department filter applied)
    const filteredPayrolls = payrolls.filter(p => p.employee !== null);

    // Calculate totals
    const totals = filteredPayrolls.reduce((acc, p) => {
      acc.grossSalary += p.grossSalary;
      acc.totalDeductions += p.totalDeductions;
      acc.netSalary += p.netSalary;
      acc.tax += p.deductions.tax;
      acc.pf += p.deductions.pf;
      return acc;
    }, { grossSalary: 0, totalDeductions: 0, netSalary: 0, tax: 0, pf: 0 });

    // Department wise breakdown
    const departmentBreakdown = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$dept.name',
          employeeCount: { $sum: 1 },
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' }
        }
      },
      { $sort: { totalNet: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: `${getMonthName(currentMonth)} ${currentYear}`,
        month: currentMonth,
        year: currentYear,
        totalRecords: filteredPayrolls.length,
        payrolls: filteredPayrolls,
        totals,
        departmentBreakdown
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

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private (Admin, HR Admin)
exports.getAttendanceReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    const workingDays = getWorkingDays(currentMonth, currentYear);

    let employeeQuery = { status: 'active' };
    if (department) employeeQuery.department = department;

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('firstName lastName employeeId department');

    const report = await Promise.all(employees.map(async (emp) => {
      const attendance = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const present = attendance.filter(a => a.status === 'present').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const halfDay = attendance.filter(a => a.status === 'half_day').length;
      const onLeave = attendance.filter(a => a.status === 'leave').length;
      const totalHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
      const overtime = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0);

      const attendancePercentage = workingDays > 0
        ? Math.round(((present + (halfDay * 0.5)) / workingDays) * 100)
        : 0;

      return {
        employee: {
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          employeeId: emp.employeeId,
          department: emp.department?.name || 'N/A'
        },
        present,
        absent,
        halfDay,
        onLeave,
        totalHours: Math.round(totalHours * 100) / 100,
        overtime: Math.round(overtime * 100) / 100,
        attendancePercentage
      };
    }));

    // Sort by attendance percentage
    report.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

    // Calculate overall stats
    const overallStats = {
      totalEmployees: report.length,
      avgAttendance: Math.round(report.reduce((sum, r) => sum + r.attendancePercentage, 0) / report.length) || 0,
      totalWorkingDays: workingDays,
      totalPresent: report.reduce((sum, r) => sum + r.present, 0),
      totalAbsent: report.reduce((sum, r) => sum + r.absent, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        period: `${getMonthName(currentMonth)} ${currentYear}`,
        month: currentMonth,
        year: currentYear,
        workingDays,
        report,
        overallStats
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

// @desc    Get leave report
// @route   GET /api/reports/leave
// @access  Private (Admin, HR Admin)
exports.getLeaveReport = async (req, res) => {
  try {
    const { year, department } = req.query;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    let employeeQuery = { status: 'active' };
    if (department) employeeQuery.department = department;

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('firstName lastName employeeId department leaveBalance');

    const report = await Promise.all(employees.map(async (emp) => {
      const leaves = await Leave.find({
        employee: emp._id,
        status: 'approved',
        startDate: { $gte: startDate, $lte: endDate }
      });

      const leavesByType = leaves.reduce((acc, leave) => {
        acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.totalDays;
        return acc;
      }, {});

      return {
        employee: {
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          employeeId: emp.employeeId,
          department: emp.department?.name || 'N/A'
        },
        leaveBalance: emp.leaveBalance,
        leavesTaken: leavesByType,
        totalLeaves: leaves.reduce((sum, l) => sum + l.totalDays, 0)
      };
    }));

    // Leave type summary
    const leaveTypeSummary = await Leave.aggregate([
      {
        $match: {
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    // Monthly trend
    const monthlyTrend = await Leave.aggregate([
      {
        $match: {
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate }
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
        year: currentYear,
        report,
        leaveTypeSummary,
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

// @desc    Get finance report
// @route   GET /api/reports/finance
// @access  Private (Admin, Finance)
exports.getFinanceReport = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = parseInt(year) || new Date().getFullYear();

    // Monthly payroll totals
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { year: currentYear, status: { $in: ['approved', 'paid'] } } },
      {
        $group: {
          _id: '$month',
          employeeCount: { $sum: 1 },
          grossSalary: { $sum: '$grossSalary' },
          netSalary: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          tax: { $sum: '$deductions.tax' },
          pf: { $sum: '$deductions.pf' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Yearly totals
    const yearlyTotals = monthlyPayroll.reduce((acc, m) => {
      acc.grossSalary += m.grossSalary;
      acc.netSalary += m.netSalary;
      acc.totalDeductions += m.totalDeductions;
      acc.tax += m.tax;
      acc.pf += m.pf;
      return acc;
    }, { grossSalary: 0, netSalary: 0, totalDeductions: 0, tax: 0, pf: 0 });

    // Department wise expense
    const departmentExpense = await Payroll.aggregate([
      { $match: { year: currentYear, status: { $in: ['approved', 'paid'] } } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$dept.name',
          totalExpense: { $sum: '$netSalary' }
        }
      },
      { $sort: { totalExpense: -1 } }
    ]);

    // Pending payments
    const pendingPayments = await Payroll.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        monthlyPayroll: monthlyPayroll.map(m => ({
          month: getMonthName(m._id),
          ...m
        })),
        yearlyTotals,
        departmentExpense,
        pendingPayments: pendingPayments[0] || { count: 0, totalAmount: 0 }
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

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Employee stats
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const newJoiningsThisMonth = await Employee.countDocuments({
      dateOfJoining: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0)
      }
    });

    // Department count
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // Payroll stats
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      {
        $group: {
          _id: null,
          total: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // Today's attendance
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today },
      status: 'present'
    });

    // Recent activities (last 5)
    const recentPayrolls = await Payroll.find()
      .populate('employee', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('employee month year netSalary status createdAt');

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          newThisMonth: newJoiningsThisMonth
        },
        departments: totalDepartments,
        payroll: {
          monthlyTotal: monthlyPayroll[0]?.total || 0,
          processed: monthlyPayroll[0]?.count || 0
        },
        leaves: {
          pending: pendingLeaves
        },
        attendance: {
          presentToday: todayAttendance,
          total: totalEmployees
        },
        recentPayrolls
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
