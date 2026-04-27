const SkillVerification = require('../models/SkillVerification');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Internship = require('../models/Internship');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');
const {
  normalizeBadgeLevel,
  getBadgeForSource,
  calculateSkillMatch,
  getEndorsementBadgeLevel,
  pickHigherBadgeLevel,
} = require('../utils/skillBadgeService');

const ALLOWED_VERIFICATION_SOURCES = ['certification', 'project_review', 'internship_performance', 'manual'];

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

const verifyStudentSkill = async (req, res) => {
  const { studentId, internshipId, source, note } = req.body;
  if (!studentId || !internshipId) {
    return res.status(400).json({ message: 'studentId and internshipId are required' });
  }

  const normalizedSource = (source || 'manual').toString().trim().toLowerCase();
  if (!ALLOWED_VERIFICATION_SOURCES.includes(normalizedSource)) {
    return res.status(400).json({
      message: `source must be one of: ${ALLOWED_VERIFICATION_SOURCES.join(', ')}`,
    });
  }

  try {
    const [student, internship] = await Promise.all([
      User.findById(studentId).lean(),
      Internship.findById(internshipId).lean(),
    ]);

    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    let profile = await StudentProfile.findOne({ userId: studentId });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: studentId,
        name: student.name,
        cgpa: 0,
        department: '',
        skills: [],
      });
    }

    const studentSkills = dedupeSkills([
      ...(profile?.skills || []),
      ...((profile?.verifiedSkills || []).map((entry) => entry?.skill).filter(Boolean)),
    ]);

    const requiredSkills = dedupeSkills((internship.requiredSkills || []).map((item) => item?.skill));
    const requiredCount = requiredSkills.length;

    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach((requiredSkill) => {
      const bestScore = calculateSkillMatch(requiredSkill, studentSkills);
      if (bestScore >= 65) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    });

    const cgpa = Number(profile?.cgpa) || 0;
    const skillMatch = requiredCount > 0
      ? Number(((matchedSkills.length / requiredCount) * 100).toFixed(2))
      : 0;
    const badgeLevel = getEndorsementBadgeLevel({ cgpa, skillMatch });
    const verificationMode = missingSkills.length > 0 ? 'cgpa_only' : 'cgpa_and_skill';
    const verificationSkillLabel = internship.title || 'Internship Role Verification';

    const verification = await SkillVerification.create({
      studentId,
      internshipId: internship._id,
      internshipTitle: internship.title || '',
      skill: verificationSkillLabel,
      source: normalizedSource,
      note: note || '',
      badgeLevel,
      verificationMode,
      requiredSkills,
      matchedSkills,
      missingSkills,
      cgpa,
      skillMatch,
      verifiedBy: req.user._id,
      verifierRole: req.user.role,
    });

    const exists = (profile.verifiedSkills || []).find(
      (entry) => normalizeSkill(entry.skill) === normalizeSkill(verificationSkillLabel)
    );

    if (!exists) {
      profile.verifiedSkills.push({
        skill: verificationSkillLabel,
        verifiedBy: req.user._id,
        verifierRole: req.user.role,
        source: normalizedSource,
        note: note || '',
        badgeLevel,
        cgpa,
        skillMatch,
        verifiedAt: new Date(),
      });
    } else {
      exists.badgeLevel = pickHigherBadgeLevel(exists.badgeLevel, badgeLevel);
      exists.source = normalizedSource;
      exists.note = note || exists.note || '';
      exists.cgpa = cgpa;
      exists.skillMatch = skillMatch;
      exists.verifiedBy = req.user._id;
      exists.verifierRole = req.user.role;
      exists.verifiedAt = new Date();
    }

    await profile.save();

    await notify({
      userId: studentId,
      type: 'SYSTEM',
      title: 'Profile Verified For Internship Role',
      message: `You received a ${badgeLevel.toUpperCase()} badge for ${verificationSkillLabel}.`,
      metadata: { verificationId: verification._id },
    });

    await logActivity({
      actor: req.user,
      action: 'SKILL_VERIFIED',
      entityType: 'SkillVerification',
      entityId: verification._id,
      details: {
        studentId,
        internshipId,
        internshipTitle: internship.title || '',
        verificationMode,
        source: normalizedSource,
        badgeLevel,
      },
    });

    res.status(201).json(verification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify skill', error: err.message });
  }
};

const getMyVerifiedSkills = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('verifiedSkills.verifiedBy', 'name role');
    if (!profile) return res.json([]);
    const normalized = (profile.verifiedSkills || []).map((entry) => ({
      ...entry.toObject(),
      badgeLevel: normalizeBadgeLevel(entry.badgeLevel) || getBadgeForSource(entry.source),
    }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch verified skills', error: err.message });
  }
};

const getStudentVerifications = async (req, res) => {
  try {
    const data = await SkillVerification.find({ studentId: req.params.studentId })
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 });

    const normalized = data.map((entry) => ({
      ...entry.toObject(),
      badgeLevel: normalizeBadgeLevel(entry.badgeLevel) || getBadgeForSource(entry.source),
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch verifications', error: err.message });
  }
};

module.exports = {
  verifyStudentSkill,
  getMyVerifiedSkills,
  getStudentVerifications,
};
