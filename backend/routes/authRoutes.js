const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, getMe, logout, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  loginRules,
  changePasswordRules,
  updateProfileRules,
  validate,
} = require('../middleware/validators');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/login', loginLimiter, loginRules(), validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePasswordRules(), validate, changePassword);
router.put('/profile', protect, updateProfileRules(), validate, updateProfile);

module.exports = router;
