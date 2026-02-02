const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  designation: {
    type: String,
    required: [true, 'Designation is required']
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required']
  },
  salary: {
    basic: {
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
    deductions: {
      type: Number,
      default: 0
    }
  },
  bankDetails: {
    accountNumber: {
      type: String
    },
    bankName: {
      type: String
    },
    ifscCode: {
      type: String
    },
    accountHolderName: {
      type: String
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  leaveBalance: {
    casual: {
      type: Number,
      default: 12
    },
    sick: {
      type: Number,
      default: 12
    },
    earned: {
      type: Number,
      default: 15
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on_notice'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1001).padStart(5, '0')}`;
  }
  next();
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for gross salary
employeeSchema.virtual('grossSalary').get(function() {
  return this.salary.basic + this.salary.hra + this.salary.allowances;
});

module.exports = mongoose.model('Employee', employeeSchema);
