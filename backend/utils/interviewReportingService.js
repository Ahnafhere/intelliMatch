const Interview = require('../models/Interview');
const Application = require('../models/Application');
const User = require('../models/User');
const Internship = require('../models/Internship');

/**
 * Generate comprehensive interview history for reporting
 */
const generateInterviewHistory = async (filters = {}) => {
  try {
    const interviews = await Interview.find(filters)
      .populate('studentId', 'name email')
      .populate('companyId', 'name email companyName')
      .populate('internshipId', 'title')
      .populate('applicationId', 'matchScore')
      .lean();

    return interviews.map(interview => ({
      _id: interview._id,
      internshipTitle: interview.internshipId?.title || 'N/A',
      companyName: interview.companyId?.companyName || interview.companyId?.name || 'N/A',
      studentName: interview.studentId?.name || 'N/A',
      studentEmail: interview.studentId?.email || 'N/A',
      scheduledDate: interview.scheduledAt,
      duration: interview.durationMinutes,
      mode: interview.mode,
      meetingLink: interview.meetingLink,
      location: interview.location,
      notes: interview.notes,
      studentConfirmation: interview.studentConfirmation,
      currentStatus: interview.status,
      matchScore: interview.applicationId?.matchScore || 0,
      fullHistory: interview.history,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }));
  } catch (err) {
    throw new Error(`Failed to generate interview history: ${err.message}`);
  }
};

/**
 * Get interview statistics for a given period
 */
const getInterviewStatistics = async (companyId = null, startDate = null, endDate = null) => {
  try {
    const matchStage = {};
    if (companyId) matchStage.companyId = companyId;
    if (startDate || endDate) {
      matchStage.scheduledAt = {};
      if (startDate) matchStage.scheduledAt.$gte = new Date(startDate);
      if (endDate) matchStage.scheduledAt.$lte = new Date(endDate);
    }

    const stats = await Interview.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          studentConfirmed: { $sum: { $cond: [{ $eq: ['$studentConfirmation', 'Confirmed'] }, 1, 0] } },
          studentPending: { $sum: { $cond: [{ $eq: ['$studentConfirmation', 'Pending'] }, 1, 0] } },
          studentDeclined: { $sum: { $cond: [{ $eq: ['$studentConfirmation', 'Declined'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0,
      scheduled: 0,
      completed: 0,
      selected: 0,
      rejected: 0,
      studentConfirmed: 0,
      studentPending: 0,
      studentDeclined: 0,
    };

    return {
      ...result,
      selectionRate: result.total ? ((result.selected / result.completed) * 100 || 0).toFixed(2) : 0,
      confirmationRate: result.total ? ((result.studentConfirmed / result.total) * 100 || 0).toFixed(2) : 0,
      declineRate: result.total ? ((result.studentDeclined / result.total) * 100 || 0).toFixed(2) : 0,
    };
  } catch (err) {
    throw new Error(`Failed to get interview statistics: ${err.message}`);
  }
};

/**
 * Get interview timeline for a specific application
 */
const getApplicationInterviewTimeline = async (applicationId) => {
  try {
    const interview = await Interview.findOne({ applicationId })
      .populate('studentId', 'name email')
      .populate('companyId', 'name email companyName')
      .populate('internshipId', 'title')
      .lean();

    if (!interview) {
      return null;
    }

    return {
      applicationId,
      interview: {
        _id: interview._id,
        internshipTitle: interview.internshipId?.title,
        companyName: interview.companyId?.companyName || interview.companyId?.name,
        studentName: interview.studentId?.name,
        scheduledDate: interview.scheduledAt,
        mode: interview.mode,
      },
      timeline: interview.history.map((entry, idx) => ({
        sequence: idx + 1,
        status: entry.status,
        note: entry.note,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy,
      })),
      statusSummary: {
        initial: interview.history[0]?.status || 'Unknown',
        current: interview.status,
        studentConfirmation: interview.studentConfirmation,
        totalStatusChanges: interview.history.length,
      },
    };
  } catch (err) {
    throw new Error(`Failed to get application interview timeline: ${err.message}`);
  }
};

/**
 * Generate interview report for company with all details
 */
const generateCompanyInterviewReport = async (companyId, startDate = null, endDate = null) => {
  try {
    const filters = { companyId };
    if (startDate || endDate) {
      filters.scheduledAt = {};
      if (startDate) filters.scheduledAt.$gte = new Date(startDate);
      if (endDate) filters.scheduledAt.$lte = new Date(endDate);
    }

    const [interviews, stats] = await Promise.all([
      generateInterviewHistory(filters),
      getInterviewStatistics(companyId, startDate, endDate),
    ]);

    // Group by status
    const byStatus = {
      scheduled: interviews.filter(i => i.currentStatus === 'Scheduled'),
      completed: interviews.filter(i => i.currentStatus === 'Completed'),
      selected: interviews.filter(i => i.currentStatus === 'Selected'),
      rejected: interviews.filter(i => i.currentStatus === 'Rejected'),
    };

    // Group by confirmation status
    const byConfirmation = {
      confirmed: interviews.filter(i => i.studentConfirmation === 'Confirmed'),
      pending: interviews.filter(i => i.studentConfirmation === 'Pending'),
      declined: interviews.filter(i => i.studentConfirmation === 'Declined'),
    };

    return {
      generatedAt: new Date(),
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Today',
      },
      statistics: stats,
      byStatus,
      byConfirmation,
      totalInterviews: interviews.length,
      interviewDetails: interviews.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)),
    };
  } catch (err) {
    throw new Error(`Failed to generate company interview report: ${err.message}`);
  }
};

/**
 * Get interviews with recent status changes (for real-time updates)
 */
const getRecentInterviewUpdates = async (companyId = null, minutesAgo = 60) => {
  try {
    const timeThreshold = new Date(Date.now() - minutesAgo * 60000);

    const filter = { updatedAt: { $gte: timeThreshold } };
    if (companyId) filter.companyId = companyId;

    const interviews = await Interview.find(filter)
      .populate('studentId', 'name email')
      .populate('companyId', 'name email companyName')
      .populate('internshipId', 'title')
      .sort({ updatedAt: -1 })
      .lean();

    return interviews.map(interview => ({
      _id: interview._id,
      studentName: interview.studentId?.name,
      internshipTitle: interview.internshipId?.title,
      currentStatus: interview.status,
      studentConfirmation: interview.studentConfirmation,
      lastUpdate: interview.updatedAt,
      lastHistoryEntry: interview.history[interview.history.length - 1],
    }));
  } catch (err) {
    throw new Error(`Failed to get recent interview updates: ${err.message}`);
  }
};

module.exports = {
  generateInterviewHistory,
  getInterviewStatistics,
  getApplicationInterviewTimeline,
  generateCompanyInterviewReport,
  getRecentInterviewUpdates,
};
