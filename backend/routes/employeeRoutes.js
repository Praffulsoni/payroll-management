const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getMyProfile
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Employee self-service route
router.get('/me', getMyProfile);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'hr_admin'), getEmployeeStats);

// Main routes
router.route('/')
  .get(authorize('superadmin', 'admin', 'hr_admin', 'payroll_admin', 'finance'), getEmployees)
  .post(authorize('superadmin', 'admin', 'hr_admin'), createEmployee);

router.route('/:id')
  .get(authorize('superadmin', 'admin', 'hr_admin', 'payroll_admin', 'finance'), getEmployee)
  .put(authorize('superadmin', 'admin', 'hr_admin'), updateEmployee)
  .delete(authorize('superadmin', 'admin', 'hr_admin'), deleteEmployee);

module.exports = router;
