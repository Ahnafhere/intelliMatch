const express = require('express');
const router = express.Router();
const {
  verifyStudentSkill,
  getMyVerifiedSkills,
  getStudentVerifications,
} = require('../controllers/skillVerificationController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('company', 'university_admin', 'system_admin'), verifyStudentSkill);
router.get('/my', protect, authorizeRoles('student'), getMyVerifiedSkills);
router.get('/student/:studentId', protect, authorizeRoles('company', 'university_admin', 'system_admin'), getStudentVerifications);

module.exports = router;
