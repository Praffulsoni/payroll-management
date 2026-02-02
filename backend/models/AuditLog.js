const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT',
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE',
      'CREATE_DEPARTMENT', 'UPDATE_DEPARTMENT', 'DELETE_DEPARTMENT',
      'PROCESS_PAYROLL', 'APPROVE_PAYROLL', 'REJECT_PAYROLL',
      'APPLY_LEAVE', 'APPROVE_LEAVE', 'REJECT_LEAVE',
      'MARK_ATTENDANCE', 'UPDATE_ATTENDANCE',
      'GENERATE_REPORT', 'EXPORT_DATA',
      'SYSTEM_SETTINGS_UPDATE'
    ]
  },
  module: {
    type: String,
    enum: ['auth', 'users', 'employees', 'departments', 'payroll', 'leave', 'attendance', 'reports', 'settings']
  },
  description: {
    type: String
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetModel: {
    type: String
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed
  },
  newData: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
