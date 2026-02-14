const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  getEmployeeStats,
  getMyProfile
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { authorize, canAccessEmployeeData } = require('../middleware/roleCheck');

const {
  createEmployeeRules,
  updateEmployeeRules,
  validate,
} = require('../middleware/validators');

// Apply protect middleware to all routes
router.use(protect);

// Employee self-service route
router.get('/me', getMyProfile);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'hr_admin'), getEmployeeStats);

// Main routes
router.route('/')
  .get(authorize('superadmin', 'admin', 'hr_admin', 'payroll_admin', 'finance'), getEmployees)
  .post(authorize('superadmin', 'admin', 'hr_admin'), createEmployeeRules(), validate, createEmployee);

router.route('/:id')
  .get(canAccessEmployeeData, getEmployee)
  .put(authorize('superadmin', 'admin', 'hr_admin'), updateEmployeeRules(), validate, updateEmployee)
  .delete(authorize('superadmin', 'admin', 'hr_admin'), terminateEmployee);

module.exports = router;
