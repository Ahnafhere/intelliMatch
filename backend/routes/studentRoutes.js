const express = require('express');
const router = express.Router();
const { createProfile, updateProfile, getProfile, getMyProfile, importGitHubSkills } = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { uploadCV, confirmSkills } = require('../controllers/cvController');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

router.post('/profile', protect, authorizeRoles('student'), createProfile);
router.put('/profile', protect, authorizeRoles('student'), updateProfile);
router.get('/profile/me', protect, authorizeRoles('student'), getMyProfile);
router.get('/profile/:id', protect, getProfile);

router.post('/upload-cv', protect, authorizeRoles('student'), upload.single('cv'), uploadCV);
router.post('/confirm-skills', protect, authorizeRoles('student'), confirmSkills);

// GitHub Skills Import
router.post('/github-skills/:githubUsername', protect, authorizeRoles('student'), importGitHubSkills);

module.exports = router;
