const Employee = require('../models/Employee');

// Role hierarchy and permissions
const rolePermissions = {
  superadmin: {
    level: 6,
    permissions: ['*'] // All permissions
  },
  admin: {
    level: 5,
    permissions: [
      'manage_users', 'view_users',
      'manage_employees', 'view_employees',
      'manage_departments', 'view_departments',
      'manage_payroll', 'view_payroll', 'approve_payroll',
      'manage_leaves', 'view_leaves', 'approve_leaves',
      'manage_attendance', 'view_attendance',
      'view_reports', 'generate_reports'
    ]
  },
  payroll_admin: {
    level: 4,
    permissions: [
      'view_employees',
      'manage_payroll', 'view_payroll', 'process_payroll',
      'view_attendance',
      'view_reports', 'generate_payroll_reports'
    ]
  },
  hr_admin: {
    level: 4,
    permissions: [
      'manage_employees', 'view_employees',
      'manage_departments', 'view_departments',
      'manage_leaves', 'view_leaves', 'approve_leaves',
      'manage_attendance', 'view_attendance',
      'view_reports', 'generate_hr_reports'
    ]
  },
  finance: {
    level: 4,
    permissions: [
      'view_employees',
      'view_payroll', 'approve_payroll', 'disburse_payroll',
      'view_reports', 'generate_finance_reports'
    ]
  },
  employee: {
    level: 1,
    permissions: [
      'view_own_profile', 'update_own_profile',
      'view_own_payroll',
      'apply_leave', 'view_own_leaves',
      'view_own_attendance'
    ]
  }
};

// Check if user has specific role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user has specific permission
const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRole = req.user.role;
    const userPermissions = rolePermissions[userRole]?.permissions || [];

    // Superadmin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasRequiredPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user can access another user's data
const canAccessUser = (req, res, next) => {
  const requestedUserId = req.params.id || req.params.userId;
  const currentUserId = req.user._id.toString();
  const userRole = req.user.role;

  // Users can always access their own data
  if (requestedUserId === currentUserId) {
    return next();
  }

  // Check if user has permission to view other users
  const canViewOthers = ['superadmin', 'admin', 'hr_admin'].includes(userRole);

  if (!canViewOthers) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own data'
    });
  }

  next();
};

// Check if a user can access a specific employee's data
const canAccessEmployeeData = async (req, res, next) => {
  const privilegedRoles = ['superadmin', 'admin', 'hr_admin', 'payroll_admin', 'finance'];
  const requestedEmployeeId = req.params.id;
  const currentUser = req.user;

  // Privileged roles can access any employee data
  if (privilegedRoles.includes(currentUser.role)) {
    return next();
  }

  // Non-privileged users (i.e., 'employee') can only access their own record
  if (currentUser.role === 'employee') {
    try {
      const employee = await Employee.findOne({ user: currentUser._id });
      if (employee && employee._id.toString() === requestedEmployeeId) {
        return next();
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(403).json({
    success: false,
    message: "You are not authorized to access this employee's data"
  });
};

// Check role level (hierarchical)
const minRoleLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRoleLevel = rolePermissions[req.user.role]?.level || 0;

    if (userRoleLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  hasPermission,
  canAccessUser,
  minRoleLevel,
  rolePermissions,
  canAccessEmployeeData,
};

