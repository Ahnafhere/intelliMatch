const express = require('express');
const router = express.Router();
const { uploadCV, confirmSkills } = require('../controllers/cvController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { uploadPdf: upload } = require('../utils/upload');

router.post('/upload-cv', protect, authorizeRoles('student'), upload.single('cv'), uploadCV);
router.post('/confirm-skills', protect, authorizeRoles('student'), confirmSkills);

module.exports = router;
