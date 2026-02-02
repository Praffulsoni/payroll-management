const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // e.g. "Junior Dev Template"
    },

    earnings: {
      basic: {
        type: Number,
        required: true,
        default: 0,
      },
      hra: {
        type: Number,
        default: 0,
      },
      allowances: {
        type: Number,
        default: 0,
      },
    },

    deductions: {
      pf: {
        type: Number,
        default: 0,
      },
      esi: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },

    description: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: Gross Salary
salaryStructureSchema.virtual("grossSalary").get(function () {
  return (
    this.earnings.basic +
    this.earnings.hra +
    this.earnings.allowances
  );
});

// Virtual: Total Deductions
salaryStructureSchema.virtual("totalDeductions").get(function () {
  return (
    this.deductions.pf +
    this.deductions.esi +
    this.deductions.tax +
    this.deductions.other
  );
});

// Virtual: Net Salary
salaryStructureSchema.virtual("netSalary").get(function () {
  return this.grossSalary - this.totalDeductions;
});

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);
