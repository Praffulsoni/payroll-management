const express = require('express');
const router = express.Router();
const {
  getLeaves,
  getPendingLeaves,
  getLeave,
  applyLeave,
  approveLeave,
  cancelLeave,
  getMyLeaves,
  getLeaveStats
} = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Employee self-service routes
router.get('/my-leaves', getMyLeaves);
router.post('/apply', applyLeave);

// Pending leaves
router.get('/pending', authorize('superadmin', 'admin', 'hr_admin'), getPendingLeaves);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'hr_admin'), getLeaveStats);

// Main routes
router.route('/')
  .get(authorize('superadmin', 'admin', 'hr_admin'), getLeaves)
  .post(applyLeave);

router.route('/:id')
  .get(getLeave);

// Approval/Cancel routes
router.put('/:id/approve', authorize('superadmin', 'admin', 'hr_admin'), approveLeave);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
