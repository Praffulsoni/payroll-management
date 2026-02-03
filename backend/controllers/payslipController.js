const Payslip = require("../models/Payslip");
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const PDFDocument = require("pdfkit");

// Generate payslip from payroll
exports.generatePayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.body.payrollId)
      .populate("employee");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }

    const existingPayslip = await Payslip.findOne({ payroll: payroll._id });
    if (existingPayslip) {
      return res.status(400).json({
        success: false,
        message: "Payslip already generated for this payroll"
      });
    }

    const payslip = await Payslip.create({
      payroll: payroll._id,
      employee: payroll.employee._id,
      month: payroll.month,
      year: payroll.year,
      earnings: payroll.earnings,
      deductions: payroll.deductions,
      grossSalary: payroll.grossSalary,
      netSalary: payroll.netSalary
    });

    res.status(201).json({
      success: true,
      message: "Payslip generated successfully",
      data: payslip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating payslip",
      error: error.message
    });
  }
};

// Get all payslips (Admin/HR)
exports.getAllPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find()
      .populate("employee", "firstName lastName employeeId")
      .populate("payroll");

    res.json({
      success: true,
      data: payslips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payslips",
      error: error.message
    });
  }
};

// Get single payslip
exports.getPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId")
      .populate("payroll");

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found"
      });
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payslip",
      error: error.message
    });
  }
};

// Get my payslips (Employee)
exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found"
      });
    }

    const payslips = await Payslip.find({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: payslips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payslips",
      error: error.message
    });
  }
};

exports.downloadPayslipPDF = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId")
      .populate("payroll");

    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${payslip.employee.employeeId}-${payslip.month}-${payslip.year}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("PAYSLIP", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName}`);
    doc.text(`Employee ID: ${payslip.employee.employeeId}`);
    doc.text(`Month/Year: ${payslip.month}/${payslip.year}`);
    doc.moveDown();

    doc.text("EARNINGS:");
    Object.entries(payslip.earnings).forEach(([key, value]) => {
      doc.text(`${key}: ₹${value}`);
    });

    doc.moveDown();
    doc.text("DEDUCTIONS:");
    Object.entries(payslip.deductions).forEach(([key, value]) => {
      doc.text(`${key}: ₹${value}`);
    });

    doc.moveDown();
    doc.text(`Gross Salary: ₹${payslip.grossSalary}`);
    doc.text(`Net Salary: ₹${payslip.netSalary}`);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};
