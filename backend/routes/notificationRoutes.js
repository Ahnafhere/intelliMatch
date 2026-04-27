const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  generateDeadlineReminders,
  generateInterviewReminders,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.put('/read-all', protect, markAllAsRead);
router.post('/deadline-reminders', protect, generateDeadlineReminders);
router.post('/interview-reminders', protect, generateInterviewReminders);

module.exports = router;
