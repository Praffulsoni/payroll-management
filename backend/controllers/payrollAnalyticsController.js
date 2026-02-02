const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const { getMonthName } = require("../utils/helpers");

// Payroll Summary Report
exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    });

    const totalEmployees = payrolls.length;
    const totalGross = payrolls.reduce((s, p) => s + p.grossSalary, 0);
    const totalDeductions = payrolls.reduce((s, p) => s + p.totalDeductions, 0);
    const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      summary: {
        totalEmployees,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating payroll summary",
      error: error.message,
    });
  }
};

// Department-wise Payroll Report
exports.getDepartmentWisePayroll = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    }).populate({
      path: "employee",
      populate: { path: "department", select: "name" },
    });

    const departmentMap = {};

    payrolls.forEach((p) => {
      const dept = p.employee.department?.name || "No Department";

      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          employees: 0,
          totalNetSalary: 0,
        };
      }

      departmentMap[dept].employees += 1;
      departmentMap[dept].totalNetSalary += p.netSalary;
    });

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      data: departmentMap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating department payroll report",
      error: error.message,
    });
  }
};

// Cost-to-Company (CTC) Analysis
exports.getCTCAnalysis = async (req, res) => {
  try {
    const { year } = req.query;

    const payrolls = await Payroll.find({
      year: parseInt(year),
    });

    const totalCTC = payrolls.reduce((s, p) => s + p.grossSalary, 0);
    const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);
    const totalDeductions = payrolls.reduce((s, p) => s + p.totalDeductions, 0);

    res.json({
      success: true,
      year,
      ctcAnalysis: {
        totalCTC,
        totalNetPaid: totalNet,
        totalDeductions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating CTC analysis",
      error: error.message,
    });
  }
};
