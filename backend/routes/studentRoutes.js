const express = require('express');
const router = express.Router();
const { createProfile, updateProfile, getProfile, getMyProfile, importGitHubSkills } = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { uploadCV, confirmSkills } = require('../controllers/cvController');
const { uploadPdf: upload } = require('../utils/upload');

router.post('/profile', protect, authorizeRoles('student'), createProfile);
router.put('/profile', protect, authorizeRoles('student'), updateProfile);
router.get('/profile/me', protect, authorizeRoles('student'), getMyProfile);
router.get('/profile/:id', protect, getProfile);

router.post('/upload-cv', protect, authorizeRoles('student'), upload.single('cv'), uploadCV);
router.post('/confirm-skills', protect, authorizeRoles('student'), confirmSkills);

// GitHub Skills Import
router.post('/github-skills/:githubUsername', protect, authorizeRoles('student'), importGitHubSkills);

module.exports = router;
