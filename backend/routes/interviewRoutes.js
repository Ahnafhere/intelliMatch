const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getMyInterviews,
  confirmInterviewAvailability,
  updateInterviewStatus,
  getInterviewReport,
  getInterviewStats,
  getApplicationTimeline,
  getRecentUpdates,
  downloadInterviewHistoryDocument,
  downloadApplicationInterviewDocument,
  getInterviewHistory,
} = require('../controllers/interviewController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Existing routes
router.post('/', protect, authorizeRoles('company', 'system_admin', 'university_admin'), scheduleInterview);
router.get('/my', protect, getMyInterviews);
router.put('/:id/confirm', protect, authorizeRoles('student'), confirmInterviewAvailability);
router.put('/:id/status', protect, authorizeRoles('company', 'system_admin', 'university_admin'), updateInterviewStatus);

// Reporting and history routes
router.get('/report/summary', protect, authorizeRoles('company', 'system_admin', 'university_admin'), getInterviewReport);
router.get('/report/statistics', protect, authorizeRoles('company', 'system_admin', 'university_admin'), getInterviewStats);
router.get('/report/history', protect, getInterviewHistory);
router.get('/report/recent-updates', protect, authorizeRoles('company', 'system_admin', 'university_admin'), getRecentUpdates);

// Application-specific timeline
router.get('/timeline/:applicationId', protect, getApplicationTimeline);

// Document download routes
router.get('/download/history', protect, authorizeRoles('company', 'system_admin', 'university_admin'), downloadInterviewHistoryDocument);
router.get('/download/timeline/:applicationId', protect, downloadApplicationInterviewDocument);

module.exports = router;
