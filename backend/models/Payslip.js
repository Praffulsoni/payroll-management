const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema(
  {
    payroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
      unique: true
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    month: {
      type: Number,
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    earnings: {
      type: Object,
      required: true
    },

    deductions: {
      type: Object,
      required: true
    },

    grossSalary: {
      type: Number,
      required: true
    },

    netSalary: {
      type: Number,
      required: true
    },

    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payslip", payslipSchema);
