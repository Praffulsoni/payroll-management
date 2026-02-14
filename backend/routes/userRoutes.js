const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  createUserRules,
  updateUserRules,
  validate,
} = require('../middleware/validators');

// Apply protect middleware to all routes
router.use(protect);

router.get('/stats', authorize('superadmin', 'admin'), getUserStats);
router.route('/')
  .get(authorize('superadmin', 'admin'), getUsers)
  .post(authorize('superadmin', 'admin'), createUserRules(), validate, createUser);

router.route('/:id')
  .get(authorize('superadmin', 'admin'), getUser)
  .put(authorize('superadmin', 'admin'), updateUserRules(), validate, updateUser)
  .delete(authorize('superadmin'), deactivateUser);

module.exports = router;
