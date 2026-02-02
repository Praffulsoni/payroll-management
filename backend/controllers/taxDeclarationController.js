const TaxDeclaration = require("../models/TaxDeclaration");
const Employee = require("../models/Employee");

// Create or update declaration
exports.saveTaxDeclaration = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const { financialYear, regime, totalInvestmentAmount, proofs } = req.body;

    let declaration = await TaxDeclaration.findOne({
      employee: employee._id,
      financialYear
    });

    if (declaration) {
      declaration = await TaxDeclaration.findByIdAndUpdate(
        declaration._id,
        { regime, totalInvestmentAmount, proofs, status: "submitted" },
        { new: true }
      );

      return res.json({
        success: true,
        message: "Tax declaration updated",
        data: declaration
      });
    }

    declaration = await TaxDeclaration.create({
      employee: employee._id,
      financialYear,
      regime,
      totalInvestmentAmount,
      proofs,
      status: "submitted"
    });

    res.status(201).json({
      success: true,
      message: "Tax declaration submitted",
      data: declaration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving tax declaration",
      error: error.message
    });
  }
};

// Get my tax declarations
exports.getMyTaxDeclarations = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    const declarations = await TaxDeclaration.find({
      employee: employee._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: declarations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tax declarations",
      error: error.message
    });
  }
};

// Get all declarations (HR/Finance)
exports.getAllTaxDeclarations = async (req, res) => {
  try {
    const declarations = await TaxDeclaration.find()
      .populate("employee", "firstName lastName employeeId");

    res.json({
      success: true,
      data: declarations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching declarations",
      error: error.message
    });
  }
};

// Approve or reject declaration
exports.reviewTaxDeclaration = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const declaration = await TaxDeclaration.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true }
    );

    if (!declaration) {
      return res.status(404).json({ message: "Declaration not found" });
    }

    res.json({
      success: true,
      message: "Tax declaration reviewed",
      data: declaration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reviewing declaration",
      error: error.message
    });
  }
};
