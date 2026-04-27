const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const StudentProfile = require('../models/StudentProfile');
const SkillVerification = require('../models/SkillVerification');
const InternshipFeedback = require('../models/InternshipFeedback');
const Internship = require('../models/Internship');
const InternshipTemplate = require('../models/InternshipTemplate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { normalizeWeights } = require('../utils/settingsService');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');

const getPendingCompanyRegistrations = async (req, res) => {
  try {
    const companies = await User.find({ role: 'company', approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending companies', error: err.message });
  }
};

const reviewCompanyRegistration = async (req, res) => {
  const { decision, moderationNote } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }

  try {
    const user = await User.findById(req.params.companyId);
    if (!user || user.role !== 'company') return res.status(404).json({ message: 'Company not found' });

    user.approvalStatus = decision;
    user.moderationNote = moderationNote || '';
    user.isActive = decision === 'approved';
    await user.save();

    await notify({
      userId: user._id,
      type: 'SYSTEM',
      title: 'Company Registration Reviewed',
      message: decision === 'approved'
        ? 'Your company account has been approved.'
        : 'Your company account has been rejected by the admin team.',
      metadata: { moderationNote: moderationNote || '' },
    });

    await logActivity({
      actor: req.user,
      action: 'COMPANY_REGISTRATION_REVIEWED',
      entityType: 'User',
      entityId: user._id,
      details: { decision, moderationNote: moderationNote || '' },
    });

    res.json({
      message: `Company ${decision}`,
      company: { _id: user._id, name: user.name, email: user.email, approvalStatus: user.approvalStatus },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to review company', error: err.message });
  }
};

const flagFraudulentAccount = async (req, res) => {
  const { isFraudulent, reason } = req.body;
  if (typeof isFraudulent !== 'boolean') {
    return res.status(400).json({ message: 'isFraudulent must be boolean' });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isFraudulent = isFraudulent;
    user.isActive = !isFraudulent;
    if (isFraudulent && user.role === 'company') {
      user.approvalStatus = 'rejected';
    }
    user.moderationNote = reason || '';
    await user.save();

    await notify({
      userId: user._id,
      type: 'SYSTEM',
      title: 'Account Moderation Update',
      message: isFraudulent
        ? 'Your account has been restricted due to policy violation.'
        : 'Your account restriction has been removed.',
      metadata: { reason: reason || '' },
    });

    await logActivity({
      actor: req.user,
      action: 'ACCOUNT_MODERATED',
      entityType: 'User',
      entityId: user._id,
      details: { isFraudulent, reason: reason || '' },
    });

    res.json({ message: 'Account moderation updated', user: { _id: user._id, isFraudulent: user.isFraudulent, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to moderate account', error: err.message });
  }
};

const getFraudulentAccounts = async (req, res) => {
  try {
    const users = await User.find({ isFraudulent: true })
      .select('-password')
      .sort({ updatedAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fraudulent accounts', error: err.message });
  }
};

const removeFraudulentAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isFraudulent) return res.status(400).json({ message: 'User is not marked as fraudulent' });
    if (['system_admin', 'university_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin accounts cannot be removed with this endpoint' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot remove your own account' });
    }

    const internships = await Internship.find({ companyId: user._id }).select('_id').lean();
    const internshipIds = internships.map((item) => item._id);

    const impactedApplications = await Application.find({
      $or: [
        { studentId: user._id },
        { internshipId: { $in: internshipIds } },
      ],
    }).select('_id').lean();
    const applicationIds = impactedApplications.map((item) => item._id);

    const [
      deletedNotifications,
      deletedStudentProfile,
      deletedSkillVerifications,
      deletedFeedback,
      deletedInterviews,
      deletedApplications,
      deletedTemplates,
      deletedInternships,
      deletedActivityLogs,
      deletedUser,
    ] = await Promise.all([
      Notification.deleteMany({ userId: user._id }),
      StudentProfile.deleteMany({ userId: user._id }),
      SkillVerification.deleteMany({
        $or: [
          { studentId: user._id },
          { verifiedBy: user._id },
        ],
      }),
      InternshipFeedback.deleteMany({
        $or: [
          { fromUserId: user._id },
          { toUserId: user._id },
          { internshipId: { $in: internshipIds } },
          { applicationId: { $in: applicationIds } },
        ],
      }),
      Interview.deleteMany({
        $or: [
          { studentId: user._id },
          { companyId: user._id },
          { internshipId: { $in: internshipIds } },
          { applicationId: { $in: applicationIds } },
        ],
      }),
      Application.deleteMany({
        $or: [
          { _id: { $in: applicationIds } },
          { studentId: user._id },
        ],
      }),
      InternshipTemplate.deleteMany({ companyId: user._id }),
      Internship.deleteMany({ companyId: user._id }),
      ActivityLog.deleteMany({ actorId: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    await logActivity({
      actor: req.user,
      action: 'FRAUDULENT_ACCOUNT_REMOVED',
      entityType: 'User',
      entityId: user._id,
      details: {
        removedEmail: user.email,
        removedRole: user.role,
        cleanup: {
          notifications: deletedNotifications.deletedCount,
          studentProfiles: deletedStudentProfile.deletedCount,
          skillVerifications: deletedSkillVerifications.deletedCount,
          feedbackRecords: deletedFeedback.deletedCount,
          interviews: deletedInterviews.deletedCount,
          applications: deletedApplications.deletedCount,
          templates: deletedTemplates.deletedCount,
          internships: deletedInternships.deletedCount,
          activityLogs: deletedActivityLogs.deletedCount,
          users: deletedUser.deletedCount,
        },
      },
    });

    res.json({
      message: 'Fraudulent account removed successfully',
      removedUserId: user._id,
      cleanup: {
        notifications: deletedNotifications.deletedCount,
        studentProfiles: deletedStudentProfile.deletedCount,
        skillVerifications: deletedSkillVerifications.deletedCount,
        feedbackRecords: deletedFeedback.deletedCount,
        interviews: deletedInterviews.deletedCount,
        applications: deletedApplications.deletedCount,
        templates: deletedTemplates.deletedCount,
        internships: deletedInternships.deletedCount,
        activityLogs: deletedActivityLogs.deletedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove fraudulent account', error: err.message });
  }
};

const updateAlgorithmWeights = async (req, res) => {
  const { skillWeight, cgpaWeight } = req.body;

  try {
    const normalized = normalizeWeights({ skillWeight, cgpaWeight });
    let setting = await SystemSetting.findOne();

    if (!setting) {
      setting = await SystemSetting.create({ recommendationWeights: normalized, updatedBy: req.user._id });
    } else {
      setting.recommendationWeights = normalized;
      setting.updatedBy = req.user._id;
      await setting.save();
    }

    await logActivity({
      actor: req.user,
      action: 'ALGORITHM_WEIGHTS_UPDATED',
      entityType: 'SystemSetting',
      entityId: setting._id,
      details: normalized,
    });

    res.json({ message: 'Algorithm weights updated', recommendationWeights: setting.recommendationWeights });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update algorithm weights', error: err.message });
  }
};

const getAlgorithmWeights = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne().lean();
    if (!setting) {
      return res.json({ recommendationWeights: { skillWeight: 0.75, cgpaWeight: 0.25 } });
    }

    res.json({ recommendationWeights: setting.recommendationWeights || { skillWeight: 0.75, cgpaWeight: 0.25 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch algorithm weights', error: err.message });
  }
};

const getSystemActivity = async (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  try {
    const logs = await ActivityLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: err.message });
  }
};

const getStudentsForSkillVerification = async (req, res) => {
  try {
    const profiles = await StudentProfile.find()
      .populate('userId', 'name email role isActive')
      .select('userId cgpa department skills verifiedSkills')
      .sort({ updatedAt: -1 })
      .lean();

    const profileMap = new Map();
    const studentIds = [];

    profiles
      .filter((profile) => profile?.userId && profile.userId.role === 'student')
      .filter((profile) => profile.userId.isActive !== false)
      .forEach((profile) => {
        const studentId = profile.userId._id.toString();
        profileMap.set(studentId, profile);
        studentIds.push(profile.userId._id);
      });

    const applications = await Application.find({ studentId: { $in: studentIds } })
      .populate('internshipId', 'title minCGPA requiredSkills')
      .select('studentId internshipId status appliedAt')
      .sort({ appliedAt: -1 })
      .lean();

    const normalizeSkill = (value = '') => value.toString().trim().toLowerCase();
    const dedupeSkills = (skills = []) => {
      const unique = new Map();
      (skills || []).forEach((item) => {
        const raw = (item || '').toString().trim();
        const key = normalizeSkill(raw);
        if (!key) return;
        if (!unique.has(key)) unique.set(key, raw);
      });
      return [...unique.values()];
    };

    const applicationsByStudent = applications.reduce((acc, app) => {
      const studentId = app.studentId?.toString();
      if (!studentId) return acc;
      if (!acc[studentId]) acc[studentId] = [];

      const profile = profileMap.get(studentId);
      const studentSkills = dedupeSkills([
        ...(profile?.skills || []),
        ...((profile?.verifiedSkills || []).map((entry) => entry?.skill).filter(Boolean)),
      ]);
      const studentSkillSet = new Set(studentSkills.map((skill) => normalizeSkill(skill)));

      const requiredSkills = (app.internshipId?.requiredSkills || [])
        .map((entry) => entry?.skill)
        .filter(Boolean);

      const matchedSkills = [];
      const missingSkills = [];
      requiredSkills.forEach((skill) => {
        if (studentSkillSet.has(normalizeSkill(skill))) {
          matchedSkills.push(skill);
        } else {
          missingSkills.push(skill);
        }
      });

      const skillMatchPercent = requiredSkills.length > 0
        ? Number(((matchedSkills.length / requiredSkills.length) * 100).toFixed(2))
        : 0;

      acc[studentId].push({
        applicationId: app._id,
        internshipId: app.internshipId?._id,
        internshipTitle: app.internshipId?.title || 'Untitled Internship',
        minCGPA: app.internshipId?.minCGPA || 0,
        requiredSkills,
        matchedSkills,
        missingSkills,
        skillMatchPercent,
        status: app.status,
        appliedAt: app.appliedAt,
      });

      return acc;
    }, {});

    const students = profiles
      .filter((profile) => profile?.userId && profile.userId.role === 'student')
      .filter((profile) => profile.userId.isActive !== false)
      .map((profile) => ({
        studentId: profile.userId._id,
        name: profile.userId.name,
        email: profile.userId.email,
        cgpa: profile.cgpa || 0,
        department: profile.department || '',
        topSkills: dedupeSkills([
          ...(profile.skills || []),
          ...((profile.verifiedSkills || []).map((entry) => entry?.skill).filter(Boolean)),
        ]).slice(0, 12),
        appliedInternships: applicationsByStudent[profile.userId._id.toString()] || [],
      }));

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students for verification', error: err.message });
  }
};

module.exports = {
  getPendingCompanyRegistrations,
  reviewCompanyRegistration,
  flagFraudulentAccount,
  getFraudulentAccounts,
  removeFraudulentAccount,
  getStudentsForSkillVerification,
  updateAlgorithmWeights,
  getAlgorithmWeights,
  getSystemActivity,
};
