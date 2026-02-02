const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const Payslip = require("../models/Payslip");
const TaxDeclaration = require("../models/TaxDeclaration");

exports.getDashboard = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const payrolls = await Payroll.find({ employee: employee._id })
      .sort({ year: -1, month: -1 })
      .limit(6);

    const payslips = await Payslip.find({ employee: employee._id })
      .sort({ year: -1, month: -1 })
      .limit(6);

    const attendance = await Attendance.find({ employee: employee._id })
      .sort({ date: -1 })
      .limit(30);

    const taxDeclarations = await TaxDeclaration.find({ employee: employee._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        profile: employee,
        payrolls,
        payslips,
        attendance,
        taxDeclarations
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error loading ESS dashboard",
      error: error.message
    });
  }
};
