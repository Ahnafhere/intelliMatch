const StudentProfile = require('../models/StudentProfile');
const path = require('path');
const { fetchGitHubSkills, fetchGitHubProfile } = require('../utils/githubService');

// POST /api/student/profile — create
const createProfile = async (req, res) => {
  const { name, cgpa, department, graduationYear, certifications, projects, skills } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const existing = await StudentProfile.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' });

    // Convert skills to proper format (objects with name, proficiency, etc)
    const formattedSkills = (skills || []).map(s => 
      typeof s === 'object' ? s : {
        name: s,
        proficiency: 'Intermediate',
        endorsements: 0,
        addedAt: new Date()
      }
    );

    const profile = await StudentProfile.create({
      userId: req.user._id,
      name,
      cgpa,
      department,
      graduationYear,
      certifications: certifications || [],
      projects: projects || [],
      skills: formattedSkills,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/student/profile — update
const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.verifiedSkills;

    // Convert skills to proper format (objects with name, proficiency, etc)
    if (payload.skills) {
      payload.skills = (payload.skills || []).map(s => 
        typeof s === 'object' ? s : {
          name: s,
          proficiency: 'Intermediate',
          endorsements: 0,
          addedAt: new Date()
        }
      );
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      payload,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/student/profile/:id
const getProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.params.id }).populate('userId', 'name email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/student/profile/me - own profile
const getMyProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/student/github-skills/:githubUsername - Import skills from GitHub
const importGitHubSkills = async (req, res) => {
  const { githubUsername } = req.params;

  if (!githubUsername || typeof githubUsername !== 'string') {
    return res.status(400).json({ message: 'Invalid GitHub username' });
  }

  try {
    console.log(`[importGitHubSkills] Fetching skills for GitHub user: ${githubUsername}`);

    // Fetch GitHub skills
    const gitHubData = await fetchGitHubSkills(githubUsername);

    // Get or create student profile
    let profile = await StudentProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user._id,
        name: req.user.name || gitHubData.username,
        skills: [],
      });
    }

    // Convert GitHub languages to skills
    const importedSkills = gitHubData.languages.map((lang) => ({
      name: lang.name,
      proficiency: lang.proficiency,
      endorsements: 0,
      addedAt: new Date(),
    }));

    // Add topics as skills if not already present
    gitHubData.topics.forEach((topic) => {
      if (!profile.skills.find((s) => s.name.toLowerCase() === topic.toLowerCase())) {
        importedSkills.push({
          name: topic,
          proficiency: 'Intermediate',
          endorsements: 0,
          addedAt: new Date(),
        });
      }
    });

    // Merge with existing skills (avoid duplicates)
    const existingSkillNames = new Set(profile.skills.map((s) => s.name.toLowerCase()));
    const newSkills = importedSkills.filter(
      (skill) => !existingSkillNames.has(skill.name.toLowerCase())
    );

    profile.skills = [...profile.skills, ...newSkills];

    // Update profile with GitHub info
    profile.githubProfile = {
      username: gitHubData.username,
      profileUrl: gitHubData.profileUrl,
      repoCount: gitHubData.repoCount,
      lastImported: new Date(),
    };

    await profile.save();

    console.log(`[importGitHubSkills] Imported ${newSkills.length} skills for user ${req.user._id}`);

    res.json({
      message: 'Skills imported from GitHub successfully',
      importedCount: newSkills.length,
      totalSkills: profile.skills.length,
      profile,
      fetchedSkills: importedSkills,
    });
  } catch (error) {
    console.error('[importGitHubSkills] Error:', error.message);
    res.status(400).json({
      message: 'Failed to import GitHub skills',
      error: error.message,
    });
  }
};

module.exports = {
  createProfile,
  updateProfile,
  getProfile,
  getMyProfile,
  importGitHubSkills,
};
