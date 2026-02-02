const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  earnings: {
    basicSalary: {
      type: Number,
      required: true,
      default: 0
    },
    hra: {
      type: Number,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    overtime: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    incentives: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    tax: {
      type: Number,
      default: 0
    },
    pf: {
      type: Number,
      default: 0
    },
    esi: {
      type: Number,
      default: 0
    },
    loanDeduction: {
      type: Number,
      default: 0
    },
    leaveDeduction: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  grossSalary: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  workingDays: {
    type: Number,
    default: 0
  },
  presentDays: {
    type: Number,
    default: 0
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'processed', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash'],
    default: 'bank_transfer'
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for unique payroll per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  const earnings = this.earnings;
  const deductions = this.deductions;

  this.grossSalary = earnings.basicSalary + earnings.hra + earnings.allowances +
                     earnings.overtime + earnings.bonus + earnings.incentives;

  this.totalDeductions = deductions.tax + deductions.pf + deductions.esi +
                         deductions.loanDeduction + deductions.leaveDeduction + deductions.other;

  this.netSalary = this.grossSalary - this.totalDeductions;

  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
