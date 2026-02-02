const SalaryStructure = require("../models/SalaryStructure");

// Create salary structure
exports.createSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.create(req.body);
    res.status(201).json({
      success: true,
      message: "Salary structure created",
      data: structure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating salary structure",
      error: error.message,
    });
  }
};

// Get all salary structures
exports.getSalaryStructures = async (req, res) => {
  try {
    const structures = await SalaryStructure.find();
    res.json({
      success: true,
      data: structures,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching salary structures",
      error: error.message,
    });
  }
};

// Get single salary structure
exports.getSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findById(req.params.id);
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.json({
      success: true,
      data: structure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching salary structure",
      error: error.message,
    });
  }
};

// Update salary structure
exports.updateSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.json({
      success: true,
      message: "Salary structure updated",
      data: structure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating salary structure",
      error: error.message,
    });
  }
};

// Delete salary structure
exports.deleteSalaryStructure = async (req, res) => {
  try {
    const structure = await SalaryStructure.findByIdAndDelete(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    res.json({
      success: true,
      message: "Salary structure deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting salary structure",
      error: error.message,
    });
  }
};
