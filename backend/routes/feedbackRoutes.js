const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbackForApplication,
  getMyFeedback,
  getEligibleStudentApplications,
  getStudentCommunityFeedback,
} = require('../controllers/feedbackController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('student', 'company'), submitFeedback);
router.get('/application/:applicationId', protect, getFeedbackForApplication);
router.get('/my', protect, getMyFeedback);
router.get('/student/eligible', protect, authorizeRoles('student'), getEligibleStudentApplications);
router.get('/student/community', protect, authorizeRoles('student'), getStudentCommunityFeedback);

module.exports = router;
