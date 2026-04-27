const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'APPLICATION_SUBMITTED',
      'STATUS_UPDATED',
      'DEADLINE_REMINDER',
      'INTERVIEW_REMINDER',
      'SHORTLIST_ALERT',
      'INTERVIEW_INVITE',
      'INTERVIEW_STATUS',
      'FEEDBACK_RECEIVED',
      'SYSTEM',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
