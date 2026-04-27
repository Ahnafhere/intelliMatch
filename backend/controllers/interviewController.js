const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');
const { appendTimelineEvent } = require('../utils/applicationTimeline');
const {
  generateInterviewHistory,
  getInterviewStatistics,
  getApplicationInterviewTimeline,
  generateCompanyInterviewReport,
  getRecentInterviewUpdates,
} = require('../utils/interviewReportingService');
const {
  generateInterviewHistoryDocument,
  generateApplicationInterviewDocument,
  saveDocumentToFile,
} = require('../utils/documentService');

const scheduleInterview = async (req, res) => {
  const { applicationId, scheduledAt, durationMinutes, mode, meetingLink, location, notes } = req.body;

  if (!applicationId || !scheduledAt) {
    return res.status(400).json({ message: 'applicationId and scheduledAt are required' });
  }

  try {
    const app = await Application.findById(applicationId).populate('internshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const internship = await Internship.findById(app.internshipId?._id || app.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const isOwner = internship.companyId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    const interview = await Interview.create({
      applicationId: app._id,
      internshipId: internship._id,
      companyId: internship.companyId,
      studentId: app.studentId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes) || 45,
      mode: mode || 'Online',
      meetingLink: meetingLink || '',
      location: location || '',
      notes: notes || '',
      history: [{ status: 'Scheduled', note: 'Interview scheduled', changedBy: req.user._id }],
    });

    app.interviewStatus = 'Scheduled';
    if (app.status === 'Pending') app.status = 'Shortlisted';
    appendTimelineEvent(app, 'Interview Scheduled', `Interview on ${new Date(scheduledAt).toLocaleString()}`);
    await app.save();

    await notify({
      userId: app.studentId,
      type: 'INTERVIEW_INVITE',
      title: 'Interview Invitation Received',
      message: `You have been invited to an interview for ${internship.title}.`,
      metadata: { interviewId: interview._id, applicationId: app._id, internshipId: internship._id },
    });

    await logActivity({
      actor: req.user,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'Interview',
      entityId: interview._id,
      details: { applicationId: app._id, internshipId: internship._id },
    });

    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Failed to schedule interview', error: err.message });
  }
};

const getMyInterviews = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') filter.studentId = req.user._id;
    if (req.user.role === 'company') filter.companyId = req.user._id;

    const interviews = await Interview.find(filter)
      .populate('internshipId', 'title companyName')
      .populate('studentId', 'name email')
      .populate('companyId', 'name email')
      .sort({ scheduledAt: -1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch interviews', error: err.message });
  }
};

const confirmInterviewAvailability = async (req, res) => {
  const { confirmation } = req.body;
  if (!['Confirmed', 'Declined'].includes(confirmation)) {
    return res.status(400).json({ message: 'confirmation must be Confirmed or Declined' });
  }

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    interview.studentConfirmation = confirmation;
    interview.history.push({
      status: `Student ${confirmation}`,
      note: `Student ${confirmation.toLowerCase()} availability`,
      changedBy: req.user._id,
    });
    await interview.save();

    await notify({
      userId: interview.companyId,
      type: 'INTERVIEW_STATUS',
      title: 'Interview Confirmation Updated',
      message: `Student has ${confirmation.toLowerCase()} the interview invitation.`,
      metadata: { interviewId: interview._id },
    });

    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm interview', error: err.message });
  }
};

