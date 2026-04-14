const router = require('express').Router();
const { register, login, logout, getProfile, updateProfile, updatePassword, getOnboardingOptions, forgotPassword, resetPassword, uploadAvatar } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/onboarding-options', getOnboardingOptions);
router.get('/profile',          authenticate, getProfile);
router.put('/profile',          authenticate, updateProfile);
router.put('/password',         authenticate, updatePassword);
router.put('/avatar',           authenticate, uploadAvatar);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
