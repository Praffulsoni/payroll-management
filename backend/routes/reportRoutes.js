const express = require('express');
const router = express.Router();
const {
  getPayrollReport,
  getAttendanceReport,
  getLeaveReport,
  getFinanceReport,
  getDashboardStats
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Dashboard stats (accessible by all authenticated users)
router.get('/dashboard', getDashboardStats);

// Report routes
router.get('/payroll', authorize('superadmin', 'admin', 'payroll_admin', 'finance'), getPayrollReport);
router.get('/attendance', authorize('superadmin', 'admin', 'hr_admin'), getAttendanceReport);
router.get('/leave', authorize('superadmin', 'admin', 'hr_admin'), getLeaveReport);
router.get('/finance', authorize('superadmin', 'admin', 'finance'), getFinanceReport);

module.exports = router;
