const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth, getGoogleConfig } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/google/config', getGoogleConfig);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

module.exports = router;
