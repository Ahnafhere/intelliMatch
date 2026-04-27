const InternshipFeedback = require('../models/InternshipFeedback');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');

const isCompletedInternship = (app) => (
  app?.status === 'Selected' ||
  app?.interviewStatus === 'Completed' ||
  app?.interviewStatus === 'Selected'
);

const submitFeedback = async (req, res) => {
  const {
    applicationId,
    technicalSkills,
    communication,
    teamwork,
    overallRating,
    comment,
  } = req.body;

  if (!applicationId || !overallRating) {
    return res.status(400).json({ message: 'applicationId and overallRating are required' });
  }

  try {
    const app = await Application.findById(applicationId).populate('internshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const internship = await Internship.findById(app.internshipId?._id || app.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    let direction = '';
    let toUserId;

    if (req.user.role === 'company') {
      if (internship.companyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      direction = 'company_to_student';
      toUserId = app.studentId;
    } else if (req.user.role === 'student') {
      if (app.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      if (!isCompletedInternship(app)) {
        return res.status(400).json({ message: 'Feedback is only available after your internship has been marked as completed or selected.' });
      }
      direction = 'student_to_company';
      toUserId = internship.companyId;
    } else {
      return res.status(403).json({ message: 'Only students or companies can submit feedback' });
    }

    const existing = await InternshipFeedback.findOne({ applicationId, direction, fromUserId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Feedback already submitted for this side' });

    const feedback = await InternshipFeedback.create({
      internshipId: internship._id,
      applicationId,
      fromUserId: req.user._id,
      toUserId,
      direction,
      technicalSkills,
      communication,
      teamwork,
      overallRating,
      comment: comment || '',
    });

    await notify({
      userId: toUserId,
      type: 'FEEDBACK_RECEIVED',
      title: 'New Internship Feedback',
      message: `You received new feedback for ${internship.title}.`,
      metadata: { feedbackId: feedback._id, applicationId },
    });

    await logActivity({
      actor: req.user,
      action: 'INTERNSHIP_FEEDBACK_SUBMITTED',
      entityType: 'InternshipFeedback',
      entityId: feedback._id,
      details: { applicationId, direction },
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};

const getFeedbackForApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.applicationId).populate('internshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const internship = await Internship.findById(app.internshipId?._id || app.internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const allowed =
      app.studentId.toString() === req.user._id.toString() ||
      internship.companyId.toString() === req.user._id.toString() ||
      ['system_admin', 'university_admin'].includes(req.user.role);

    if (!allowed) return res.status(403).json({ message: 'Unauthorized' });

    const feedback = await InternshipFeedback.find({ applicationId: req.params.applicationId })
      .populate('fromUserId', 'name role')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const feedback = await InternshipFeedback.find({ toUserId: req.user._id })
      .populate('internshipId', 'title companyName')
      .populate('fromUserId', 'name role')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

const getEligibleStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      studentId: req.user._id,
      $or: [
        { status: 'Selected' },
        { interviewStatus: 'Selected' },
        { interviewStatus: 'Completed' },
      ],
    })
      .populate('internshipId', 'title companyName')
      .sort({ updatedAt: -1 });

    const submittedFeedback = await InternshipFeedback.find({
      fromUserId: req.user._id,
      direction: 'student_to_company',
    }).select('applicationId');

    const submittedIds = new Set(submittedFeedback.map((item) => item.applicationId.toString()));
    const eligible = applications
      .filter((application) => !submittedIds.has(application._id.toString()))
      .map((application) => ({
        _id: application._id,
        internshipId: application.internshipId,
        status: application.status,
        interviewStatus: application.interviewStatus,
        appliedAt: application.appliedAt,
      }));

    res.json(eligible);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch eligible feedback applications', error: err.message });
  }
};

const getStudentCommunityFeedback = async (req, res) => {
  try {
    const feedback = await InternshipFeedback.find({ direction: 'student_to_company' })
      .populate('internshipId', 'title companyName')
      .populate('fromUserId', 'name role')
      .populate('applicationId', 'status interviewStatus appliedAt')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch community feedback', error: err.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackForApplication,
  getMyFeedback,
  getEligibleStudentApplications,
  getStudentCommunityFeedback,
};
