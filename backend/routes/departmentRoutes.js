const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats
} = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

// Get all departments (no pagination - for dropdowns)
router.get('/all', getAllDepartments);

// Stats route
router.get('/stats', authorize('superadmin', 'admin', 'hr_admin'), getDepartmentStats);

// Main routes
router.route('/')
  .get(getDepartments)
  .post(authorize('superadmin', 'admin', 'hr_admin'), createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(authorize('superadmin', 'admin', 'hr_admin'), updateDepartment)
  .delete(authorize('superadmin', 'admin'), deleteDepartment);

module.exports = router;
