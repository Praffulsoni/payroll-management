const { body, validationResult } = require('express-validator');

// Middleware to handle the result of validation chains
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors,
  });
};

// --- AUTH VALIDATION RULES ---

const loginRules = () => {
  return [
    body('email', 'A valid email is required').isEmail().normalizeEmail(),
    body('password', 'Password cannot be empty').not().isEmpty(),
  ];
};

const changePasswordRules = () => {
  return [
    body('currentPassword', 'Current password cannot be empty').not().isEmpty(),
    body('newPassword', 'New password must be at least 8 characters long').isLength({ min: 8 }),
  ];
};

const updateProfileRules = () => {
  return [
    body('name', 'Name cannot be empty').not().isEmpty().trim().escape(),
    body('avatar', 'A valid avatar URL is required').optional({ checkFalsy: true }).isURL(),
  ];
};

// --- USER VALIDATION RULES ---
const ALLOWED_ROLES = ['superadmin', 'admin', 'payroll_admin', 'hr_admin', 'finance', 'employee'];

const createUserRules = () => {
  return [
    body('name', 'Name is required').not().isEmpty().trim().escape(),
    body('email', 'A valid email is required').isEmail().normalizeEmail(),
    body('password', 'Password is required and must be at least 8 characters').isLength({ min: 8 }),
    body('role', `Role is required and must be one of: ${ALLOWED_ROLES.join(', ')}`).isIn(ALLOWED_ROLES),
  ];
};

const updateUserRules = () => {
  return [
    body('name', 'Name cannot be empty').optional().not().isEmpty().trim().escape(),
    body('email', 'A valid email is required').optional().isEmail().normalizeEmail(),
    body('role', `Role must be one of: ${ALLOWED_ROLES.join(', ')}`).optional().isIn(ALLOWED_ROLES),
    body('isActive', 'isActive must be a boolean').optional().isBoolean(),
  ];
};

// --- EMPLOYEE VALIDATION RULES ---

const employeeValidationRules = [
  body('firstName', 'First name is required').not().isEmpty().trim().escape(),
  body('lastName', 'Last name is required').not().isEmpty().trim().escape(),
  body('email', 'A valid email is required').isEmail().normalizeEmail(),
  body('phone', 'Phone number is required').not().isEmpty().trim().escape(),
  body('dateOfBirth', 'A valid date of birth is required').isISO8601().toDate(),
  body('gender', 'Gender is required').not().isEmpty().trim().escape(),
  body('department', 'Department ID is required').isMongoId(),
  body('designation', 'Designation is required').not().isEmpty().trim().escape(),
  body('dateOfJoining', 'A valid date of joining is required').isISO8601().toDate(),
  body('salary', 'Salary must be a positive number').isFloat({ gt: 0 }),
  
  // Bank Details
  body('bankDetails.bankName', 'Bank name is required').not().isEmpty().trim().escape(),
  body('bankDetails.accountNumber', 'Bank account number is required').not().isEmpty().isAlphanumeric().trim(),
  body('bankDetails.ifscCode', 'IFSC code is required').not().isEmpty().isAlphanumeric().trim(),

  // Address
  body('address.street', 'Street is required').not().isEmpty().trim().escape(),
  body('address.city', 'City is required').not().isEmpty().trim().escape(),
  body('address.state', 'State is required').not().isEmpty().trim().escape(),
  body('address.zipCode', 'Zip code is required').not().isEmpty().isPostalCode('IN'),

  // Emergency Contact
  body('emergencyContact.name', 'Emergency contact name is required').not().isEmpty().trim().escape(),
  body('emergencyContact.relationship', 'Emergency contact relationship is required').not().isEmpty().trim().escape(),
  body('emergencyContact.phone', 'Emergency contact phone is required').not().isEmpty().trim().escape(),
];

const createEmployeeRules = () => {
  return [
    ...employeeValidationRules,
    // Password is only required on creation
    body('password', 'Password is required and must be at least 8 characters').isLength({ min: 8 }),
  ];
};

const updateEmployeeRules = () => {
  // Make all base rules optional for updates
  return employeeValidationRules.map(rule => rule.optional());
};


module.exports = {
  validate,
  loginRules,
  changePasswordRules,
  updateProfileRules,
  createUserRules,
  updateUserRules,
  createEmployeeRules,
  updateEmployeeRules,
};
