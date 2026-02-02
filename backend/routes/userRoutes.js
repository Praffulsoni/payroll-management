const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Apply protect middleware to all routes
router.use(protect);

router.get('/stats', authorize('superadmin', 'admin'), getUserStats);
router.route('/')
  .get(authorize('superadmin', 'admin'), getUsers)
  .post(authorize('superadmin', 'admin'), createUser);

router.route('/:id')
  .get(authorize('superadmin', 'admin'), getUser)
  .put(authorize('superadmin', 'admin'), updateUser)
  .delete(authorize('superadmin'), deleteUser);

module.exports = router;
