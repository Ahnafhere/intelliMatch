const Notification = require('../models/Notification');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

const processDeadlineRemindersForStudent = async (userId) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const apps = await Application.find({
    studentId: userId,
    status: { $nin: ['Rejected', 'Selected'] },
  }).populate('internshipId', 'title deadline');

  const candidates = [];
  for (const app of apps) {
    const deadlineRaw = app.internshipId?.deadline;
    if (!deadlineRaw) continue;

    const deadline = new Date(deadlineRaw);
    if (Number.isNaN(deadline.getTime())) continue;

    // Treat deadline as inclusive through the end of its calendar day.
    const deadlineEnd = new Date(deadline);
    deadlineEnd.setHours(23, 59, 59, 999);

    if (deadlineEnd > soon || deadlineEnd < now) continue;

    const reminderKey = `${app._id}_${deadline.toISOString().slice(0, 10)}`;
    candidates.push({
      reminderKey,
      doc: {
        userId,
        type: 'DEADLINE_REMINDER',
        title: 'Upcoming Internship Deadline',
        message: `${app.internshipId?.title || 'An internship'} has an upcoming deadline on ${deadline.toLocaleDateString()}.`,
        metadata: {
          internshipId: app.internshipId?._id,
          applicationId: app._id,
          reminderKey,
        },
      },
    });
  }

  if (candidates.length === 0) return 0;

  const reminderKeys = candidates.map((c) => c.reminderKey);
  const existing = await Notification.find({
    userId,
    type: 'DEADLINE_REMINDER',
    'metadata.reminderKey': { $in: reminderKeys },
  })
    .select('metadata.reminderKey')
    .lean();

  const existingKeys = new Set(existing.map((item) => item?.metadata?.reminderKey).filter(Boolean));
  const toCreate = candidates
    .filter((c) => !existingKeys.has(c.reminderKey))
    .map((c) => c.doc);

  if (toCreate.length === 0) return 0;

  await Notification.insertMany(toCreate);
  return toCreate.length;
};

const processInterviewRemindersForStudent = async (userId) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const interviews = await Interview.find({
    studentId: userId,
    status: 'Scheduled',
    scheduledAt: { $gte: now, $lte: soon },
  }).populate('internshipId', 'title');

  const candidates = interviews
    .filter((interview) => interview.scheduledAt && !Number.isNaN(new Date(interview.scheduledAt).getTime()))
    .map((interview) => {
      const scheduledAt = new Date(interview.scheduledAt);
      const reminderKey = `${interview._id}_${scheduledAt.toISOString()}`;

      return {
        reminderKey,
        doc: {
          userId,
          type: 'INTERVIEW_REMINDER',
          title: 'Upcoming Interview Reminder',
          message: `Your interview for ${interview.internshipId?.title || 'an internship'} is scheduled for ${scheduledAt.toLocaleString()} and is less than 1 day away.`,
          metadata: {
            interviewId: interview._id,
            internshipId: interview.internshipId?._id,
            reminderKey,
          },
        },
      };
    });

  if (candidates.length === 0) return 0;

  const reminderKeys = candidates.map((c) => c.reminderKey);
  const existing = await Notification.find({
    userId,
    type: 'INTERVIEW_REMINDER',
    'metadata.reminderKey': { $in: reminderKeys },
  })
    .select('metadata.reminderKey')
    .lean();

  const existingKeys = new Set(existing.map((item) => item?.metadata?.reminderKey).filter(Boolean));
  const toCreate = candidates
    .filter((c) => !existingKeys.has(c.reminderKey))
    .map((c) => c.doc);

  if (toCreate.length === 0) return 0;

  await Notification.insertMany(toCreate);
  return toCreate.length;
};

const getMyNotifications = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));

  try {
    if (!req.user || !req.user._id) {
      console.warn('[getMyNotifications] Missing or invalid user in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role === 'student') {
      await processDeadlineRemindersForStudent(req.user._id);
      await processInterviewRemindersForStudent(req.user._id);
    }

    const [items, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ userId: req.user._id }),
    ]);

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    console.log(`[getMyNotifications] Retrieved ${items.length} notifications for user ${req.user._id}`);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount,
    });
  } catch (err) {
    console.error('[getMyNotifications] Error:', err.message);
    res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      console.warn(`[markNotificationAsRead] Notification not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log(`[markNotificationAsRead] Notification marked as read: ${notification._id}`);
    res.json(notification);
  } catch (err) {
    console.error('[markNotificationAsRead] Error:', err.message);
    res.status(500).json({ message: 'Failed to mark read', error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    console.log(`[markAllAsRead] Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`);
    res.json({ message: 'Notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('[markAllAsRead] Error:', err.message);
    res.status(500).json({ message: 'Failed to mark all read', error: err.message });
  }
};

const generateDeadlineReminders = async (req, res) => {
  try {
    const created = await processDeadlineRemindersForStudent(req.user._id);
    console.log(`[generateDeadlineReminders] Created ${created} deadline reminders for user ${req.user._id}`);

    res.json({ message: 'Deadline reminders processed', created });
  } catch (err) {
    console.error('[generateDeadlineReminders] Error:', err.message);
    res.status(500).json({ message: 'Failed to generate reminders', error: err.message });
  }
};

const generateInterviewReminders = async (req, res) => {
  try {
    const created = await processInterviewRemindersForStudent(req.user._id);
    console.log(`[generateInterviewReminders] Created ${created} interview reminders for user ${req.user._id}`);

    res.json({ message: 'Interview reminders processed', created });
  } catch (err) {
    console.error('[generateInterviewReminders] Error:', err.message);
    res.status(500).json({ message: 'Failed to generate interview reminders', error: err.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  generateDeadlineReminders,
  generateInterviewReminders,
};
