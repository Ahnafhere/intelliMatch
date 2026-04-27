const Internship = require('../models/Internship');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

const buildSkillDemand = (internships = []) => {
  const freq = new Map();
  for (const post of internships) {
    for (const req of post.requiredSkills || []) {
      const key = (req.skill || '').trim().toLowerCase();
      if (!key) continue;
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
};

const getAdminDashboardAnalytics = async (req, res) => {
  try {
    const [internships, totalApplications, selectedApplications, profiles] = await Promise.all([
      Internship.find().lean(),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Selected' }),
      StudentProfile.find().lean(),
    ]);

    const deptMap = new Map();
    const selectedApps = await Application.find({ status: 'Selected' }).lean();
    const allApps = await Application.find().lean();

    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p.department || 'Unknown']));

    for (const app of allApps) {
      const dept = profileMap.get(app.studentId.toString()) || 'Unknown';
      const entry = deptMap.get(dept) || { department: dept, total: 0, selected: 0, ratio: 0 };
      entry.total += 1;
      deptMap.set(dept, entry);
    }

    for (const app of selectedApps) {
      const dept = profileMap.get(app.studentId.toString()) || 'Unknown';
      const entry = deptMap.get(dept) || { department: dept, total: 0, selected: 0, ratio: 0 };
      entry.selected += 1;
      deptMap.set(dept, entry);
    }

    const departmentPlacement = Array.from(deptMap.values())
      .map((d) => ({ ...d, ratio: d.total ? Number(((d.selected / d.total) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.ratio - a.ratio);

    const skillDemand = buildSkillDemand(internships);

    const deptSkillGap = departmentPlacement.map((dept) => {
      const deptProfiles = profiles.filter((p) => (p.department || 'Unknown') === dept.department);
      const studentSkills = new Set(deptProfiles.flatMap((p) => p.skills || []).map((s) => s.toLowerCase()));
      const demandedSkills = skillDemand.slice(0, 20).filter((s) => !studentSkills.has(s.skill));
      return {
        department: dept.department,
        topMissingSkills: demandedSkills.slice(0, 5),
      };
    });

    res.json({
      totalInternshipPostings: internships.length,
      totalApplications,
      selectedApplications,
      studentPlacementRatio: totalApplications ? Number(((selectedApplications / totalApplications) * 100).toFixed(2)) : 0,
      departmentPlacement,
      topInDemandSkills: skillDemand.slice(0, 10),
      emergingSkillTrends: skillDemand.slice(0, 15),
      departmentSkillDemandGap: deptSkillGap,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin analytics', error: err.message });
  }
};

const getCompanyApplicantAnalytics = async (req, res) => {
  try {
    const posts = await Internship.find({ companyId: req.user._id }).lean();
    const postIds = posts.map((p) => p._id);

    const applications = await Application.find({ internshipId: { $in: postIds } }).lean();
    const statusSummary = ['Pending', 'Shortlisted', 'Selected', 'Rejected'].map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));

    const byPost = posts.map((post) => {
      const related = applications.filter((a) => a.internshipId.toString() === post._id.toString());
      const avgMatch = related.length
        ? Number((related.reduce((sum, x) => sum + (Number(x.matchScore) || 0), 0) / related.length).toFixed(2))
        : 0;

      return {
        internshipId: post._id,
        title: post.title,
        applicants: related.length,
        shortlisted: related.filter((a) => a.status === 'Shortlisted').length,
        selected: related.filter((a) => a.status === 'Selected').length,
        avgMatch,
      };
    });

    const topSkills = buildSkillDemand(posts).slice(0, 10);

    res.json({
      totalPosts: posts.length,
      totalApplicants: applications.length,
      statusSummary,
      byPost,
      topRequestedSkills: topSkills,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch company analytics', error: err.message });
  }
};

const getStudentMatchTrends = async (req, res) => {
  try {
    const apps = await Application.find({ studentId: req.user._id })
      .populate('internshipId', 'title')
      .sort({ appliedAt: 1 });

    const statusSummary = ['Pending', 'Shortlisted', 'Selected', 'Rejected'].map((status) => ({
      status,
      count: apps.filter((a) => a.status === status).length,
    }));

    const trend = apps.map((a) => ({
      applicationId: a._id,
      title: a.internshipId?.title || 'Internship',
      appliedAt: a.appliedAt,
      matchScore: Number(a.matchScore || 0),
      recommendationScore: Number(a.recommendationScore || 0),
      status: a.status,
    }));

    const avgMatch = trend.length
      ? Number((trend.reduce((sum, x) => sum + x.matchScore, 0) / trend.length).toFixed(2))
      : 0;

    res.json({
      totalApplications: apps.length,
      avgMatchScore: avgMatch,
      statusSummary,
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student match trends', error: err.message });
  }
};

const getMarketSkillTrends = async (req, res) => {
  try {
    const internships = await Internship.find().lean();
    const profiles = await StudentProfile.find().lean();

    const requested = buildSkillDemand(internships);

    const departments = Array.from(new Set(profiles.map((profile) => profile.department || 'Unknown'))).sort();
    const departmentWiseSkillDemandGap = departments.map((department) => {
      const departmentProfiles = profiles.filter((profile) => (profile.department || 'Unknown') === department);
      const studentSkills = new Set(
        departmentProfiles.flatMap((profile) => profile.skills || []).map((skill) => skill.trim().toLowerCase()).filter(Boolean)
      );

      return {
        department,
        topMissingSkills: requested
          .slice(0, 20)
          .filter((skill) => !studentSkills.has(skill.skill))
          .slice(0, 5),
      };
    });

    res.json({
      mostRequestedTechnicalSkills: requested.slice(0, 20),
      emergingSkillTrends: requested.slice(0, 30),
      departmentWiseSkillDemandGap,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch market trends', error: err.message });
  }
};

const getAdminSystemSnapshot = async (req, res) => {
  try {
    const [users, activeCompanies, pendingCompanies] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'company', isActive: true, approvalStatus: 'approved' }),
      User.countDocuments({ role: 'company', approvalStatus: 'pending' }),
    ]);

    res.json({
      totalUsers: users,
      activeCompanies,
      pendingCompanies,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch snapshot', error: err.message });
  }
};

module.exports = {
  getAdminDashboardAnalytics,
  getCompanyApplicantAnalytics,
  getStudentMatchTrends,
  getMarketSkillTrends,
  getAdminSystemSnapshot,
};
