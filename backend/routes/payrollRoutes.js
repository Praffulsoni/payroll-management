const express = require('express');
const router = express.Router();
const {
  getPayrolls,
  getPayroll,
  processPayroll,
  processBulkPayroll,
  approvePayroll,
  markAsPaid,
  getMyPayroll,
  getPayrollStats
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Employee self-service route
router.get('/my-payroll', getMyPayroll);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'payroll_admin', 'finance'), getPayrollStats);

// Process routes
router.post('/process', authorize('superadmin', 'admin', 'payroll_admin'), processPayroll);
router.post('/process-bulk', authorize('superadmin', 'admin', 'payroll_admin'), processBulkPayroll);

// Main routes
router.route('/')
  .get(authorize('superadmin', 'admin', 'payroll_admin', 'finance'), getPayrolls);

router.route('/:id')
  .get(authorize('superadmin', 'admin', 'payroll_admin', 'finance'), getPayroll);

// Approval routes
router.put('/:id/approve', authorize('superadmin', 'admin', 'finance'), approvePayroll);
router.put('/:id/pay', authorize('superadmin', 'admin', 'finance'), markAsPaid);

module.exports = router;