const updateInterviewStatus = async (req, res) => {
  const { status, note } = req.body;
  const valid = ['Scheduled', 'Completed', 'Selected', 'Rejected'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const isOwner = interview.companyId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    interview.status = status;
    interview.history.push({ status, note: note || '', changedBy: req.user._id });
    await interview.save();

    const app = await Application.findById(interview.applicationId);
    if (app) {
      if (status === 'Completed') app.interviewStatus = 'Completed';
      if (status === 'Selected') {
        app.interviewStatus = 'Selected';
        app.status = 'Selected';
      }
      if (status === 'Rejected') {
        app.interviewStatus = 'Rejected';
        app.status = 'Rejected';
      }

      appendTimelineEvent(app, status === 'Completed' ? 'Interview Completed' : 'Final Decision', note || `Interview ${status}`);
      await app.save();
    }

    // Generate real-time document update
    try {
      const docContent = await generateApplicationInterviewDocument(interview.applicationId);
      const docFilename = `interview_${interview._id}_${Date.now()}.html`;
      saveDocumentToFile(docContent, docFilename);
    } catch (docErr) {
      console.error('Failed to generate interview document:', docErr.message);
      // Don't fail the request if document generation fails
    }

    await notify({
      userId: interview.studentId,
      type: 'INTERVIEW_STATUS',
      title: 'Interview Status Updated',
      message: `Your interview status is now ${status}.`,
      metadata: { interviewId: interview._id, applicationId: interview.applicationId },
    });

    await logActivity({
      actor: req.user,
      action: 'INTERVIEW_STATUS_UPDATED',
      entityType: 'Interview',
      entityId: interview._id,
      details: { status },
    });

    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update interview status', error: err.message });
  }
};

/**
 * Get interview history report with statistics
 */
const getInterviewReport = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    // Validate authorization
    let finalCompanyId = companyId;
    if (req.user.role === 'company') {
      finalCompanyId = req.user._id;
    } else if (!['system_admin', 'university_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized to view reports' });
    }

    const report = await generateCompanyInterviewReport(finalCompanyId, startDate, endDate);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate interview report', error: err.message });
  }
};

/**
 * Get interview statistics summary
 */
const getInterviewStats = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    let finalCompanyId = companyId;
    if (req.user.role === 'company') {
      finalCompanyId = req.user._id;
    } else if (!['system_admin', 'university_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const stats = await getInterviewStatistics(finalCompanyId, startDate, endDate);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
};

/**
 * Get application interview timeline
 */
const getApplicationTimeline = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Check authorization
    const isStudent = req.user.role === 'student' && app.studentId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    
    if (!isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const timeline = await getApplicationInterviewTimeline(applicationId);
    if (!timeline) {
      return res.status(404).json({ message: 'No interview found for this application' });
    }

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch timeline', error: err.message });
  }
};

/**
 * Get recent interview updates (real-time changes)
 */
const getRecentUpdates = async (req, res) => {
  try {
    const { minutesAgo } = req.query;
    const minutes = parseInt(minutesAgo) || 60;

    let companyId = null;
    if (req.user.role === 'company') {
      companyId = req.user._id;
    } else if (!['system_admin', 'university_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = await getRecentInterviewUpdates(companyId, minutes);
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recent updates', error: err.message });
  }
};

/**
 * Download interview history as HTML document
 */
const downloadInterviewHistoryDocument = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let companyId = null;
    if (req.user.role === 'company') {
      companyId = req.user._id;
    } else if (!['system_admin', 'university_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const htmlContent = await generateInterviewHistoryDocument(companyId, startDate, endDate);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="interview_history_${Date.now()}.html"`);
    res.send(htmlContent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download document', error: err.message });
  }
};

/**
 * Download application interview timeline document
 */
const downloadApplicationInterviewDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Check authorization
    const isStudent = req.user.role === 'student' && app.studentId.toString() === req.user._id.toString();
    const isAdmin = ['system_admin', 'university_admin'].includes(req.user.role);
    
    if (!isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const htmlContent = await generateApplicationInterviewDocument(applicationId);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="interview_timeline_${applicationId}_${Date.now()}.html"`);
    res.send(htmlContent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download document', error: err.message });
  }
};

/**
 * Get interview history (raw data for custom analysis)
 */
const getInterviewHistory = async (req, res) => {
  try {
    const { companyId, studentId, startDate, endDate } = req.query;

    const filters = {};
    
    if (req.user.role === 'company') {
      filters.companyId = req.user._id;
    } else if (req.user.role === 'student') {
      filters.studentId = req.user._id;
    } else if (!['system_admin', 'university_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    } else {
      if (companyId) filters.companyId = companyId;
      if (studentId) filters.studentId = studentId;
    }

    if (startDate || endDate) {
      filters.scheduledAt = {};
      if (startDate) filters.scheduledAt.$gte = new Date(startDate);
      if (endDate) filters.scheduledAt.$lte = new Date(endDate);
    }

    const history = await generateInterviewHistory(filters);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch interview history', error: err.message });
  }
};

module.exports = {
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
};
