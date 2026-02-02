const Payroll = require("../models/Payroll");
const Statutory = require("../models/Statutory");
const { getMonthName } = require("../utils/helpers");

// PF Report
exports.getPFReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    }).populate("employee", "firstName lastName employeeId");

    const report = payrolls.map((p) => ({
      employeeId: p.employee.employeeId,
      name: `${p.employee.firstName} ${p.employee.lastName}`,
      basicSalary: p.earnings.basicSalary,
      pfAmount: p.deductions.pf,
    }));

    const totalPF = report.reduce((sum, r) => sum + r.pfAmount, 0);

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      totalPF,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating PF report",
      error: error.message,
    });
  }
};

// ESI Report
exports.getESIReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    }).populate("employee", "firstName lastName employeeId");

    const report = payrolls.map((p) => ({
      employeeId: p.employee.employeeId,
      name: `${p.employee.firstName} ${p.employee.lastName}`,
      grossSalary: p.grossSalary,
      esiAmount: p.deductions.esi,
    }));

    const totalESI = report.reduce((sum, r) => sum + r.esiAmount, 0);

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      totalESI,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating ESI report",
      error: error.message,
    });
  }
};

// Professional Tax (PT) Report
exports.getPTReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    }).populate("employee", "firstName lastName employeeId");

    const report = payrolls.map((p) => ({
      employeeId: p.employee.employeeId,
      name: `${p.employee.firstName} ${p.employee.lastName}`,
      ptAmount: p.deductions.other || 0,
    }));

    const totalPT = report.reduce((sum, r) => sum + r.ptAmount, 0);

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      totalPT,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating PT report",
      error: error.message,
    });
  }
};

// Compliance Summary
exports.getComplianceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    });

    const totalPF = payrolls.reduce((sum, p) => sum + p.deductions.pf, 0);
    const totalESI = payrolls.reduce((sum, p) => sum + p.deductions.esi, 0);
    const totalTax = payrolls.reduce((sum, p) => sum + p.deductions.tax, 0);

    res.json({
      success: true,
      month: getMonthName(month),
      year,
      compliance: {
        pf: totalPF,
        esi: totalESI,
        tax: totalTax,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating compliance summary",
      error: error.message,
    });
  }
};
const PDFDocument = require("pdfkit");
const Payroll = require("../models/Payroll");
const { getMonthName } = require("../utils/helpers");

// Generic PDF generator
const generatePDF = (res, title, rows, totals) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${title}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown();

  rows.forEach((row) => {
    Object.values(row).forEach((val) => {
      doc.text(String(val));
    });
    doc.moveDown();
  });

  if (totals) {
    doc.moveDown();
    doc.text("TOTALS:");
    Object.entries(totals).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`);
    });
  }

  doc.end();
};

// PF PDF
exports.downloadPFReport = async (req, res) => {
  const { month, year } = req.query;

  const payrolls = await Payroll.find({
    month: parseInt(month),
    year: parseInt(year),
  }).populate("employee", "firstName lastName employeeId");

  const rows = payrolls.map((p) => ({
    Employee: `${p.employee.firstName} ${p.employee.lastName}`,
    EmpID: p.employee.employeeId,
    PF: p.deductions.pf,
  }));

  const totalPF = rows.reduce((s, r) => s + r.PF, 0);

  generatePDF(
    res,
    `PF_Report_${getMonthName(month)}_${year}`,
    rows,
    { totalPF }
  );
};

// ESI PDF
exports.downloadESIReport = async (req, res) => {
  const { month, year } = req.query;

  const payrolls = await Payroll.find({
    month: parseInt(month),
    year: parseInt(year),
  }).populate("employee", "firstName lastName employeeId");

  const rows = payrolls.map((p) => ({
    Employee: `${p.employee.firstName} ${p.employee.lastName}`,
    EmpID: p.employee.employeeId,
    ESI: p.deductions.esi,
  }));

  const totalESI = rows.reduce((s, r) => s + r.ESI, 0);

  generatePDF(
    res,
    `ESI_Report_${getMonthName(month)}_${year}`,
    rows,
    { totalESI }
  );
};

// PT PDF
exports.downloadPTReport = async (req, res) => {
  const { month, year } = req.query;

  const payrolls = await Payroll.find({
    month: parseInt(month),
    year: parseInt(year),
  }).populate("employee", "firstName lastName employeeId");

  const rows = payrolls.map((p) => ({
    Employee: `${p.employee.firstName} ${p.employee.lastName}`,
    EmpID: p.employee.employeeId,
    PT: p.deductions.other || 0,
  }));

  const totalPT = rows.reduce((s, r) => s + r.PT, 0);

  generatePDF(
    res,
    `PT_Report_${getMonthName(month)}_${year}`,
    rows,
    { totalPT }
  );
};

// Compliance Summary PDF
exports.downloadComplianceSummary = async (req, res) => {
  const { month, year } = req.query;

  const payrolls = await Payroll.find({
    month: parseInt(month),
    year: parseInt(year),
  });

  const totals = {
    PF: payrolls.reduce((s, p) => s + p.deductions.pf, 0),
    ESI: payrolls.reduce((s, p) => s + p.deductions.esi, 0),
    TAX: payrolls.reduce((s, p) => s + p.deductions.tax, 0),
  };

  generatePDF(
    res,
    `Compliance_Summary_${getMonthName(month)}_${year}`,
    [],
    totals
  );
};
