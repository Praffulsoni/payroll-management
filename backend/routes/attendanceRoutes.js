const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getTodayAttendance,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  getMyAttendance,
  checkIn,
  checkOut,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Employee self-service routes
router.get('/my-attendance', getMyAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

// Today's attendance
router.get('/today', authorize('superadmin', 'admin', 'hr_admin'), getTodayAttendance);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'hr_admin'), getAttendanceStats);

// Bulk marking
router.post('/bulk', authorize('superadmin', 'admin', 'hr_admin'), markBulkAttendance);

// Main routes
router.route('/')
  .get(authorize('superadmin', 'admin', 'hr_admin', 'payroll_admin'), getAttendance)
  .post(authorize('superadmin', 'admin', 'hr_admin'), markAttendance);

router.route('/:id')
  .put(authorize('superadmin', 'admin', 'hr_admin'), updateAttendance);

module.exports = router;
